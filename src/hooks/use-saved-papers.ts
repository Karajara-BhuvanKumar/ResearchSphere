import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './use-auth'
import { SavedPapersService } from '@/lib/savedPapersService'
import type { UserSavedPaper } from '@/lib/database.types'

export const useSavedPapers = () => {
  const [savedPapers, setSavedPapers] = useState<UserSavedPaper[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const loadSavedPapers = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const papers = await SavedPapersService.getSavedPapers()
      setSavedPapers(papers)
    } catch (error) {
      console.error('Error loading saved papers:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const savePaper = useCallback(async (title: string, paperId: string) => {
    try {
      const savedPaper = await SavedPapersService.savePaper({ title, paper_id: paperId })
      setSavedPapers(prev => [savedPaper, ...prev])
      return true
    } catch (error) {
      console.error('Error saving paper:', error)
      return false
    }
  }, [])

  const removeSavedPaper = useCallback(async (paperId: string) => {
    try {
      await SavedPapersService.removeSavedPaper(paperId)
      setSavedPapers(prev => prev.filter(paper => paper.paper_id !== paperId))
      return true
    } catch (error) {
      console.error('Error removing saved paper:', error)
      return false
    }
  }, [])

  const isPaperSaved = useCallback((paperId: string) => {
    return savedPapers.some(paper => paper.paper_id === paperId)
  }, [savedPapers])

  useEffect(() => {
    loadSavedPapers()
  }, [loadSavedPapers])

  return {
    savedPapers,
    loading,
    savePaper,
    removeSavedPaper,
    isPaperSaved,
    refreshSavedPapers: loadSavedPapers,
  }
}