-- Nova AI Agent OS — Database Schema
-- Run this in Supabase SQL Editor after enabling pgvector

-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  model TEXT DEFAULT 'llama-3.3-70b-versatile',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL DEFAULT '',
  tool_name TEXT,
  tool_input JSONB,
  tool_output JSONB,
  model TEXT,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memory
CREATE TABLE IF NOT EXISTS memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('fact', 'preference', 'project', 'contact', 'goal', 'custom')),
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'archived')),
  due_at TIMESTAMPTZ,
  recurring_cron TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uploaded files (metadata — actual files in Supabase Storage)
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  storage_path TEXT,
  chunks_count INTEGER DEFAULT 0,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- File chunks (for RAG)
CREATE TABLE IF NOT EXISTS file_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES uploaded_files(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice sessions
CREATE TABLE IF NOT EXISTS voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transcript JSONB DEFAULT '[]'::jsonb,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  system_prompt TEXT DEFAULT 'You are Nova, a personal AI assistant. You are helpful, concise, and proactive.',
  default_model TEXT DEFAULT 'llama-3.3-70b-versatile',
  voice_model TEXT DEFAULT 'sonic-2',
  voice_id TEXT DEFAULT 'a0e99841-438c-4a64-b679-ae501e7d6091',
  active_providers JSONB DEFAULT '["groq", "cerebras", "openrouter"]'::jsonb,
  fallback_chain JSONB DEFAULT '["groq", "cerebras", "openrouter"]'::jsonb,
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_memory_user ON memory(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_category ON memory(user_id, category);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_at);
CREATE INDEX IF NOT EXISTS idx_file_chunks_file ON file_chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user ON uploaded_files(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user ON voice_sessions(user_id);

-- Vector indexes (run after inserting initial data for better performance)
-- CREATE INDEX idx_memory_embedding ON memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- CREATE INDEX idx_file_chunks_embedding ON file_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users access own sessions" ON sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own messages" ON messages
  FOR ALL USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users access own memory" ON memory
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own files" ON uploaded_files
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own file chunks" ON file_chunks
  FOR ALL USING (
    file_id IN (SELECT id FROM uploaded_files WHERE user_id = auth.uid())
  );

CREATE POLICY "Users access own voice sessions" ON voice_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Vector similarity search function for memory
CREATE OR REPLACE FUNCTION match_memory(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_id_param uuid
)
RETURNS TABLE(id uuid, content text, category text, similarity float)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.category,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM memory m
  WHERE m.user_id = user_id_param
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Vector similarity search function for file chunks
CREATE OR REPLACE FUNCTION match_file_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  file_id_param uuid
)
RETURNS TABLE(id uuid, chunk_text text, chunk_index int, similarity float)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fc.id,
    fc.chunk_text,
    fc.chunk_index,
    1 - (fc.embedding <=> query_embedding) AS similarity
  FROM file_chunks fc
  WHERE fc.file_id = file_id_param
    AND 1 - (fc.embedding <=> query_embedding) > match_threshold
  ORDER BY fc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER memory_updated_at
  BEFORE UPDATE ON memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
