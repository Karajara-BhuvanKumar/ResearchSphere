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

import logo from "@/assets/logo.png";

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

  const mainNavItems = [
    { name: "Home", path: "/" },
    { name: "Finder", path: "/general-finder" },
    { name: "Research feed", path: "/research-feed" },
    { name: "Add paper", path: "/add-paper" },
    // { name: "Assistant", path: "/assistant" },
    { name: "About", path: "/about" },
    { name: "Collaboration", path: "/research-collaboration" },
  ];

  const discoverItems = [
    { name: "Conferences", path: "/conferences" },
    { name: "Journals", path: "/journals" },
    { name: "Book Chapters", path: "/book-chapters" },
    { name: "Project Calls", path: "/project-calls" },
  ];

  const researchOpportunitiesItems = [
    { name: "PhD Programs", path: "/phd-programs" },
    { name: "Postdoc Positions", path: "/postdoc-positions" },
    { name: "Internships", path: "/internships" },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isDiscoverActive = discoverItems.some(
    (item) => location.pathname === item.path,
  );
  const isResearchOpportunitiesActive = researchOpportunitiesItems.some(
    (item) => location.pathname === item.path,
  );

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
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={logo}
              alt="ResearchSphere Logo"
              className="w-12 h-12 object-contain rounded-full"
            />
            <span className="text-2xl font-bold text-foreground">
              ResearchSphere
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-4">
            {mainNavItems.slice(0, 2).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive(item.path)
                    ? "text-primary bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-muted"
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Discover Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`px-3 py-2 h-auto text-sm font-medium hover:text-primary hover:bg-muted whitespace-nowrap ${
                    isDiscoverActive ? "text-primary bg-primary/10" : ""
                  }`}
                >
                  Discover
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {discoverItems.map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link
                      to={item.path}
                      className={`w-full cursor-pointer ${
                        isActive(item.path) ? "bg-primary/10 text-primary" : ""
                      }`}
                    >
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Research Opportunities Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`px-3 py-2 h-auto text-sm font-medium hover:text-primary hover:bg-muted whitespace-nowrap ${
                    isResearchOpportunitiesActive
                      ? "text-primary bg-primary/10"
                      : ""
                  }`}
                >
                  Opportunities
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {researchOpportunitiesItems.map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link
                      to={item.path}
                      className={`w-full cursor-pointer ${
                        isActive(item.path) ? "bg-primary/10 text-primary" : ""
                      }`}
                    >
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {mainNavItems.slice(2).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive(item.path)
                    ? "text-primary bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-muted"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-3 lg:gap-4 ml-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 space-y-2">
            {mainNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "text-primary bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-muted"
                }`}
              >
                {item.name}
              </Link>
            ))}

            <div className="px-4 py-2 text-sm font-semibold text-muted-foreground">
              Discover
            </div>
            {discoverItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "text-primary bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-muted"
                }`}
              >
                {item.name}
              </Link>
            ))}

            <div className="px-4 py-2 text-sm font-semibold text-muted-foreground">
              Opportunities
            </div>
            {researchOpportunitiesItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "text-primary bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-muted"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
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
