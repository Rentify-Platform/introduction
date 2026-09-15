-- Preserve penalty history instead of hard-deleting administrative records.
ALTER TABLE "host_penalties"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN "voided_at" TIMESTAMPTZ(6),
  ADD COLUMN "void_reason" TEXT,
  ADD COLUMN "voided_by_admin_id" UUID;

ALTER TABLE "host_penalties"
  ADD CONSTRAINT "host_penalties_status_check"
  CHECK ("status" IN ('active', 'voided'));

ALTER TABLE "host_penalties"
  ADD CONSTRAINT "host_penalties_void_audit_check"
  CHECK (
    ("status" = 'active' AND "voided_at" IS NULL AND "void_reason" IS NULL AND "voided_by_admin_id" IS NULL)
    OR
    ("status" = 'voided' AND "voided_at" IS NOT NULL AND "void_reason" IS NOT NULL AND btrim("void_reason") <> '' AND "voided_by_admin_id" IS NOT NULL)
  );

ALTER TABLE "host_penalties"
  ADD CONSTRAINT "host_penalties_voided_by_admin_id_fkey"
  FOREIGN KEY ("voided_by_admin_id") REFERENCES "accounts"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE INDEX "idx_host_penalties_status" ON "host_penalties"("status");

ALTER TABLE "host_profiles"
  ADD COLUMN "superhost_updated_at" TIMESTAMPTZ(6),
  ADD COLUMN "superhost_update_reason" TEXT,
  ADD COLUMN "superhost_updated_by_admin_id" UUID;

ALTER TABLE "host_profiles"
  ADD CONSTRAINT "host_profiles_superhost_updated_by_admin_id_fkey"
  FOREIGN KEY ("superhost_updated_by_admin_id") REFERENCES "accounts"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
