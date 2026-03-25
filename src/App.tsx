import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { initializeGoogleAnalytics } from "@/lib/analytics";
import Index from "./pages/Index";
import Conferences from "./pages/Conferences";
import Journals from "./pages/Journals";
import GeneralFinder from "./pages/GeneralFinder";
import BookChapters from "./pages/BookChapters";
import ProjectCalls from "./pages/ProjectCalls";
import PhDPrograms from "./pages/PhDPrograms";
import PostdocPositions from "./pages/PostdocPositions";
import Internships from "./pages/Internships";
import About from "./pages/About";
import Contact from "./pages/Contact";
// import Assistant from "./pages/Assistant";
import UserHub from "./pages/UserHub";
import ResearchFeed, { INITIAL_RESEARCH_PAPERS, type ResearchPaper } from "./pages/ResearchFeed";
import AddPaper from "./pages/AddPaper";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SavePaperDemo from "./pages/SavePaperDemo";
import SavedPapers from "./pages/SavedPapers";
import AuthStatusDemo from "./pages/AuthStatusDemo";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => {
  const [papers, setPapers] = useState<ResearchPaper[]>(INITIAL_RESEARCH_PAPERS);

  useEffect(() => {
    // Initialize Google Analytics if measurement ID is provided
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (measurementId) {
      initializeGoogleAnalytics(measurementId);
    }
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/save-paper-demo" element={<SavePaperDemo />} />              <Route path="/auth-status-demo" element={<AuthStatusDemo />} />                <Route path="/conferences" element={<Conferences />} />
                <Route path="/journals" element={<Journals />} />
                <Route path="/general-finder" element={<GeneralFinder />} />
                <Route path="/book-chapters" element={<BookChapters />} />
                <Route path="/project-calls" element={<ProjectCalls />} />
                <Route path="/phd-programs" element={<PhDPrograms />} />
                <Route path="/postdoc-positions" element={<PostdocPositions />} />
                <Route path="/internships" element={<Internships />} />
                <Route path="/about" element={<About />} />
                <Route path="/research-collaboration" element={<Contact />} />
                {/* <Route path="/assistant" element={<Assistant />} /> */}
                <Route path="/research-feed" element={<ResearchFeed papers={papers} />} />
                <Route
                  path="/add-paper"
                  element={<AddPaper papers={papers} setPapers={setPapers} />}
                />
                <Route path="/user-hub" element={<UserHub />} />
                <Route path="/saved-papers" element={<ProtectedRoute><SavedPapers /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
};

export default App;
