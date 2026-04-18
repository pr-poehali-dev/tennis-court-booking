
CREATE TABLE IF NOT EXISTS t_p43674581_tennis_court_booking.users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p43674581_tennis_court_booking.bookings (
  id SERIAL PRIMARY KEY,
  user_phone VARCHAR(20) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  start_time VARCHAR(5) NOT NULL,
  duration NUMERIC(3,1) NOT NULL,
  extras_balls BOOLEAN DEFAULT FALSE,
  extras_rackets INT DEFAULT 0,
  extras_trainer BOOLEAN DEFAULT FALSE,
  total_price INT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p43674581_tennis_court_booking.reviews (
  id SERIAL PRIMARY KEY,
  author_phone VARCHAR(20) NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p43674581_tennis_court_booking.blocked_slots (
  id SERIAL PRIMARY KEY,
  type VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  hours JSONB DEFAULT '[]',
  all_day BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p43674581_tennis_court_booking.photos (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO t_p43674581_tennis_court_booking.photos (url) VALUES (
  'https://cdn.poehali.dev/projects/9d9345d5-e917-4edf-b2c8-5a3a59115d81/files/a28c0ef4-7573-4f6a-8232-51b3cb779a14.jpg'
);
