import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { Loader2, ExternalLink, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/lib/database.types'

type SavedPaper = Database['public']['Tables']['saved_papers']['Row']

const SavedPapers = () => {
  const [papers, setPapers] = useState<SavedPaper[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchSavedPapers()
  }, [])

  const fetchSavedPapers = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error('Error getting user:', userError)
        toast({
          title: 'Error',
          description: 'Failed to get user information',
          variant: 'destructive',
        })
        return
      }

      if (!user) {
        toast({
          title: 'Not authenticated',
          description: 'Please log in to view saved papers',
          variant: 'destructive',
        })
        return
      }

      // Fetch saved papers using the exact query specified
      const { data, error } = await supabase
        .from('saved_papers')
        .select('*')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error fetching saved papers:', error)
        toast({
          title: 'Error',
          description: 'Failed to load saved papers',
          variant: 'destructive',
        })
        return
      }

      setPapers(data || [])
    } catch (error) {
      console.error('Error in fetchSavedPapers:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const removeSavedPaper = async (paperId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: 'Not authenticated',
          description: 'Please log in to remove papers',
          variant: 'destructive',
        })
        return
      }

      const { error } = await supabase
        .from('saved_papers')
        .delete()
        .eq('paper_id', paperId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error removing saved paper:', error)
        toast({
          title: 'Error',
          description: 'Failed to remove paper',
          variant: 'destructive',
        })
        return
      }

      // Update local state
      setPapers(prev => prev.filter(paper => paper.paper_id !== paperId))

      toast({
        title: 'Paper removed',
        description: 'Paper has been removed from your saved papers',
      })
    } catch (error) {
      console.error('Error in removeSavedPaper:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your saved papers...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Saved Papers</h1>
          <p className="text-muted-foreground">
            Your collection of saved research papers ({papers.length} total)
          </p>
        </div>

        {papers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">No saved papers yet</h3>
              <p className="text-muted-foreground mb-4">
                Start saving papers by clicking the heart icon on papers you find interesting.
              </p>
              <Button onClick={() => window.location.href = '/save-paper-demo'}>
                View Demo Papers
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {papers.map((paper) => (
              <Card key={paper.id} className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight flex-1 mr-2">
                      {paper.title}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSavedPaper(paper.paper_id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Paper ID: {paper.paper_id}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <strong>Saved on:</strong> {new Date(paper.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://arxiv.org/abs/${paper.paper_id}`, '_blank')}
                        className="flex-1"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Paper
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default SavedPapers