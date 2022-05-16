DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS hyperlinc_secret_keys;

CREATE TABLE users(
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  username TEXT PRIMARY KEY NOT NULL,
  jlinx_account_id TEXT UNIQUE
);

CREATE TABLE tweets(
  id INTEGER PRIMARY KEY SEQUENCE,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  username TEXT REFERENCES users.username,
  content TEXT
);
