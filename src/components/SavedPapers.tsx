import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { SavedPapersService } from '@/lib/savedPapersService'
import { Heart, Loader2 } from 'lucide-react'
import type { UserSavedPaper } from '@/lib/database.types'

interface SavePaperButtonProps {
  paperId: string
  title: string
  onSaveChange?: (isSaved: boolean) => void
}

export const SavePaperButton = ({ paperId, title, onSaveChange }: SavePaperButtonProps) => {
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user && paperId) {
      checkIfSaved()
    }
  }, [user, paperId])

  const checkIfSaved = async () => {
    try {
      const saved = await SavedPapersService.isPaperSaved(paperId)
      setIsSaved(saved)
      onSaveChange?.(saved)
    } catch (error) {
      console.error('Error checking if paper is saved:', error)
    }
  }

  const handleToggleSave = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to save papers',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      if (isSaved) {
        await SavedPapersService.removeSavedPaper(paperId)
        setIsSaved(false)
        toast({
          title: 'Paper Removed',
          description: 'Paper removed from your saved papers',
        })
      } else {
        await SavedPapersService.savePaper({
          title,
          paper_id: paperId,
        })
        setIsSaved(true)
        toast({
          title: 'Paper Saved',
          description: 'Paper added to your saved papers',
        })
      }
      onSaveChange?.(!isSaved)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save/remove paper',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null // Don't show button if not authenticated
  }

  return (
    <Button
      variant={isSaved ? "default" : "outline"}
      size="sm"
      onClick={handleToggleSave}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
      )}
      {isSaved ? 'Saved' : 'Save'}
    </Button>
  )
}

// Example component showing saved papers list
export const SavedPapersList = () => {
  const [papers, setPapers] = useState<UserSavedPaper[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadSavedPapers()
    }
  }, [user])

  const loadSavedPapers = async () => {
    try {
      const savedPapers = await SavedPapersService.getSavedPapers()
      setPapers(savedPapers)
    } catch (error) {
      console.error('Error loading saved papers:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Please sign in to view your saved papers</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          <p className="mt-2">Loading saved papers...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Saved Papers ({papers.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {papers.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No saved papers yet. Click the heart icon on papers to save them!
          </p>
        ) : (
          <div className="space-y-4">
            {papers.map((paper) => (
              <div key={paper.id} className="border rounded-lg p-4">
                <h3 className="font-medium">{paper.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Paper ID: {paper.paper_id}
                </p>
                <p className="text-xs text-muted-foreground">
                  Saved on {new Date(paper.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}