DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS hyperlinc_secret_keys;

CREATE TABLE users(
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  username TEXT PRIMARY KEY,
  hyperlink_id TEXT UNIQUE
);

CREATE TABLE hyperlinc_secret_keys(
  hyperlink_id TEXT PRIMARY KEY,
  hyperlink_secret_key TEXT -- should encrypt with app key irl
);
