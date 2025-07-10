-- Create stories table for preset story content
CREATE TABLE stories (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL,
  level       INT  NOT NULL CHECK (level IN (1,2,3)),
  title       TEXT NOT NULL,
  tokens      TEXT[] NOT NULL,
  glossary    JSONB,            -- For future use, currently NULL or []
  word_count  INT  NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (slug, level)
);

-- Create index for faster queries
CREATE INDEX idx_stories_slug ON stories(slug);
CREATE INDEX idx_stories_level ON stories(level);

-- Insert sample comment
COMMENT ON TABLE stories IS 'Preset story content with different difficulty levels';
COMMENT ON COLUMN stories.slug IS 'Story identifier (e.g., "notting-hill")';
COMMENT ON COLUMN stories.level IS 'Difficulty level: 1=A1+A2, 2=B1, 3=B2';
COMMENT ON COLUMN stories.tokens IS 'Tokenized words for display';
COMMENT ON COLUMN stories.glossary IS 'Word definitions and hints (future use)';