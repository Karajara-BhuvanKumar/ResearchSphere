# Supabase Database Schema

## Saved Papers Table

This table allows users to save/bookmark research papers for later reference.

### Schema

```sql
CREATE TABLE saved_papers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  paper_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, paper_id)
);
```

### Fields

- `id` → UUID (auto-generated primary key)
- `user_id` → UUID (references auth.users.id, cascades on delete)
- `title` → TEXT (paper title)
- `paper_id` → TEXT (unique identifier for the paper)
- `created_at` → TIMESTAMP (auto-set to current time)

### Constraints

- Primary key on `id`
- Foreign key constraint on `user_id` referencing `auth.users(id)`
- Unique constraint on `(user_id, paper_id)` to prevent duplicate saves
- Row Level Security (RLS) enabled

### RLS Policies

- Users can only view their own saved papers
- Users can only insert papers for themselves
- Users can only delete their own saved papers

## Running the Migration

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-migrations/001_create_user_saved_papers.sql`
4. Run the migration

## Usage in Code

```typescript
import { SavePaperButton } from '@/components/SavePaperButton'

// In a paper component
<SavePaperButton paperId="123456" title="Deep Learning Paper" />
```

### Save Paper Implementation

The save paper feature works as follows:

1. **Authentication Check**: Ensures user is logged in
2. **Get Current User**: Retrieves the authenticated user's ID
3. **Database Insert**: Uses `supabase.from("saved_papers").insert()` with:
   - `user_id`: Current user's UUID
   - `paper_id`: Unique identifier for the paper
   - `title`: Paper title
4. **Duplicate Prevention**: Unique constraint prevents saving the same paper twice
5. **UI Feedback**: Shows loading states and success/error messages

### Demo Page

Visit `/save-paper-demo` to see the save paper feature in action with example papers.