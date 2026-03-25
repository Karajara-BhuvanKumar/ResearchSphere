import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import type { ResearchPaper } from "@/pages/ResearchFeed";

export type AddPaperProps = {
  papers: ResearchPaper[];
  setPapers: Dispatch<SetStateAction<ResearchPaper[]>>;
  className?: string;
};

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function createPaperId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `paper-${Date.now()}`;
}

export default function AddPaper({ papers, setPapers, className }: AddPaperProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [abstract, setAbstract] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const paper: ResearchPaper = {
      id: createPaperId(),
      title: title.trim(),
      author: author.trim(),
      abstract: abstract.trim(),
      tags: parseTags(tagsInput),
    };
    setPapers((prev) => [...prev, paper]);
    setTitle("");
    setAuthor("");
    setAbstract("");
    setTagsInput("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Add paper
              </h1>
              <p className="mt-2 text-muted-foreground">
                New entries appear in your research feed ({papers.length} in feed).
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/research-feed">View feed</Link>
            </Button>
          </div>
          <form
            onSubmit={handleSubmit}
            className={cn(
              "mx-auto w-full max-w-lg space-y-5 rounded-xl border border-border/80 bg-card p-6 shadow-sm",
              className,
            )}
          >
            <div className="space-y-1.5">
              <Label htmlFor="add-paper-title">Title</Label>
              <Input
                id="add-paper-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Paper title"
                required
                className="bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-paper-author">Author</Label>
              <Input
                id="add-paper-author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Authors"
                className="bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-paper-abstract">Abstract</Label>
              <Textarea
                id="add-paper-abstract"
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="Summary or abstract"
                rows={5}
                className="min-h-[120px] resize-y bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-paper-tags">Tags</Label>
              <Input
                id="add-paper-tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. NLP, ML, Ethics"
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">Separate tags with commas</p>
            </div>

            <Button type="submit" className="w-full sm:w-auto">
              Add paper
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
