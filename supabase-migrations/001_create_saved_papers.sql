-- Create saved_papers table
CREATE TABLE IF NOT EXISTS saved_papers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  paper_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure a user can't save the same paper twice
  UNIQUE(user_id, paper_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_papers_user_id ON saved_papers(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_papers_created_at ON saved_papers(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE user_saved_papers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own saved papers
CREATE POLICY "Users can view their own saved papers" ON saved_papers
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own saved papers
CREATE POLICY "Users can insert their own saved papers" ON saved_papers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own saved papers
CREATE POLICY "Users can delete their own saved papers" ON saved_papers
  FOR DELETE USING (auth.uid() = user_id);