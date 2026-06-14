-- Phase 1: Learning System Schema
-- Tables for logging activities and analyzing patterns

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  agent TEXT NOT NULL,
  task_type TEXT,
  content_type TEXT,
  topic TEXT,
  channel TEXT,
  status TEXT CHECK(status IN ('success', 'failed', 'partial')),
  result TEXT
);

CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  content_type TEXT,
  topic TEXT,
  channel TEXT,
  impressions INTEGER DEFAULT 0,
  engagement_rate REAL DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  new_followers INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, content_type, topic, channel)
);

CREATE TABLE IF NOT EXISTS patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern_type TEXT NOT NULL,
  insight TEXT NOT NULL,
  data TEXT,
  confidence REAL,
  sample_size INTEGER,
  created_date TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(pattern_type, insight)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);
CREATE INDEX IF NOT EXISTS idx_activities_agent ON activities(agent);
CREATE INDEX IF NOT EXISTS idx_activities_topic ON activities(topic);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date);
CREATE INDEX IF NOT EXISTS idx_patterns_type ON patterns(pattern_type);
