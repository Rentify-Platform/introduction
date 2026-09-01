-- Fix uuidv7(): the initial migration concatenated int8send(...) (8 bytes) with
-- gen_random_bytes(10), producing 18 bytes / 36 hex chars which always failed the
-- uuid cast. Any database migrated from scratch therefore could not insert rows
-- that rely on the uuidv7() default (e.g. cancellations), making admin cancellation
-- fail with a 500. Keep the intended v7 layout: 48-bit timestamp + 10 random bytes.
CREATE OR REPLACE FUNCTION uuidv7() RETURNS uuid AS $$
DECLARE
    v_time double precision;
    v_bytes bytea;
BEGIN
    v_time := extract(epoch from clock_timestamp());
    v_bytes := substring(int8send(floor(v_time * 1000)::bigint) from 3) || gen_random_bytes(10);
    v_bytes := set_byte(v_bytes, 6, (get_byte(v_bytes, 6) & 15) | 112);
    v_bytes := set_byte(v_bytes, 7, (get_byte(v_bytes, 7) & 63) | 128);
    RETURN encode(v_bytes, 'hex')::uuid;
END;
$$ LANGUAGE plpgsql;
