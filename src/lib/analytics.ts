// Simple page visit tracking using localStorage
export const trackPageVisit = () => {
  if (typeof window === "undefined") return 0;

  try {
    const visitKey = "researchsphere_visits";
    const currentVisits = localStorage.getItem(visitKey);
    const visits = currentVisits ? parseInt(currentVisits, 10) + 1 : 1;
    localStorage.setItem(visitKey, visits.toString());
    return visits;
  } catch {
    return 0;
  }
};

export const getVisitCount = (): number => {
  if (typeof window === "undefined") return 0;

  try {
    const visitKey = "researchsphere_visits";
    const visits = localStorage.getItem(visitKey);
    return visits ? parseInt(visits, 10) : 0;
  } catch {
    return 0;
  }
};

// Initialize Google Analytics
export const initializeGoogleAnalytics = (measurementId: string) => {
  if (typeof window === "undefined" || !measurementId) return;

  try {
    // Add Google Analytics script
    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize gtag
    const win = window as any;
    win.dataLayer = win.dataLayer || [];

    function gtag(...args: any[]) {
      win.dataLayer.push(args);
    }

    win.gtag = gtag;
    gtag("js", new Date());
    gtag("config", measurementId);
  } catch (error) {
    console.error("Failed to initialize Google Analytics:", error);
  }
};
