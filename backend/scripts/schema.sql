-- BeatDraft Database Schema

-- Drop tables if exist (per re-init)
DROP TABLE IF EXISTS lineup_cards CASCADE;
DROP TABLE IF EXISTS user_cards CASCADE;
DROP TABLE IF EXISTS competition_participants CASCADE;
DROP TABLE IF EXISTS competitions CASCADE;
DROP TABLE IF EXISTS artist_stats_history CASCADE;
DROP TABLE IF EXISTS artists CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  coins INTEGER DEFAULT 3000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Artists table
CREATE TABLE artists (
  id SERIAL PRIMARY KEY,
  spotify_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  emoji VARCHAR(10),
  monthly_listeners BIGINT DEFAULT 0,
  followers BIGINT DEFAULT 0,
  category VARCHAR(50), -- Leggendario, Mondiale, Grande, Emergente, Sconosciuto
  is_legacy BOOLEAN DEFAULT false,
  genre VARCHAR(100),
  image_url TEXT,
  popularity INTEGER DEFAULT 0,
  chart_position_it INTEGER,
  chart_position_global INTEGER,
  last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Artist stats history (per calcolare growth)
CREATE TABLE artist_stats_history (
  id SERIAL PRIMARY KEY,
  artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
  monthly_listeners BIGINT,
  followers BIGINT,
  chart_position_it INTEGER,
  chart_position_global INTEGER,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User owned cards
CREATE TABLE user_cards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
  rarity VARCHAR(20) NOT NULL, -- Common, Rare, Epic, Platinum
  mint_number INTEGER,
  total_supply INTEGER,
  purchase_price INTEGER,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, artist_id, rarity, mint_number)
);

-- Competitions
CREATE TABLE competitions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  emoji VARCHAR(10),
  status VARCHAR(20) DEFAULT 'upcoming', -- upcoming, live, ended
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  prize VARCHAR(100),
  eligibility_criteria JSONB, -- {categories: [], rarities: []}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Competition participants
CREATE TABLE competition_participants (
  id SERIAL PRIMARY KEY,
  competition_id INTEGER REFERENCES competitions(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  total_score INTEGER DEFAULT 0,
  rank INTEGER,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(competition_id, user_id)
);

-- Lineup cards for competitions
CREATE TABLE lineup_cards (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER REFERENCES competition_participants(id) ON DELETE CASCADE,
  card_id INTEGER REFERENCES user_cards(id) ON DELETE CASCADE,
  slot_category VARCHAR(50), -- Leggendario, Mondiale, etc.
  week_score INTEGER DEFAULT 0,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(participant_id, slot_category)
);

-- Indexes for performance
CREATE INDEX idx_artists_category ON artists(category);
CREATE INDEX idx_artists_spotify_id ON artists(spotify_id);
CREATE INDEX idx_user_cards_user ON user_cards(user_id);
CREATE INDEX idx_user_cards_artist ON user_cards(artist_id);
CREATE INDEX idx_competitions_status ON competitions(status);
CREATE INDEX idx_artist_stats_recorded ON artist_stats_history(recorded_at);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
