-- Rename columns in 'users' table to match new API requirements
ALTER TABLE users RENAME COLUMN name TO full_name;
ALTER TABLE users RENAME COLUMN mobile TO mobile_primary;

-- Verify the changes
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users';
