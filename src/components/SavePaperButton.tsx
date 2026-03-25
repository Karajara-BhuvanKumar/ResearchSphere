import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabaseClient'
import { Heart, Loader2 } from 'lucide-react'

interface SavePaperButtonProps {
  paperId: string
  title: string
}

export const SavePaperButton = ({ paperId, title }: SavePaperButtonProps) => {
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
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('saved_papers')
        .select('id')
        .eq('paper_id', paperId)
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking if paper is saved:', error)
        return
      }

      setIsSaved(!!data)
    } catch (error) {
      console.error('Error checking if paper is saved:', error)
    }
  }

  const handleSavePaper = async () => {
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
        // Remove from saved papers
        const { error } = await supabase
          .from('saved_papers')
          .delete()
          .eq('paper_id', paperId)
          .eq('user_id', user.id)

        if (error) throw error

        setIsSaved(false)
        toast({
          title: 'Paper Removed',
          description: 'Paper removed from your saved papers',
        })
      } else {
        // Add to saved papers
        const { error } = await supabase
          .from('saved_papers')
          .insert({
            user_id: user.id,
            paper_id: paperId,
            title: title,
          })

        if (error) throw error

        setIsSaved(true)
        toast({
          title: 'Paper Saved',
          description: 'Paper added to your saved papers',
        })
      }
    } catch (error: any) {
      console.error('Error saving/removing paper:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to save/remove paper',
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
      onClick={handleSavePaper}
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