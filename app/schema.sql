DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS hyperlinc_secret_keys;

CREATE TABLE users(
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  username TEXT PRIMARY KEY,
  hyperlink_id TEXT UNIQUE,
  hyperlink_public_key TEXT
);

CREATE TABLE hyperlinc_secret_keys(
  hyperlink_public_key TEXT PRIMARY KEY,
  hyperlink_secret_key TEXT -- should encrypt with app key irl
);
