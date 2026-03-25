import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Twitter, Linkedin, Mail, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { trackPageVisit, getVisitCount } from "@/lib/analytics";
import logo from "@/assets/logo.png";

const Footer = () => {
  const [visits, setVisits] = useState(0);

  useEffect(() => {
    // Track visit on page load
    trackPageVisit();
    setVisits(getVisitCount());
  }, []);
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src={logo}
                alt="ResearchSphere Logo"
                className="w-8 h-8 object-contain rounded-full"
              />
              <span className="text-lg font-bold text-foreground">
                ResearchSphere
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your gateway to global research opportunities.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/"
                  className="text-muted-foreground hover:text-primary"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/conferences"
                  className="text-muted-foreground hover:text-primary"
                >
                  Conferences
                </Link>
              </li>
              <li>
                <Link
                  to="/journals"
                  className="text-muted-foreground hover:text-primary"
                >
                  Journals
                </Link>
              </li>
              <li>
                <Link
                  to="/book-chapters"
                  className="text-muted-foreground hover:text-primary"
                >
                  Book Chapters
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">
              Opportunities
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/phd-programs"
                  className="text-muted-foreground hover:text-primary"
                >
                  PhD Programs
                </Link>
              </li>
              <li>
                <Link
                  to="/postdoc-positions"
                  className="text-muted-foreground hover:text-primary"
                >
                  Postdoc Positions
                </Link>
              </li>
              <li>
                <Link
                  to="/internships"
                  className="text-muted-foreground hover:text-primary"
                >
                  Internships
                </Link>
              </li>
              <li>
                <Link
                  to="/project-calls"
                  className="text-muted-foreground hover:text-primary"
                >
                  Project Calls
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Subscribe to our newsletter for the latest updates.
            </p>
            <div className="flex gap-2">
              <Input placeholder="Your email" className="flex-1" />
              <Button>Subscribe</Button>
            </div>
            <div className="flex gap-3 mt-4">
              <a href="#" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-sm text-muted-foreground">
            <div>© 2026 ResearchSphere. All rights reserved.</div>
            {visits > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <Eye className="h-4 w-4" />
                <span>{visits.toLocaleString()} page views</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
