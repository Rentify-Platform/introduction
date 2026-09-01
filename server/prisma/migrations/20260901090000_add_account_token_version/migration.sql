-- Add a per-account session version so status changes invalidate old JWTs.
ALTER TABLE "accounts"
ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 0;
