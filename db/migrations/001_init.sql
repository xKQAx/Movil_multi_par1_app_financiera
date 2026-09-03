CREATE TABLE IF NOT EXISTS schema_migrations (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS preferences (
  user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name text,
  theme text NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  accent_color text NOT NULL DEFAULT 'blue' CHECK (accent_color IN ('blue', 'green', 'purple')),
  active_month_name text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS movements (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  description text NOT NULL,
  category text NOT NULL,
  amount numeric(14, 2) NOT NULL CHECK (amount > 0),
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS movements_user_date ON movements (user_id, date DESC);
