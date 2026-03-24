import { useEffect } from "react";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialize Google Analytics if measurement ID is provided
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (measurementId) {
      initializeGoogleAnalytics(measurementId);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/conferences" element={<Conferences />} />
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
              <Route path="/user-hub" element={<UserHub />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
