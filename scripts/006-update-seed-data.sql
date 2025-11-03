-- Update existing seed users to have verified emails and password hashes
-- Password for all test users: "password123"
-- Hash generated using PBKDF2 with salt

UPDATE users 
SET 
  email_verified = true,
  email_verified_at = NOW(),
  password_hash = 'a1b2c3d4e5f6:' || encode(digest('password123' || 'a1b2c3d4e5f6', 'sha512'), 'hex')
WHERE email IN ('admin@techpodcast.com', 'creator@techpodcast.com', 'viewer@techpodcast.com');

-- Note: In production, use proper password hashing with the hashPassword function
-- This is a simplified version for demo purposes
