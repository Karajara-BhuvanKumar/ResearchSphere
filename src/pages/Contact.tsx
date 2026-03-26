import {
  Briefcase,
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
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { submitCollaborationRequest } from "@/services/apiClient";
import emailjs from "@emailjs/browser";
import { cn } from "@/lib/utils";

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
  const form = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    institution: "",
    researchAreas: "",
    projectDetails: "",
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.institution.trim())
      newErrors.institution = "Institution is required";
    if (!formData.researchAreas.trim())
      newErrors.researchAreas = "Research area is required";
    if (!formData.projectDetails.trim())
      newErrors.projectDetails = "Project details are required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    // Special handling for the 'area' and 'message' names used for EmailJS template
    const fieldName = name === "area" ? "researchAreas" : name === "message" ? "projectDetails" : name;
    
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  const sendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.current) return;

    if (!validateForm()) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Send admin notification
    emailjs
      .sendForm(
        "service_lox8tpa",
        "template_xgq7kzt",
        form.current,
        "tUm95yDD5O-q26E5Z",
      )
      .then(
        async (result) => {
          console.log("Admin email sent:", result.text);

          // Send confirmation email to user
          try {
            await emailjs.send(
              "service_lox8tpa",
              "template_xgq7kzt",
              {
                to_email: formData.email,
                to_name: formData.name,
                message: `Thank you for your collaboration request, ${formData.name}! We have received your proposal and our research team will review it within 3-5 business days. We will get back to you soon.`,
              },
              "tUm95yDD5O-q26E5Z",
            );
            console.log("User confirmation email sent");
          } catch (confirmErr) {
            console.error("User confirmation email failed:", confirmErr);
          }

          // Also submit to our local API if needed
          try {
            await submitCollaborationRequest(formData);
          } catch (apiErr) {
            console.error("Local API submission failed:", apiErr);
          }

          toast({
            title: "Request submitted successfully",
            description:
              "Your collaboration request has been sent. We will be in touch within 3-5 business days.",
          });

          setFormData({
            name: "",
            email: "",
            institution: "",
            researchAreas: "",
            projectDetails: "",
          });
          setIsSubmitting(false);
        },
        (error) => {
          console.log(error.text);
          toast({
            title: "Submission failed",
            description: "Failed to send request. Try again.",
            variant: "destructive",
          });
          setIsSubmitting(false);
        },
      );
  };

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
                    Research Collaboration
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 text-xs">
                    CS and AI partnerships
                  </Badge>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  Collaborate on high-impact research with our CS and AI lab.
                </h1>
                <p className="mt-3 text-[15px] leading-7 text-muted-foreground md:text-base">
                  Share your proposal for co-authorship, funded projects,
                  mentorship, or applied research. We review each request and
                  respond with clear next steps.
                </p>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.45fr]">
                <div className="space-y-5">
                  <Card className="rounded-2xl border-border bg-background shadow-none">
                    <CardContent className="p-5 md:p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                          <BookOpen className="h-4 w-4 text-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Research Laboratory
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Computer Science and AI
                          </p>
                        </div>
                      </div>

                      <p className="mb-4 text-sm leading-7 text-muted-foreground">
                        Our group works at the intersection of artificial
                        intelligence, data science, and software systems,
                        combining academic rigor with practical collaboration
                        across universities and industry.
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {RESEARCH_AREAS.map((area) => (
                          <Badge
                            key={area}
                            variant="secondary"
                            className="text-xs font-normal"
                          >
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-border bg-background shadow-none">
                    <CardContent className="p-5 md:p-6">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Collaboration types
                      </p>
                      <div className="space-y-3.5">
                        {COLLABORATION_TYPES.map(
                          ({ icon: Icon, title, description }) => (
                            <div key={title} className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
                                <Icon className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <div>
                                <p className="mb-0.5 text-sm font-medium leading-none text-foreground">
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
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-border bg-background shadow-none">
                    <CardContent className="p-5 md:p-6">
                      <div className="mb-3 flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          How it works
                        </p>
                      </div>
                      <ol className="space-y-2.5">
                        {PROCESS_STEPS.map((step, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-border bg-muted font-mono text-xs font-semibold text-foreground">
                              {i + 1}
                            </span>
                            <span className="text-sm leading-snug text-muted-foreground">
                              {step}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                </div>

                <Card className="rounded-2xl border-border bg-background shadow-none">
                  <CardContent className="p-5 md:p-6">
                    <div className="mb-6 rounded-xl border border-border bg-muted/35 px-4 py-3">
                      <h2 className="text-lg font-semibold text-foreground">
                        Submit a Collaboration Request
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Fill in your details below. Fields marked * are
                        required.
                      </p>
                    </div>
                    <form
                      ref={form}
                      onSubmit={sendEmail}
                      className="space-y-5"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
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
                            className={cn("h-11", errors.name && "border-destructive focus-visible:ring-destructive")}
                            required
                          />
                          {errors.name && (
                            <p className="text-xs font-medium text-destructive mt-1">{errors.name}</p>
                          )}
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
                            className={cn("h-11", errors.email && "border-destructive focus-visible:ring-destructive")}
                            required
                          />
                          {errors.email && (
                            <p className="text-xs font-medium text-destructive mt-1">{errors.email}</p>
                          )}
                        </div>
                      </div>

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
                          className={cn("h-11", errors.institution && "border-destructive focus-visible:ring-destructive")}
                          required
                        />
                        {errors.institution && (
                          <p className="text-xs font-medium text-destructive mt-1">{errors.institution}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="researchAreas"
                          className="text-sm font-medium text-foreground"
                        >
                          Research Areas / Specialization *
                        </label>
                        <Input
                          id="researchAreas"
                          name="area"
                          placeholder="e.g. Machine Learning, Computer Vision, NLP"
                          value={formData.researchAreas}
                          onChange={handleChange}
                          className={cn("h-11", errors.researchAreas && "border-destructive focus-visible:ring-destructive")}
                          required
                        />
                        {errors.researchAreas && (
                          <p className="text-xs font-medium text-destructive mt-1">{errors.researchAreas}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="projectDetails"
                          className="text-sm font-medium text-foreground"
                        >
                          Project Details / Research Proposal
                        </label>
                        <Textarea
                          id="projectDetails"
                          name="message"
                          placeholder="Describe your research idea, objectives, and how a collaboration could be mutually beneficial..."
                          rows={6}
                          value={formData.projectDetails}
                          onChange={handleChange}
                          className={cn(errors.projectDetails && "border-destructive focus-visible:ring-destructive")}
                        />
                        {errors.projectDetails && (
                          <p className="text-xs font-medium text-destructive mt-1">{errors.projectDetails}</p>
                        )}
                      </div>

                      <div className="border-t border-border pt-4">
                        <div className="flex flex-col gap-3">
                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-11 w-full gap-2 font-semibold"
                          >
                            {isSubmitting ? (
                              "Sending..."
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                Submit Collaboration Request
                              </>
                            )}
                          </Button>
                          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                            <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
                            All requests are reviewed personally within 3-5
                            business days
                          </p>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-[28px] border border-border bg-gradient-to-r from-slate-100 via-white to-slate-50 px-6 py-6 shadow-sm md:px-8 md:py-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Looking for open venues before proposing collaboration?
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Explore conferences and journals to align your proposal with
                  active research directions.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="sm" className="h-9">
                  <a href="/general-finder">Open General Finder</a>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-9">
                  <a href="/journals">Browse Journals</a>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
