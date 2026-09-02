-- Phase 3: audit fields for admin cancellation overrides.
-- Overrides that change amounts now also post a balanced ledger adjustment
-- transaction; the override keeps the previous amounts and the adjustment
-- transaction id for reconciliation between the cancellation report and the ledger.
ALTER TABLE "cancellations" ADD COLUMN "override_previous_guest_refund_cents" BIGINT;
ALTER TABLE "cancellations" ADD COLUMN "override_previous_host_payout_cents" BIGINT;
ALTER TABLE "cancellations" ADD COLUMN "override_previous_platform_fee_kept_cents" BIGINT;
ALTER TABLE "cancellations" ADD COLUMN "override_ledger_transaction_id" UUID;

ALTER TABLE "cancellations" ADD CONSTRAINT "cancellations_override_ledger_transaction_id_fkey"
   FOREIGN KEY ("override_ledger_transaction_id") REFERENCES "ledger_transactions"("id")
   ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE INDEX "idx_cancellations_override_ledger_txn"
   ON "cancellations"("override_ledger_transaction_id");
