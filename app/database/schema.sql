DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS did_documents;

CREATE TABLE users(
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  username TEXT PRIMARY KEY,
  realname TEXT NOT NULL,
  did TEXT UNIQUE
);

CREATE TABLE did_documents(
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  did text PRIMARY KEY,
  signing_public_key text NOT NULL,
  encrypting_public_key text NOT NULL,
  secret text NOT NULL,
  encrypted_signing_private_key text NOT NULL,
  encrypted_encrypting_private_key text NOT NULL,
  encrypted_registration_secret text NOT NULL
);

