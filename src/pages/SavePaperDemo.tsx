import { SavePaperButton } from '@/components/SavePaperButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const SavePaperDemo = () => {
  // Example papers data
  const examplePapers = [
    {
      id: '2301.12345',
      title: 'Attention Is All You Need',
      authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar'],
      abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...',
    },
    {
      id: '2302.67890',
      title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
      authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee'],
      abstract: 'We introduce a new language representation model called BERT...',
    },
    {
      id: '2303.11111',
      title: 'Generative Adversarial Networks',
      authors: ['Ian J. Goodfellow', 'Jean Pouget-Abadie', 'Mehdi Mirza'],
      abstract: 'We propose a new framework for estimating generative models...',
    },
  ]

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Save Paper Feature Demo</h1>
      <p className="text-muted-foreground mb-6">
        Click the "Save" button on any paper to save it to your Supabase database.
        The button will show "Saved" when a paper is saved, and you can click again to remove it.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {examplePapers.map((paper) => (
          <Card key={paper.id} className="h-full">
            <CardHeader>
              <CardTitle className="text-lg leading-tight">{paper.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Authors: {paper.authors.join(', ')}
              </p>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm mb-4 line-clamp-3">{paper.abstract}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Paper ID: {paper.id}
                </span>
                <SavePaperButton paperId={paper.id} title={paper.title} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-2">How it works:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Checks if user is authenticated</li>
          <li>Gets current logged-in user ID</li>
          <li>Inserts into "saved_papers" table with user_id, paper_id, and title</li>
          <li>Uses <code className="bg-background px-1 rounded">supabase.from("saved_papers").insert()</code></li>
          <li>Prevents duplicate saves with unique constraint</li>
          <li>Shows loading states and success/error messages</li>
        </ul>
      </div>
    </div>
  )
}

export default SavePaperDemo