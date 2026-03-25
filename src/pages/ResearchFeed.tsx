import { useEffect, useMemo, useState } from "react";
import { Bookmark, Heart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";

export type ResearchPaper = {
  id: string;
  title: string;
  author: string;
  abstract: string;
  tags: string[];
};

export const INITIAL_RESEARCH_PAPERS: ResearchPaper[] = [
  {
    id: "1",
    title: "Efficient Transformers for Long-Context Reasoning Tasks",
    author: "Dr. Anya Sharma & Marco Liu",
    abstract:
      "We propose a sparse attention mechanism that scales linearly with sequence length while preserving recall on document-level QA benchmarks. Our method combines block-local attention with a learned routing module.",
    tags: ["NLP", "Transformers", "Efficiency"],
  },
  {
    id: "2",
    title: "Robust Federated Learning Under Non-IID Client Data",
    author: "James Okonkwo",
    abstract:
      "Federated learning often degrades when client distributions diverge. This work introduces a consensus regularizer and adaptive client weighting that stabilizes training across heterogeneous edge devices.",
    tags: ["Federated Learning", "Privacy", "Optimization"],
  },
  {
    id: "3",
    title: "Neural Operators for PDE-Constrained Inverse Problems",
    author: "Elena Vasquez et al.",
    abstract:
      "Physics-informed neural operators map parameter spaces to solution fields with mesh-free generalization. We evaluate reconstruction error on elliptic and parabolic inverse problems from sparse boundary observations.",
    tags: ["Scientific ML", "PDEs", "Inverse Problems"],
  },
  {
    id: "4",
    title: "Verifiable Program Synthesis from Natural Language Specifications",
    author: "Chen Wei & Priya Nair",
    abstract:
      "We present a pipeline that translates restrained natural language into Hoare-logic annotations and synthesizes imperative programs checked by an SMT-backed verifier, reducing unsound code in safety-critical domains.",
    tags: ["Formal Methods", "Program Synthesis", "NLP"],
  },
  {
    id: "5",
    title: "Carbon-Aware Scheduling for GPU Workloads in Cloud Regions",
    author: "Olivia Müller",
    abstract:
      "Datacenter emissions fluctuate with grid mix. Our scheduler co-optimizes deadline feasibility, cost, and marginal carbon intensity using real-time carbon signals, showing measurable reductions without large latency penalties.",
    tags: ["Systems", "Sustainability", "Scheduling"],
  },
  {
    id: "6",
    title: "Self-Supervised Representation Learning from Multimodal Clinical Time Series",
    author: "Raj Patel, MD; Samir Haddad",
    abstract:
      "Hospital monitors produce irregular, missing-valued time series paired with unstructured notes. We pretrain joint encoders with masked prediction and contrastive alignment, improving downstream risk scoring on public EHR cohorts.",
    tags: ["Healthcare AI", "Time Series", "Self-Supervision"],
  },
];

const SAVED_PAPER_IDS_KEY = "research-sphere-feed-saved-ids";

function readSavedIdsFromStorage(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(SAVED_PAPER_IDS_KEY);
    if (!raw) return {};
    const ids = JSON.parse(raw) as unknown;
    if (!Array.isArray(ids)) return {};
    const next: Record<string, boolean> = {};
    for (const id of ids) {
      if (typeof id === "string") next[id] = true;
    }
    return next;
  } catch {
    return {};
  }
}

function writeSavedIdsToStorage(saved: Record<string, boolean>) {
  const ids = Object.entries(saved)
    .filter(([, on]) => on)
    .map(([id]) => id);
  try {
    localStorage.setItem(SAVED_PAPER_IDS_KEY, JSON.stringify(ids));
  } catch {
    /* ignore quota / private mode */
  }
}

function truncateAbstract(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

type ResearchFeedProps = {
  papers: ResearchPaper[];
};

export default function ResearchFeed({ papers }: ResearchFeedProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [aiSummaryVisible, setAiSummaryVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSaved(readSavedIdsFromStorage());
  }, []);

  const filteredPapers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return papers;
    return papers.filter((paper) => paper.title.toLowerCase().includes(q));
  }, [searchQuery, papers]);

  const toggleLike = (id: string) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      writeSavedIdsToStorage(next);
      return next;
    });
  };

  const toggleAiSummary = (id: string) => {
    setAiSummaryVisible((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="mb-8 max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Research feed
            </h1>
            <p className="mt-2 text-muted-foreground">
              Curated papers from your fields. Like or save items to refine what you see later.
            </p>
          </div>

          <div className="mb-10">
            <label htmlFor="research-feed-search" className="sr-only">
              Search papers by title
            </label>
            <div className="relative max-w-xl">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="research-feed-search"
                type="search"
                placeholder="Search by title…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
                className="h-11 rounded-xl border-border/80 bg-background/80 pl-10 pr-4 shadow-sm transition-shadow placeholder:text-muted-foreground/70 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>
            {searchQuery.trim() !== "" && (
              <p className="mt-2 text-sm text-muted-foreground">
                {filteredPapers.length}{" "}
                {filteredPapers.length === 1 ? "paper" : "papers"} matching &ldquo;{searchQuery.trim()}
                &rdquo;
              </p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredPapers.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 py-14 text-center">
                <p className="text-sm font-medium text-foreground">No papers match that title</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a shorter or different search term.
                </p>
              </div>
            ) : (
              filteredPapers.map((paper) => {
                const isLiked = !!liked[paper.id];
                const isSaved = !!saved[paper.id];
                const showAiSummary = !!aiSummaryVisible[paper.id];
                return (
                  <Card
                    key={paper.id}
                    className="flex flex-col border-border/80 transition-shadow hover:shadow-md"
                  >
                    <CardHeader className="space-y-2 pb-3">
                      <h2 className="text-lg font-semibold leading-snug tracking-tight text-foreground">
                        {paper.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">{paper.author}</p>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-4">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {truncateAbstract(paper.abstract, 100)}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {paper.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="font-normal">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="w-full font-medium"
                          onClick={() => toggleAiSummary(paper.id)}
                          aria-expanded={showAiSummary}
                          aria-controls={`ai-summary-${paper.id}`}
                        >
                          {showAiSummary ? "Hide AI summary" : "Generate AI Summary"}
                        </Button>
                        {showAiSummary && (
                          <div
                            id={`ai-summary-${paper.id}`}
                            className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-3"
                            role="region"
                            aria-label="AI-generated summary"
                          >
                            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                              AI Summary
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-foreground">
                              {truncateAbstract(paper.abstract, 80)}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant={isLiked ? "default" : "outline"}
                        size="sm"
                        className={cn("flex-1", isLiked && "gap-1.5")}
                        onClick={() => toggleLike(paper.id)}
                        aria-pressed={isLiked}
                      >
                        <Heart className={cn("size-4", isLiked && "fill-current")} aria-hidden />
                        {isLiked ? "Liked" : "Like"}
                      </Button>
                      <Button
                        type="button"
                        variant={isSaved ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "flex-1 transition-[box-shadow,transform] duration-200",
                          isSaved &&
                            "gap-1.5 shadow-md ring-2 ring-primary/35 ring-offset-2 ring-offset-background",
                        )}
                        onClick={() => toggleSave(paper.id)}
                        aria-pressed={isSaved}
                      >
                        <Bookmark className={cn("size-4", isSaved && "fill-current")} aria-hidden />
                        {isSaved ? "Saved" : "Save"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
