import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, User, ChevronDown, Menu, X, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getUserPreferences,
  saveUserPreferences,
  type TargetKind,
  type UserPreferences,
} from "@/lib/personalization";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import logo from "@/assets/logo.png";

const RESEARCH_QUOTES = [
  "Research is creating new knowledge.",
  "Innovation distinguishes leaders from followers.",
  "Science is the poetry of reality.",
  "The art of discovery is the art of research.",
  "Learning never exhausts the mind.",
  "Everything is theoretically impossible until it is done.",
  "Research is what I'm doing when I don't know what I'm doing.",
  "The scientist is not a person who gives the right answers, it's the one who asks the right questions.",
  "Discovery consists of seeing what everybody has seen and thinking what nobody has thought.",
  "Imagination is more important than knowledge.",
];

const Navigation = () => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [savedState, setSavedState] = useState<"idle" | "saved">("idle");
  const [profile, setProfile] = useState<UserPreferences>(getUserPreferences());
  const [interestsInput, setInterestsInput] = useState("");
  const [currentQuote, setCurrentQuote] = useState("");

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * RESEARCH_QUOTES.length);
    setCurrentQuote(RESEARCH_QUOTES[randomIndex]);
  }, []);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
    }
  };

  const researchOpportunitiesItems = [
    { name: "Project Call", path: "/project-calls" },
    { name: "Postdoc Positions", path: "/postdoc-positions" },
    { name: "PhD Programs", path: "/phd-programs" },
    { name: "Research Associates", path: "/" }, // Placeholder
  ];

  const researchCollaborationsItems = [
    { name: "Intern", path: "/internships" },
    { name: "Projects", path: "/research-collaboration" },
    { name: "Papers", path: "/add-paper" },
  ];

  const callForPaperItems = [
    { name: "Journal", path: "/journals" },
    { name: "Conferences", path: "/conferences" },
    { name: "Chapter", path: "/book-chapters" },
  ];

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (!profileOpen) return;
    const stored = getUserPreferences();
    setProfile(stored);
    setInterestsInput(stored.interests.join(", "));
    setSavedState("idle");
  }, [profileOpen]);

  const toggleTargetKind = (kind: TargetKind) => {
    setProfile((prev) => {
      const nextKinds = prev.targetKinds.includes(kind)
        ? prev.targetKinds.filter((entry) => entry !== kind)
        : [...prev.targetKinds, kind];
      return {
        ...prev,
        targetKinds: nextKinds.length ? nextKinds : prev.targetKinds,
      };
    });
  };

  const saveProfile = () => {
    const cleaned = {
      ...profile,
      interests: interestsInput
        .split(",")
        .map((interest) => interest.trim())
        .filter(Boolean),
    };

    saveUserPreferences(cleaned);
    setSavedState("saved");
  };

  return (
    <nav className="bg-background/90 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50 w-full transition-all duration-300 shadow-lg dark:shadow-primary/5">
      <div className="container-fluid mx-auto px-8">
        {/* Row 1: Top Bar (Logo + Quote) */}
        <div className="flex items-center h-16 gap-0 border-b border-border/10 py-3">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0 transition-transform hover:scale-[1.02] duration-200">
            <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-all shadow-sm group-hover:shadow-md">
              <img
                src={logo}
                alt="ResearchSphere Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              ResearchSphere
            </span>
          </Link>

          {/* Right: Full-Length Dynamic Quote Banner */}
          <div className="hidden md:flex flex-1 justify-end items-center overflow-hidden pl-12 min-w-0">
            <p className="text-sm italic text-muted-foreground/50 animate-in fade-in slide-in-from-right-4 duration-1000 truncate font-light tracking-wide text-right w-full">
              &ldquo;{currentQuote}&rdquo;
            </p>
          </div>
        </div>

        {/* Row 2: Navigation Bar */}
        <div className="flex items-center h-14 justify-between py-2">
          {/* Navigation Menu */}
          <div className="hidden lg:flex items-center gap-8">
            <Link
              to="/"
              className={cn(
                "px-5 py-2 text-sm font-semibold rounded-full transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-95",
                isActive("/") 
                  ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-primary/20" 
                  : "text-foreground/70 hover:text-primary hover:bg-primary/5"
              )}
            >
              Home
            </Link>
            <Link
              to="/general-finder"
              className={cn(
                "px-2 py-1.5 text-sm font-medium transition-all duration-200 hover:text-primary hover:scale-105 whitespace-nowrap",
                isActive("/general-finder") ? "text-primary" : "text-foreground/70"
              )}
            >
              Journal Finder
            </Link>

            {/* Call for Paper Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-foreground/70 transition-all duration-200 group-hover:text-primary group-hover:scale-105 whitespace-nowrap">
                Call for Paper
                <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
              </button>
              <div className="absolute left-0 top-full pt-2 w-56 opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-[100]">
                <div className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl p-2 space-y-1">
                  {callForPaperItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="block px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 hover:bg-primary/10 hover:text-primary text-left"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Research Opportunities Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-foreground/70 transition-all duration-200 group-hover:text-primary group-hover:scale-105 whitespace-nowrap">
                Research Opportunities
                <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
              </button>
              <div className="absolute left-0 top-full pt-2 w-56 opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-[100]">
                <div className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl p-2 space-y-1">
                  {researchOpportunitiesItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="block px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 hover:bg-primary/10 hover:text-primary text-left"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Research Collaborations Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-foreground/70 transition-all duration-200 group-hover:text-primary group-hover:scale-105 whitespace-nowrap">
                Research Collaborations
                <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
              </button>
              <div className="absolute left-0 top-full pt-2 w-56 opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-[100]">
                <div className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl p-2 space-y-1">
                  {researchCollaborationsItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="block px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 hover:bg-primary/10 hover:text-primary text-left"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions (Theme toggle, User, Mobile menu) */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-primary/10 transition-all duration-200 h-9 w-9 hover:scale-110 active:scale-90"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 transition-all duration-200 h-9 w-9 hover:scale-110 active:scale-90">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl border-border/50 shadow-2xl backdrop-blur-xl">
                  <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer rounded-xl m-1 px-3 py-2">
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive rounded-xl m-1 px-3 py-2">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary/5 h-9 px-5 text-sm font-medium transition-all hover:scale-105 active:scale-95">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20 hover:shadow-primary/30 h-9 px-6 text-sm font-bold transition-all hover:scale-105 active:scale-95 border-none">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-full hover:bg-primary/10 transition-all duration-200 h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={cn(
          "lg:hidden overflow-hidden transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "max-h-[80vh] py-6 border-t border-border" : "max-h-0"
        )}>
          <div className="space-y-4">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "block px-4 py-2 rounded-xl text-base font-medium transition-all",
                isActive("/") ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              Home
            </Link>
            <Link
              to="/general-finder"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "block px-4 py-2 rounded-xl text-base font-medium transition-all",
                isActive("/general-finder") ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              Journal Finder
            </Link>
            {/* Mobile Call for Paper Dropdown */}
            <div className="space-y-1">
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Call for Papers
              </div>
              {callForPaperItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-6 py-2 rounded-xl text-base font-medium transition-all",
                    isActive(item.path) ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Mobile Opportunities */}
            <div className="space-y-1">
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Research Opportunities
              </div>
              {researchOpportunitiesItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-6 py-2 rounded-xl text-base font-medium transition-all",
                    isActive(item.path) ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Mobile Collaborations */}
            <div className="space-y-1">
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Research Collaborations
              </div>
              {researchCollaborationsItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-6 py-2 rounded-xl text-base font-medium transition-all",
                    isActive(item.path) ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {!user && (
              <div className="grid grid-cols-2 gap-4 px-4 pt-4 border-t border-border">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-xl">Sign In</Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full rounded-xl">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {user ? "Your Account & Preferences" : "Your research preferences"}
            </DialogTitle>
          </DialogHeader>

          {user && (
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Account Information</h3>
              <p className="text-sm text-muted-foreground">
                Email: {user.email}
              </p>
              <p className="text-sm text-muted-foreground">
                Joined: {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  value={profile.name}
                  onChange={(event) =>
                    setProfile((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={profile.role || "unspecified"}
                  onValueChange={(value) =>
                    setProfile((prev) => ({
                      ...prev,
                      role: value === "unspecified" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unspecified">Not specified</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="researcher">Researcher</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="industry">
                      Industry professional
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-interests">
                Interests (comma-separated)
              </Label>
              <Input
                id="profile-interests"
                value={interestsInput}
                onChange={(event) => setInterestsInput(event.target.value)}
                placeholder="ai, ml, blockchain"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-location">Preferred location</Label>
              <Input
                id="profile-location"
                value={profile.location}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    location: event.target.value,
                  }))
                }
                placeholder="Hyderabad, India"
              />
            </div>

            <div className="space-y-2">
              <Label>Priority content types</Label>
              <div className="flex gap-2 flex-wrap">
                {(["conference", "journal", "opportunity"] as TargetKind[]).map(
                  (kind) => {
                    const selected = profile.targetKinds.includes(kind);
                    return (
                      <Button
                        key={kind}
                        type="button"
                        variant={selected ? "default" : "outline"}
                        size="sm"
                        className="capitalize"
                        onClick={() => toggleTargetKind(kind)}
                      >
                        {kind}
                      </Button>
                    );
                  },
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Used for your personalized recommendations.
              </p>
              <div className="flex items-center gap-2">
                <Link to="/user-hub">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setProfileOpen(false)}
                  >
                    Open User Hub
                  </Button>
                </Link>
                <Button size="sm" onClick={saveProfile}>
                  Save preferences
                </Button>
              </div>
            </div>

            {savedState === "saved" && (
              <p className="text-xs text-primary">Preferences saved.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
};

export default Navigation;
