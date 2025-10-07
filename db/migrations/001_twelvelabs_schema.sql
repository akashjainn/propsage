-- TwelveLabs Video Management Schema
-- Add to your existing database migration

-- Table to track indexed videos
CREATE TABLE IF NOT EXISTS tl_videos (
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(255) UNIQUE NOT NULL,      -- TwelveLabs video ID
  external_ref VARCHAR(255),                   -- Your internal reference (game ID, etc.)
  title VARCHAR(500) NOT NULL,
  s3_url TEXT NOT NULL,                        -- Original video URL
  duration_seconds INTEGER,
  status VARCHAR(20) DEFAULT 'indexing',       -- indexing, ready, failed
  task_id VARCHAR(255),                        -- TL indexing task ID
  
  -- Metadata
  team_home VARCHAR(100),
  team_away VARCHAR(100),
  game_date DATE,
  league VARCHAR(50) DEFAULT 'CFB',
  season INTEGER DEFAULT 2025,
  
  -- Timestamps
  indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ready_at TIMESTAMP,
  
  -- Indexing metadata
  index_id VARCHAR(255) NOT NULL,             -- TL index used
  
  INDEX idx_video_id (video_id),
  INDEX idx_external_ref (external_ref),
  INDEX idx_status (status),
  INDEX idx_game_date (game_date)
);

-- Table to cache search results
CREATE TABLE IF NOT EXISTS tl_search_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,     -- hash of (query + filters)
  query_text TEXT NOT NULL,
  filters JSON,                                -- game_id, player_id, etc.
  results JSON NOT NULL,                       -- serialized search results
  hit_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  
  INDEX idx_cache_key (cache_key),
  INDEX idx_expires_at (expires_at)
);

-- Table to track player-video associations
CREATE TABLE IF NOT EXISTS tl_player_videos (
  id SERIAL PRIMARY KEY,
  player_id VARCHAR(100) NOT NULL,            -- Your player ID format
  video_id VARCHAR(255) NOT NULL,             -- TL video ID
  relevance_score FLOAT DEFAULT 0.0,          -- How relevant this video is to this player
  
  -- Derived from TL search or manual tagging
  tagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (video_id) REFERENCES tl_videos(video_id) ON DELETE CASCADE,
  UNIQUE KEY unique_player_video (player_id, video_id),
  INDEX idx_player_id (player_id)
);

-- Table for moment/clip bookmarks (optional - for user favorites)
CREATE TABLE IF NOT EXISTS tl_moments (
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(255) NOT NULL,
  start_time FLOAT NOT NULL,
  end_time FLOAT NOT NULL,
  label VARCHAR(255),
  query_used TEXT,                             -- Original search query that found this
  score FLOAT,                                 -- TL relevance score
  
  -- Context
  game_context JSON,                           -- game info, teams, etc.
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (video_id) REFERENCES tl_videos(video_id) ON DELETE CASCADE,
  INDEX idx_video_timerange (video_id, start_time, end_time)
);