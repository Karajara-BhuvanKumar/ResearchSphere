import {
  Briefcase,
  Users,
  BookOpen,
  CheckCircle,
  GraduationCap,
  FileText,
  Send,
  Clock,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { submitCollaborationRequest } from "@/services/apiClient";

const RESEARCH_AREAS = [
  "Machine Learning",
  "Deep Learning",
  "Data Science",
  "Computer Vision",
  "Natural Language Processing",
  "Cloud Computing",
  "Cybersecurity",
  "IoT & Embedded Systems",
];

const COLLABORATION_TYPES = [
  {
    icon: FileText,
    title: "Co-Authorship",
    description: "Joint publications in peer-reviewed conferences and journals",
  },
  {
    icon: FlaskConical,
    title: "Research Projects",
    description: "Contribute to or lead ongoing funded research initiatives",
  },
  {
    icon: GraduationCap,
    title: "Mentorship",
    description: "Guidance for PhD aspirants, postdocs, and junior researchers",
  },
  {
    icon: Briefcase,
    title: "Industry Consulting",
    description: "Applied research partnerships bridging academia and industry",
  },
];

const PROCESS_STEPS = [
  "Submit your collaboration request using the form",
  "Research team reviews your proposal (3–5 business days)",
  "Introductory meeting scheduled if there is alignment",
  "Collaboration plan drafted and work begins",
];

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    institution: "",
    researchAreas: "",
    projectDetails: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await submitCollaborationRequest(formData);
      toast({
        title: "Request submitted",
        description:
          "Your collaboration request has been received. We will be in touch within 3-5 business days.",
      });
      setFormData({
        name: "",
        email: "",
        institution: "",
        researchAreas: "",
        projectDetails: "",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again later.";
      toast({
        title: "Submission failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="flex-1">
        <PageHero
          icon={Users}
          title="Research Collaboration"
          description="Interested in joint research, co-authorship, or academic partnerships? Submit your proposal and our research team will be in touch."
        />

        <div className="container mx-auto px-4 py-10">
          <div className="grid lg:grid-cols-[1fr_1.6fr] gap-8 items-start">
            {/* Left column: Lab info */}
            <div className="space-y-5">
              {/* Research focus card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg border border-border bg-muted flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        Research Laboratory
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Computer Science &amp; AI
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Our research group advances knowledge at the intersection of
                    artificial intelligence, data science, and software systems
                    — publishing in top-tier venues and engaging with
                    researchers, students, and industry partners worldwide.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {RESEARCH_AREAS.map((area) => (
                      <Badge key={area} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration types */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Collaboration types
                </p>
                <div className="space-y-3">
                  {COLLABORATION_TYPES.map(
                    ({ icon: Icon, title, description }) => (
                      <div key={title} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground leading-none mb-0.5">
                            {title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {description}
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <Separator />

              {/* Process timeline */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    How it works
                  </p>
                </div>
                <ol className="space-y-2.5">
                  {PROCESS_STEPS.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-muted border border-border text-xs font-mono font-semibold text-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-muted-foreground leading-snug">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Right column: Form */}
            <Card>
              <CardContent className="p-7">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    Submit a Collaboration Request
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fill in your details below. All fields marked * are
                    required.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name + Email */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="name"
                        className="text-sm font-medium text-foreground"
                      >
                        Full Name *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Dr. Jane Smith"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="email"
                        className="text-sm font-medium text-foreground"
                      >
                        Email Address *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@university.edu"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Institution */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="institution"
                      className="text-sm font-medium text-foreground"
                    >
                      Institution / Organization *
                    </label>
                    <Input
                      id="institution"
                      name="institution"
                      placeholder="Your University"
                      value={formData.institution}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Research Areas */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="researchAreas"
                      className="text-sm font-medium text-foreground"
                    >
                      Research Areas / Specialization *
                    </label>
                    <Input
                      id="researchAreas"
                      name="researchAreas"
                      placeholder="e.g. Machine Learning, Computer Vision, NLP"
                      value={formData.researchAreas}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Project Details */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="projectDetails"
                      className="text-sm font-medium text-foreground"
                    >
                      Project Details / Research Proposal
                    </label>
                    <Textarea
                      id="projectDetails"
                      name="projectDetails"
                      placeholder="Describe your research idea, objectives, and how a collaboration could be mutually beneficial..."
                      rows={5}
                      value={formData.projectDetails}
                      onChange={handleChange}
                    />
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-3">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-11 font-semibold gap-2"
                    >
                      {isSubmitting ? (
                        "Submitting..."
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Submit Collaboration Request
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      All requests are reviewed personally within 3-5 business
                      days
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
