-- CreateExtension
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create set_updated_at helper function
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 1. ACCOUNTS  (auth identity — kept intentionally thin & hot)
-- =====================================================================
CREATE TYPE account_role   AS ENUM ('guest','host','admin');
CREATE TYPE account_status AS ENUM ('active','suspended','banned','deleted');
CREATE TYPE kyc_status     AS ENUM ('unverified','pending','verified','rejected','expired');

CREATE TABLE accounts (
    id              UUID PRIMARY KEY DEFAULT uuidv7(),
    email           CITEXT UNIQUE NOT NULL,
    phone           TEXT UNIQUE,
    password_hash   TEXT,                       -- NULL if OAuth-only login
    role            account_role NOT NULL DEFAULT 'guest',
    status          account_status NOT NULL DEFAULT 'active',
    email_verified_at TIMESTAMPTZ,
    phone_verified_at TIMESTAMPTZ,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);
CREATE TRIGGER trg_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Profile data split off so identity churn (name/avatar edits) never
-- touches the auth-hot `accounts` row.
CREATE TABLE profiles (
    account_id        UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    first_name        TEXT NOT NULL,
    last_name         TEXT NOT NULL,
    date_of_birth     DATE,
    avatar_url        TEXT,
    bio               TEXT,
    locale            TEXT NOT NULL DEFAULT 'en',
    timezone          TEXT NOT NULL DEFAULT 'UTC',
    guest_kyc_status  kyc_status NOT NULL DEFAULT 'unverified',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE host_profiles (
    account_id           UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    about                TEXT,
    is_superhost         BOOLEAN NOT NULL DEFAULT FALSE,
    response_rate_pct    SMALLINT CHECK (response_rate_pct BETWEEN 0 AND 100),
    avg_response_minutes INTEGER,
    kyc_status           kyc_status NOT NULL DEFAULT 'unverified',
    tax_country          CHAR(2),
    tax_id_enc           BYTEA,                  -- pgp_sym_encrypt'd, never plaintext
    tax_form_type        TEXT,
    tax_verified          BOOLEAN NOT NULL DEFAULT FALSE,
    payout_provider       TEXT,
    payout_account_id     TEXT,                   -- external account ref only, never raw bank/card details
    payout_account_verified BOOLEAN NOT NULL DEFAULT FALSE,
    became_host_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_host_profiles_updated_at BEFORE UPDATE ON host_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE payment_methods (
    id              UUID PRIMARY KEY DEFAULT uuidv7(),
    account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    provider        TEXT NOT NULL,
    provider_pm_id  TEXT NOT NULL,
    brand           TEXT,
    last4           CHAR(4),
    exp_month       SMALLINT CHECK (exp_month BETWEEN 1 AND 12),
    exp_year        SMALLINT,
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_pm_id)
);

-- =====================================================================
-- 2. CANCELLATION / REFUND POLICY ENGINE  (data-driven, admin-editable)
-- =====================================================================
CREATE TABLE cancellation_policies (
    code                          TEXT PRIMARY KEY,
    label                         TEXT NOT NULL,
    free_cancel_grace_hours       INT NOT NULL DEFAULT 24,   -- universal grace period window
    free_cancel_min_days_before_checkin INT NOT NULL DEFAULT 7, -- grace only applies if booked >= N days before check-in
    active                        BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from                DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Graduated refund tiers per policy. Evaluated by days-before-checkin
-- at the moment of cancellation; first matching tier (highest
-- min_days_before_checkin <= actual) wins.
CREATE TABLE cancellation_policy_tiers (
    id                      BIGSERIAL PRIMARY KEY,
    policy_code             TEXT NOT NULL REFERENCES cancellation_policies(code),
    applies_after_checkin    BOOLEAN NOT NULL DEFAULT FALSE,   -- separate ruleset once guest has checked in
    min_days_before_checkin  INT NOT NULL,                     -- inclusive lower bound; 0 = day of arrival
    guest_refund_pct         NUMERIC(5,2) NOT NULL CHECK (guest_refund_pct BETWEEN 0 AND 100),
    host_payout_pct          NUMERIC(5,2) NOT NULL CHECK (host_payout_pct BETWEEN 0 AND 100),
    host_extra_nights        NUMERIC(4,1) NOT NULL DEFAULT 0,  -- flat compensation nights on top of pct
    refund_cleaning_fee      BOOLEAN NOT NULL DEFAULT TRUE,
    refund_service_fee       BOOLEAN NOT NULL DEFAULT FALSE,
    refund_taxes_pct         NUMERIC(5,2) NOT NULL DEFAULT 100,
    UNIQUE (policy_code, applies_after_checkin, min_days_before_checkin)
);
CREATE INDEX idx_policy_tiers_lookup
    ON cancellation_policy_tiers (policy_code, applies_after_checkin, min_days_before_checkin DESC);

-- Seed data reflecting Airbnb's published 2026 framework (Flexible / Moderate / Firm / Limited / Non-refundable).
INSERT INTO cancellation_policies (code, label) VALUES
    ('flexible', 'Flexible'),
    ('moderate', 'Moderate'),
    ('firm', 'Firm'),
    ('limited', 'Limited'),
    ('non_refundable', 'Non-refundable'),
    ('long_term', 'Long-term stay (28+ nights)');

INSERT INTO cancellation_policy_tiers
    (policy_code, applies_after_checkin, min_days_before_checkin, guest_refund_pct, host_payout_pct, host_extra_nights, refund_cleaning_fee, refund_service_fee, refund_taxes_pct) VALUES
    -- Flexible: full refund up to 24h before check-in
    ('flexible', FALSE, 1,   100, 0,   0, TRUE,  TRUE,  100),
    ('flexible', FALSE, 0,     0, 100, 0, FALSE, FALSE, 100),
    ('flexible', TRUE,  0,     0, 100, 1, FALSE, FALSE, 100),  -- after check-in: host paid for stay + 1 extra night

    -- Moderate: full refund up to 5 days before check-in
    ('moderate', FALSE, 5,   100, 0,   0, TRUE,  TRUE,  100),
    ('moderate', FALSE, 0,    50, 50,  0, FALSE, FALSE, 100),
    ('moderate', TRUE,  0,     0, 100, 1, FALSE, FALSE, 100),

    -- Firm: full refund >=30d, 50% between 7-30d, 0% under 7d
    ('firm', FALSE, 30,  100,   0, 0, TRUE,  TRUE,  100),
    ('firm', FALSE, 7,    50,  50, 0, FALSE, FALSE, 100),
    ('firm', FALSE, 0,     0, 100, 0, FALSE, FALSE, 100),

    -- Limited: full refund >=14d, 50% between 7-14d, 0% under 7d
    ('limited', FALSE, 14, 100,   0, 0, TRUE,  TRUE,  100),
    ('limited', FALSE, 7,   50,  50, 0, FALSE, FALSE, 100),
    ('limited', FALSE, 0,    0, 100, 0, FALSE, FALSE, 100),

    -- Non-refundable: no refund at any point (still typically sold at a discount)
    ('non_refundable', FALSE, 0, 0, 100, 0, FALSE, FALSE, 100);

-- Singleton table for platform-wide settings
CREATE TABLE platform_config (
    singleton   BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
    fee_rules   JSONB NOT NULL DEFAULT '{}',   -- e.g. {"default_pct": 12, "by_room_type": {...}, "by_country": {...}}
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_platform_config_updated_at BEFORE UPDATE ON platform_config
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
INSERT INTO platform_config (fee_rules) VALUES ('{"default_pct": 12}');

-- =====================================================================
-- 3. PROPERTIES / CALENDAR
-- =====================================================================
CREATE TYPE property_status AS ENUM ('draft','active','paused','archived');
CREATE TYPE room_type       AS ENUM ('entire_place','private_room','shared_room','hotel_room');

CREATE TABLE property_types (id SMALLSERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL, label TEXT NOT NULL);
CREATE TABLE amenities (id SMALLSERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL, label TEXT NOT NULL, category TEXT);

CREATE TABLE properties (
    id                   UUID PRIMARY KEY DEFAULT uuidv7(),
    host_id              UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    property_type_id     SMALLINT NOT NULL REFERENCES property_types(id),
    room_type            room_type NOT NULL,
    status               property_status NOT NULL DEFAULT 'draft',
    title                TEXT NOT NULL,
    description          TEXT,
    address_line1        TEXT NOT NULL,
    address_line2        TEXT,
    city                 TEXT NOT NULL,
    state_province       TEXT,
    country_code         CHAR(2) NOT NULL,
    postal_code          TEXT,
    latitude             NUMERIC(9,6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude            NUMERIC(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    max_guests           SMALLINT NOT NULL CHECK (max_guests > 0),
    bedrooms             SMALLINT NOT NULL DEFAULT 0,
    beds                 SMALLINT NOT NULL DEFAULT 0,
    bathrooms            NUMERIC(3,1) NOT NULL DEFAULT 0,
    base_price_cents     BIGINT NOT NULL CHECK (base_price_cents >= 0),
    cleaning_fee_cents   BIGINT NOT NULL DEFAULT 0,
    currency             CHAR(3) NOT NULL DEFAULT 'VND',
    minimum_nights       SMALLINT NOT NULL DEFAULT 1,
    maximum_nights       SMALLINT NOT NULL DEFAULT 365,
    check_in_time        TIME NOT NULL DEFAULT '15:00',
    check_out_time       TIME NOT NULL DEFAULT '11:00',
    instant_book         BOOLEAN NOT NULL DEFAULT FALSE,
    cancellation_policy_code TEXT NOT NULL DEFAULT 'moderate' REFERENCES cancellation_policies(code),
    requires_local_license BOOLEAN NOT NULL DEFAULT FALSE,  -- jurisdictions where a permit is mandatory before going live
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at         TIMESTAMPTZ,
    deleted_at           TIMESTAMPTZ
);
CREATE TRIGGER trg_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_properties_lat_lng ON properties (latitude, longitude);
CREATE INDEX idx_properties_host ON properties (host_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_status_active ON properties (status) WHERE status = 'active' AND deleted_at IS NULL;

CREATE TABLE property_amenities (
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    amenity_id  SMALLINT NOT NULL REFERENCES amenities(id),
    PRIMARY KEY (property_id, amenity_id)
);

CREATE TABLE property_photos (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    url TEXT NOT NULL, caption TEXT, position SMALLINT NOT NULL DEFAULT 0,
    UNIQUE (property_id, position)
);

CREATE TABLE property_calendar (
    property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    date          DATE NOT NULL,
    is_available  BOOLEAN NOT NULL DEFAULT TRUE,
    price_cents   BIGINT,
    min_stay      SMALLINT,
    PRIMARY KEY (property_id, date)
);

-- =====================================================================
-- 4. KYC  — guest + host verification
-- =====================================================================
CREATE TYPE kyc_doc_type    AS ENUM (
    'passport','national_id','drivers_license',     -- identity (guest + host)
    'utility_bill','tax_document','bank_statement',  -- proof of address (host)
    'business_license'                               -- short-term-rental permit (host, per property)
);
CREATE TYPE kyc_doc_status  AS ENUM ('pending','verified','rejected','expired');
CREATE TYPE kyc_check_type  AS ENUM (
    'identity_document',   -- OCR/validity check on passport/ID/license
    'facial_match',        -- selfie vs ID photo, liveness
    'background_check',    -- criminal/watchlist screen (required for US residents)
    'address_verification',-- utility bill / tax bill matches listing address
    'business_license',    -- local STR permit validity
    'tax_info',             -- tax ID format + country validity
    'bank_account_match'   -- payout account name matches verified identity
);
CREATE TYPE kyc_check_result AS ENUM ('pass','fail','review_required');

CREATE TABLE kyc_documents (
    id                  UUID PRIMARY KEY DEFAULT uuidv7(),
    account_id          UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    doc_type            kyc_doc_type NOT NULL,
    country_code        CHAR(2),
    document_number_enc BYTEA,                 -- pgp_sym_encrypt'd; index only a hash if you need lookups
    file_url_front      TEXT NOT NULL,
    file_url_back       TEXT,
    issue_date          DATE,
    expiry_date         DATE,
    status              kyc_doc_status NOT NULL DEFAULT 'pending',
    rejection_reason    TEXT,
    reviewed_by         UUID REFERENCES accounts(id),
    reviewed_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_kyc_documents_account ON kyc_documents (account_id, doc_type);

CREATE TABLE kyc_checks (
    id                  UUID PRIMARY KEY DEFAULT uuidv7(),
    account_id          UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    check_type          kyc_check_type NOT NULL,
    related_document_id UUID REFERENCES kyc_documents(id),
    provider            TEXT NOT NULL,
    provider_reference_id TEXT,
    result               kyc_check_result NOT NULL,
    score                NUMERIC(5,2),           -- e.g. facial-match confidence 0-100
    raw_response         JSONB,
    expires_at           TIMESTAMPTZ,            -- background checks need periodic re-screening
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_kyc_checks_account ON kyc_checks (account_id, check_type, created_at DESC);

CREATE TABLE property_licenses (
    id              UUID PRIMARY KEY DEFAULT uuidv7(),
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    license_number  TEXT,
    issuing_authority TEXT,
    file_url        TEXT,
    expiry_date     DATE,
    status          kyc_doc_status NOT NULL DEFAULT 'pending',
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger function and trigger to enforce listing activation KYC rules
CREATE OR REPLACE FUNCTION fn_check_listing_activation() RETURNS TRIGGER AS $$
DECLARE
    v_host_kyc kyc_status;
    v_has_license BOOLEAN;
BEGIN
    IF NEW.status = 'active' AND (OLD.status IS DISTINCT FROM 'active') THEN
        SELECT kyc_status INTO v_host_kyc
        FROM host_profiles WHERE account_id = NEW.host_id;

        IF v_host_kyc IS DISTINCT FROM 'verified' THEN
            RAISE EXCEPTION 'Host % is not KYC-verified; cannot activate listing', NEW.host_id;
        END IF;

        IF NEW.requires_local_license THEN
            SELECT EXISTS (
                SELECT 1 FROM property_licenses
                WHERE property_id = NEW.id AND status = 'verified'
                  AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
            ) INTO v_has_license;
            IF NOT v_has_license THEN
                RAISE EXCEPTION 'Property % requires a verified local license to activate', NEW.id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_listing_activation BEFORE INSERT OR UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION fn_check_listing_activation();

-- =====================================================================
-- 5. BOOKINGS
-- =====================================================================
CREATE TYPE booking_status  AS ENUM ('pending','confirmed','cancelled_by_guest','cancelled_by_host','completed','expired');

CREATE TABLE bookings (
    id                   UUID PRIMARY KEY DEFAULT uuidv7(),
    property_id          UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    guest_id             UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    host_id              UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    status               booking_status NOT NULL DEFAULT 'pending',
    check_in             DATE NOT NULL,
    check_out            DATE NOT NULL,
    stay_range           DATERANGE GENERATED ALWAYS AS (daterange(check_in, check_out, '[)')) STORED,
    guests_count         SMALLINT NOT NULL CHECK (guests_count > 0),
    nightly_rate_cents   BIGINT NOT NULL CHECK (nightly_rate_cents >= 0),
    nights               INTEGER NOT NULL GENERATED ALWAYS AS (check_out - check_in) STORED,
    cleaning_fee_cents   BIGINT NOT NULL DEFAULT 0,
    service_fee_cents    BIGINT NOT NULL DEFAULT 0,
    taxes_cents          BIGINT NOT NULL DEFAULT 0,
    total_price_cents    BIGINT NOT NULL CHECK (total_price_cents >= 0),
    currency             CHAR(3) NOT NULL DEFAULT 'VND',
    cancellation_policy_code TEXT NOT NULL REFERENCES cancellation_policies(code), -- snapshot of the policy AT TIME OF BOOKING (never changes later)
    booked_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    cancelled_at         TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_dates CHECK (check_out > check_in),
    CONSTRAINT excl_bookings_no_overlap
        EXCLUDE USING GIST (property_id WITH =, stay_range WITH &&)
        WHERE (status IN ('pending','confirmed'))
);
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_bookings_guest ON bookings (guest_id, created_at DESC);
CREATE INDEX idx_bookings_host ON bookings (host_id, created_at DESC);
CREATE INDEX idx_bookings_property_dates ON bookings (property_id, check_in, check_out);

CREATE OR REPLACE FUNCTION fn_check_booking_consistency() RETURNS TRIGGER AS $$
DECLARE
    v_max_guests SMALLINT;
BEGIN
    SELECT max_guests INTO v_max_guests FROM properties WHERE id = NEW.property_id;
    IF NEW.guests_count > v_max_guests THEN
        RAISE EXCEPTION 'Booking guests_count (%) exceeds property % max_guests (%)',
            NEW.guests_count, NEW.property_id, v_max_guests;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_booking_consistency BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION fn_check_booking_consistency();

-- =====================================================================
-- 6. LEDGER ACCOUNTS / TRANSACTIONS
-- =====================================================================
CREATE TYPE ledger_owner_type AS ENUM ('platform','host','guest','tax_authority');
CREATE TYPE ledger_txn_type   AS ENUM (
    'booking_payment',  -- guest's card charged, money lands in platform escrow
    'platform_fee',     -- service fee carved out of escrow into platform revenue
    'host_accrual',     -- host's net share moved from escrow into host_payable
    'refund',           -- money moved back out to the guest's payment method
    'payout',           -- host_payable -> host's bank account
    'tax_remittance',   -- tax_payable -> tax authority
    'adjustment'        -- manual correction, always requires `created_by`
);

CREATE TABLE ledger_accounts (
    id              UUID PRIMARY KEY DEFAULT uuidv7(),
    owner_type      ledger_owner_type NOT NULL,
    owner_account_id UUID REFERENCES accounts(id),   -- NULL for platform/tax_authority
    account_subtype TEXT NOT NULL,                    -- 'escrow','revenue','payable','wallet','clearing','tax_payable'
    currency        CHAR(3) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (owner_type, owner_account_id, account_subtype, currency)
);

CREATE UNIQUE INDEX uq_ledger_accounts_ownerless_singleton
    ON ledger_accounts (owner_type, account_subtype, currency)
    WHERE owner_account_id IS NULL;

CREATE TABLE ledger_transactions (
    id              UUID PRIMARY KEY DEFAULT uuidv7(),
    idempotency_key TEXT NOT NULL UNIQUE,   -- caller-supplied; makes retries safe
    type            ledger_txn_type NOT NULL,
    booking_id      UUID REFERENCES bookings(id),
    description     TEXT,
    metadata        JSONB,
    created_by      UUID REFERENCES accounts(id),  -- NULL = system-generated
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 7. CANCELLATIONS  (one row per booking cancellation event)
-- =====================================================================
CREATE TYPE cancelled_by_role AS ENUM ('guest','host','admin','system');

CREATE TABLE cancellations (
    id                    UUID PRIMARY KEY DEFAULT uuidv7(),
    booking_id            UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    cancelled_by_account_id UUID REFERENCES accounts(id),
    cancelled_by_role     cancelled_by_role NOT NULL,
    reason_code           TEXT,
    reason_text           TEXT,
    days_before_checkin   INT NOT NULL,           -- snapshot at the moment of cancellation
    applied_policy_code   TEXT NOT NULL REFERENCES cancellation_policies(code),
    applied_tier_id        BIGINT REFERENCES cancellation_policy_tiers(id),
    guest_refund_cents     BIGINT NOT NULL,
    host_payout_cents      BIGINT NOT NULL,
    platform_fee_kept_cents BIGINT NOT NULL DEFAULT 0,
    override_reason        TEXT,                  -- set when Trust & Safety overrides the computed result
    override_by_admin_id    UUID REFERENCES accounts(id),
    ledger_transaction_id   UUID REFERENCES ledger_transactions(id),
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cancellations_booking ON cancellations (booking_id);

CREATE OR REPLACE FUNCTION fn_check_host_cancellation() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.cancelled_by_role = 'host' AND NEW.guest_refund_cents <>
       (SELECT total_price_cents FROM bookings WHERE id = NEW.booking_id) THEN
        RAISE EXCEPTION 'Host-initiated cancellations must fully refund the guest';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_host_cancellation BEFORE INSERT ON cancellations
    FOR EACH ROW EXECUTE FUNCTION fn_check_host_cancellation();

CREATE TABLE host_penalties (
    id           UUID PRIMARY KEY DEFAULT uuidv7(),
    host_id      UUID NOT NULL REFERENCES accounts(id),
    booking_id   UUID REFERENCES bookings(id),
    penalty_type TEXT NOT NULL,
    amount_cents BIGINT NOT NULL DEFAULT 0,
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Function to resolve cancellation refunds
CREATE OR REPLACE FUNCTION fn_resolve_cancellation(
    p_booking_id UUID,
    p_cancelled_by_role cancelled_by_role,
    p_at TIMESTAMPTZ DEFAULT now()
) RETURNS TABLE (
    days_before_checkin INT,
    applied_policy_code TEXT,
    applied_tier_id BIGINT,
    guest_refund_cents BIGINT,
    host_payout_cents BIGINT
) AS $$
DECLARE
    b RECORD;
    pol RECORD;
    tier RECORD;
    v_days INT;
    v_after_checkin BOOLEAN;
    v_in_grace BOOLEAN;
BEGIN
    SELECT * INTO b FROM bookings WHERE id = p_booking_id;
    SELECT * INTO pol FROM cancellation_policies WHERE code = b.cancellation_policy_code;

    v_days := b.check_in - p_at::date;
    v_after_checkin := p_at::date >= b.check_in;

    -- Host cancellation: always 100% guest refund, handled by caller
    -- writing host_penalties; short-circuit the tier lookup.
    IF p_cancelled_by_role = 'host' THEN
        RETURN QUERY SELECT v_days, b.cancellation_policy_code, NULL::BIGINT,
                             b.total_price_cents, 0::BIGINT;
        RETURN;
    END IF;

    -- Universal grace period: free cancellation shortly after booking,
    -- provided the booking itself was made far enough in advance.
    v_in_grace := pol.free_cancel_grace_hours IS NOT NULL
        AND p_at <= b.booked_at + (pol.free_cancel_grace_hours || ' hours')::interval
        AND (b.check_in - b.booked_at::date) >= pol.free_cancel_min_days_before_checkin;

    IF v_in_grace THEN
        RETURN QUERY SELECT v_days, b.cancellation_policy_code, NULL::BIGINT,
                             b.total_price_cents, 0::BIGINT;
        RETURN;
    END IF;

    SELECT * INTO tier FROM cancellation_policy_tiers
    WHERE policy_code = b.cancellation_policy_code
      AND applies_after_checkin = v_after_checkin
      AND min_days_before_checkin <= GREATEST(v_days, 0)
    ORDER BY min_days_before_checkin DESC
    LIMIT 1;

    RETURN QUERY SELECT
        v_days,
        b.cancellation_policy_code,
        tier.id,
        -- nightly portion split by pct, taxes by their own pct, fees per flags
        ROUND(b.nightly_rate_cents * b.nights * tier.guest_refund_pct / 100.0)
          + ROUND(b.taxes_cents * tier.refund_taxes_pct / 100.0)
          + (CASE WHEN tier.refund_cleaning_fee THEN b.cleaning_fee_cents ELSE 0 END)
          + (CASE WHEN tier.refund_service_fee THEN b.service_fee_cents ELSE 0 END),
        ROUND(b.nightly_rate_cents * b.nights * tier.host_payout_pct / 100.0)
          + ROUND(b.nightly_rate_cents * tier.host_extra_nights);
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 8. LEDGER ENTRIES / BALANCES
-- =====================================================================
CREATE TABLE ledger_entries (
    id                 BIGSERIAL PRIMARY KEY,
    transaction_id     UUID NOT NULL REFERENCES ledger_transactions(id) ON DELETE RESTRICT,
    ledger_account_id  UUID NOT NULL REFERENCES ledger_accounts(id) ON DELETE RESTRICT,
    amount_cents       BIGINT NOT NULL,     -- signed: + increases balance, - decreases
    currency           CHAR(3) NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ledger_entries_account ON ledger_entries (ledger_account_id, created_at);
CREATE INDEX idx_ledger_entries_txn ON ledger_entries (transaction_id);

CREATE OR REPLACE FUNCTION fn_prevent_ledger_entry_mutation() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'ledger_entries is append-only; % is not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ledger_entries_immutable
    BEFORE UPDATE OR DELETE ON ledger_entries
    FOR EACH ROW EXECUTE FUNCTION fn_prevent_ledger_entry_mutation();

CREATE OR REPLACE FUNCTION fn_check_ledger_balance() RETURNS TRIGGER AS $$
DECLARE
    v_unbalanced RECORD;
BEGIN
    SELECT currency, SUM(amount_cents) AS total INTO v_unbalanced
    FROM ledger_entries
    WHERE transaction_id = COALESCE(NEW.transaction_id, OLD.transaction_id)
    GROUP BY currency
    HAVING SUM(amount_cents) <> 0
    LIMIT 1;

    IF v_unbalanced IS NOT NULL THEN
        RAISE EXCEPTION 'Ledger transaction % is unbalanced (% = %)',
            COALESCE(NEW.transaction_id, OLD.transaction_id), v_unbalanced.currency, v_unbalanced.total;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_ledger_balance
    AFTER INSERT OR UPDATE OR DELETE ON ledger_entries
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION fn_check_ledger_balance();

CREATE TABLE ledger_balances (
    ledger_account_id UUID PRIMARY KEY REFERENCES ledger_accounts(id),
    balance_cents     BIGINT NOT NULL DEFAULT 0,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION fn_apply_ledger_entry() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO ledger_balances (ledger_account_id, balance_cents, updated_at)
    VALUES (NEW.ledger_account_id, NEW.amount_cents, now())
    ON CONFLICT (ledger_account_id)
    DO UPDATE SET balance_cents = ledger_balances.balance_cents + NEW.amount_cents,
                  updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_apply_ledger_entry AFTER INSERT ON ledger_entries
    FOR EACH ROW EXECUTE FUNCTION fn_apply_ledger_entry();

-- External payments
CREATE TYPE payment_status AS ENUM ('pending','authorized','captured','refunded','partially_refunded','failed');

CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT uuidv7(),
    booking_id          UUID NOT NULL REFERENCES bookings(id),
    payment_method_id   UUID REFERENCES payment_methods(id),
    ledger_transaction_id UUID REFERENCES ledger_transactions(id),
    status              payment_status NOT NULL DEFAULT 'pending',
    amount_cents        BIGINT NOT NULL CHECK (amount_cents >= 0),
    currency            CHAR(3) NOT NULL,
    provider            TEXT NOT NULL,
    provider_intent_id  TEXT,
    failure_reason      TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_intent_id)
);
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TYPE payout_status AS ENUM ('pending','processing','paid','failed');

CREATE TABLE payouts (
    id                  UUID PRIMARY KEY DEFAULT uuidv7(),
    host_id             UUID NOT NULL REFERENCES accounts(id),
    ledger_transaction_id UUID NOT NULL REFERENCES ledger_transactions(id),
    amount_cents        BIGINT NOT NULL CHECK (amount_cents >= 0),
    currency            CHAR(3) NOT NULL,
    status              payout_status NOT NULL DEFAULT 'pending',
    scheduled_for       DATE NOT NULL,
    paid_at             TIMESTAMPTZ,
    provider_payout_id  TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payouts_host_status ON payouts (host_id, status);

CREATE OR REPLACE FUNCTION fn_check_payout_eligibility() RETURNS TRIGGER AS $$
DECLARE
    v_tax_verified    BOOLEAN;
    v_payout_verified BOOLEAN;
BEGIN
    SELECT tax_verified, payout_account_verified INTO v_tax_verified, v_payout_verified
    FROM host_profiles WHERE account_id = NEW.host_id;

    IF NOT COALESCE(v_tax_verified, FALSE) THEN
        RAISE EXCEPTION 'Host % is not tax-verified; cannot create payout', NEW.host_id;
    END IF;
    IF NOT COALESCE(v_payout_verified, FALSE) THEN
        RAISE EXCEPTION 'Host % payout account is not verified; cannot create payout', NEW.host_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_payout_eligibility BEFORE INSERT ON payouts
    FOR EACH ROW EXECUTE FUNCTION fn_check_payout_eligibility();

-- =====================================================================
-- 9. REVIEWS / WISHLISTS
-- =====================================================================
CREATE TYPE review_type AS ENUM ('guest_to_host','host_to_guest');

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    type review_type NOT NULL,
    author_id UUID NOT NULL REFERENCES accounts(id),
    target_id UUID NOT NULL REFERENCES accounts(id),
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    host_response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (booking_id, type)
);

CREATE TABLE wishlists (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'My wishlist',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE wishlist_items (
    wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    PRIMARY KEY (wishlist_id, property_id)
);
