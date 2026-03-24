import { Link } from "react-router-dom";
import {
  ArrowRight,
  Database,
  Globe,
  GraduationCap,
  BookOpen,
  FileSearch,
  Users,
  Layers,
  BookMarked,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";

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

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="flex-1">
        <PageHero
          icon={Layers}
          title="About ResearchSphere"
          description="A live research intelligence platform built for the CS community — surfacing conferences, journals, and academic opportunities from trusted sources."
        />

        {/* Mission block */}
        <section className="border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border">
              <div className="py-12 lg:pr-12">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">
                  Our Purpose
                </p>
                <h2 className="heading-display text-3xl md:text-4xl text-foreground leading-tight mb-6">
                  Research discovery
                  <br />
                  should be immediate,
                  <br />
                  not laborious.
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                  Finding the right conference, journal, or funding call
                  requires checking dozens of fragmented sources daily.
                  ResearchSphere aggregates them into a single, continuously
                  refreshed platform — so researchers can spend less time
                  searching and more time doing the work that matters.
                </p>
              </div>
              <div className="py-12 lg:pl-12 flex flex-col justify-center gap-6">
                <div className="space-y-4">
                  {[
                    [
                      "Live data",
                      "Sources are harvested automatically, not entered manually.",
                    ],
                    [
                      "CS-focused",
                      "Every source and filter is scoped to computer science and AI.",
                    ],
                    [
                      "Open access",
                      "No paywalls, no login required to browse listings.",
                    ],
                  ].map(([label, detail]) => (
                    <div key={label} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform features */}
        <section className="py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-8">
              Platform sections
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 border border-border rounded-lg overflow-hidden">
              {PLATFORM_FEATURES.map(
                ({ icon: Icon, label, description }, i) => (
                  <div
                    key={label}
                    className={`p-6 bg-card hover:bg-muted/40 transition-colors ${
                      i % 3 !== 2 ? "lg:border-r" : ""
                    } ${
                      i < PLATFORM_FEATURES.length - 3 ? "lg:border-b" : ""
                    } ${
                      i % 2 !== 1 ? "sm:border-r lg:border-r-0" : ""
                    } border-b sm:border-b-0 lg:border-b border-border last:border-b-0`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1.5">
                          {label}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {description}
                        </p>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        {/* Research areas */}
        <section className="py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-16">
              <div className="flex-shrink-0 md:w-52">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Research areas
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sources are filtered and tagged across these domains.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {CS_AREAS.map((area) => (
                  <Badge
                    key={area}
                    variant="secondary"
                    className="text-xs font-normal"
                  >
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Data provenance */}
        <section className="py-12 border-b border-border bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-8 md:gap-16 items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                  Data sources
                </p>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Where the data comes from
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  ResearchSphere harvests from a curated set of authoritative
                  academic registries, RSS feeds, and job boards. All sources
                  are automatically refreshed every few hours, and each result
                  links directly back to its origin.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["WikiCFP", "Conferences & CFPs"],
                  ["arXiv", "Preprints & research papers"],
                  ["Jobs.ac.uk", "PhD & postdoc listings"],
                  ["FindAPhD", "Doctoral positions"],
                  ["ResearchTweet", "Opportunities feed"],
                  ["NoticeBard", "India-based calls"],
                  ["IJERT", "Engineering journals"],
                  ["Papers With Code", "ML benchmarks"],
                ].map(([source, role]) => (
                  <div key={source} className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium text-foreground">
                      {source}
                    </p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Built by section */}
        <section className="py-12 border-b border-border">
          <div className="container mx-auto px-4 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Built by
            </p>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg border border-border bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                <Users className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground mb-2">
                  Research Laboratory — Computer Science &amp; AI
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  ResearchSphere is developed and maintained by a university
                  research group working at the intersection of artificial
                  intelligence, data systems, and applied computing. The
                  platform originated as an internal tool for tracking open
                  calls and has grown into a comprehensive discovery resource
                  for the broader CS community.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                  Researchers interested in collaboration, co-authorship, or
                  academic partnerships are welcome to reach out directly.
                </p>
                <div className="mt-5">
                  <Link to="/research-collaboration">
                    <Button variant="outline" size="sm" className="gap-2 h-9">
                      Request collaboration
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA strip */}
        <section className="py-10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Ready to start discovering?
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use General Finder to search across all categories at once.
                </p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
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
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default About;
