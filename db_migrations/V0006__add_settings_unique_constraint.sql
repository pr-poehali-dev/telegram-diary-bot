-- Add unique constraint on settings table
ALTER TABLE settings ADD CONSTRAINT settings_owner_key_unique UNIQUE (owner_id, key);
