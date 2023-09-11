CREATE TABLE rooms (
  slug TEXT NOT NULL UNIQUE,
	name TEXT NOT NULL,
	description TEXT,
  hb_session_id TEXT
);

INSERT INTO rooms (slug, name, description) VALUES
  ('soup', '[primordial soup]', 'the og'),
  ('critter-corner', 'critter corner', 'fun for the whole family');
