import { Link } from "react-router-dom";
import {
  ArrowRight,
  Database,
  Globe,
  GraduationCap,
  BookOpen,
  FileSearch,
  Layers,
  BookMarked,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const CS_AREAS = [
  "Machine Learning",
  "Artificial Intelligence",
  "Computer Vision",
  "Natural Language Processing",
  "Data Science",
  "Cybersecurity",
  "Blockchain",
  "Cloud Computing",
  "Software Engineering",
  "Deep Learning",
  "Quantum Computing",
  "Database Systems",
  "Computer Networks",
  "Human-Computer Interaction",
  "Distributed Systems",
];

const PLATFORM_FEATURES = [
  {
    icon: FileSearch,
    label: "Conference Discovery",
    description:
      "CFPs and call-for-papers across top CS venues, filtered by topic, deadline, and year. Sourced live from WikiCFP and other registries.",
  },
  {
    icon: BookOpen,
    label: "Academic Journals",
    description:
      "Peer-reviewed journal listings spanning AI, data science, systems, and security — ranked, indexed, and updated continuously from multiple feeds.",
  },
  {
    icon: GraduationCap,
    label: "PhD & Postdoc Calls",
    description:
      "Active PhD positions and postdoctoral fellowships from leading research universities globally, with direct application links.",
  },
  {
    icon: BookMarked,
    label: "Book Chapter Calls",
    description:
      "Open invitations for book chapter contributions from publishers, with proposal deadlines, editor details, and submission guidance.",
  },
  {
    icon: Globe,
    label: "Research Opportunities",
    description:
      "Internships, project calls, and funded research roles across industry labs and academic institutions.",
  },
  {
    icon: Database,
    label: "General Finder",
    description:
      "A unified search layer that queries all source categories at once. One search, every relevant result across conferences, journals, and roles.",
  },
];

const DATA_SOURCES = [
  ["WikiCFP", "Conferences and CFPs"],
  ["arXiv", "Preprints and research papers"],
  ["Jobs.ac.uk", "PhD and postdoc listings"],
  ["FindAPhD", "Doctoral positions"],
  ["ResearchTweet", "Global opportunities feed"],
  ["NoticeBard", "India-based opportunities"],
  ["IJERT", "Engineering and CS journals"],
  ["Papers With Code", "ML papers and benchmarks"],
] as const;

const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <div className="flex-1">
        <div className="container mx-auto max-w-[1380px] px-5 py-8 md:px-6 md:py-10">
          <section className="rounded-[28px] border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border bg-gradient-to-r from-slate-100 via-white to-slate-50 px-6 py-6 md:px-8 md:py-7">
              <div className="max-w-4xl">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="px-3 py-1 text-xs">
                    About ResearchSphere
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 text-xs">
                    Live research intelligence for CS
                  </Badge>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  A focused platform for discovering journals, conferences, and
                  academic opportunities.
                </h1>
                <p className="mt-3 text-[15px] leading-7 text-muted-foreground md:text-base">
                  ResearchSphere consolidates fragmented research listings into
                  one practical workspace, so researchers can spend less time
                  hunting across sources and more time on high-impact work.
                </p>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <Card className="rounded-2xl border-border bg-background shadow-none">
                  <CardContent className="p-5 md:p-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Our Purpose
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold leading-tight text-foreground md:text-3xl">
                      Research discovery should feel direct, structured, and
                      reliable.
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      Finding the right venue or opportunity often means
                      checking many disconnected portals every week.
                      ResearchSphere unifies those flows with consistent search,
                      clean filters, and source-linked records across computer
                      science domains.
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border bg-background shadow-none">
                  <CardContent className="p-5 md:p-6">
                    <div className="space-y-3.5">
                      {[
                        [
                          "Continuously refreshed",
                          "Records are harvested automatically from trusted sources.",
                        ],
                        [
                          "Computer-science focused",
                          "Taxonomy, tags, and ranking are tuned for CS and AI topics.",
                        ],
                        [
                          "Source transparent",
                          "Every listing links back to the original provider page.",
                        ],
                      ].map(([label, detail]) => (
                        <div key={label} className="flex items-start gap-3">
                          <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {label}
                            </p>
                            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                              {detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2">
                      {[
                        [String(PLATFORM_FEATURES.length), "Core sections"],
                        [String(CS_AREAS.length), "CS topic areas"],
                        ["1", "Unified finder"],
                      ].map(([value, label]) => (
                        <div
                          key={label}
                          className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-center"
                        >
                          <p className="text-lg font-semibold tracking-tight text-foreground">
                            {value}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-[28px] border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Platform sections
                </p>
                <p className="text-sm text-muted-foreground">
                  Dedicated workflows for the major research discovery needs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {PLATFORM_FEATURES.map(({ icon: Icon, label, description }) => (
                <Card
                  key={label}
                  className="rounded-2xl border-border bg-background shadow-none transition-colors hover:bg-muted/40"
                >
                  <CardContent className="p-5">
                    <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {label}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-[28px] border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Research areas
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Topics used to classify and prioritize relevant CS records.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {CS_AREAS.map((area) => (
                <Badge
                  key={area}
                  variant="secondary"
                  className="rounded-full px-3 py-1 text-xs font-normal"
                >
                  {area}
                </Badge>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-[28px] border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Data provenance
                </p>
                <h3 className="mt-3 text-xl font-semibold text-foreground">
                  Where the platform data comes from
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  ResearchSphere aggregates from curated academic registries,
                  feeds, and opportunity boards. Each result remains traceable
                  to its source so users can verify details and submit through
                  official channels.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {DATA_SOURCES.map(([source, role]) => (
                  <div
                    key={source}
                    className="rounded-xl border border-border bg-muted/35 px-3.5 py-3"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {source}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {role}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-[28px] border border-border bg-gradient-to-r from-slate-100 via-white to-slate-50 px-6 py-6 shadow-sm md:px-8 md:py-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Ready to start discovering?
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use General Finder to search across all categories at once.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/general-finder">
                  <Button size="sm" className="gap-2 h-9">
                    Open General Finder
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link to="/conferences">
                  <Button variant="outline" size="sm" className="h-9">
                    Browse Conferences
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
