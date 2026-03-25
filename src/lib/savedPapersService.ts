import { supabase } from './supabaseClient'
import type { UserSavedPaper, UserSavedPaperInsert } from './database.types'

export class SavedPapersService {
  // Get all saved papers for the current user
  static async getSavedPapers(): Promise<UserSavedPaper[]> {
    const { data, error } = await supabase
      .from('saved_papers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching saved papers:', error)
      throw error
    }

    return data || []
  }

  // Save a paper for the current user
  static async savePaper(paper: Omit<UserSavedPaperInsert, 'user_id'>): Promise<UserSavedPaper> {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User must be authenticated to save papers')
    }

    const { data, error } = await supabase
      .from('saved_papers')
      .insert({
        ...paper,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving paper:', error)
      throw error
    }

    return data
  }

  // Remove a saved paper
  static async removeSavedPaper(paperId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User must be authenticated to remove papers')
    }

    const { error } = await supabase
      .from('saved_papers')
      .delete()
      .eq('paper_id', paperId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error removing saved paper:', error)
      throw error
    }
  }

  // Check if a paper is saved by the current user
  static async isPaperSaved(paperId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    const { data, error } = await supabase
      .from('saved_papers')
      .select('id')
      .eq('paper_id', paperId)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking if paper is saved:', error)
      throw error
    }

    return !!data
  }

  // Get saved paper count for current user
  static async getSavedPapersCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return 0
    }

    const { count, error } = await supabase
      .from('saved_papers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error getting saved papers count:', error)
      throw error
    }

    return count || 0
  }
}