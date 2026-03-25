// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      saved_papers: {
        Row: {
          id: string
          user_id: string
          title: string
          paper_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          paper_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          paper_id?: string
          created_at?: string
        }
      }
    }
  }
}

export type UserSavedPaper = Database['public']['Tables']['saved_papers']['Row']
export type UserSavedPaperInsert = Database['public']['Tables']['saved_papers']['Insert']
export type UserSavedPaperUpdate = Database['public']['Tables']['saved_papers']['Update']