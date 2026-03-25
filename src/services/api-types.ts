// Type definitions for ResearchSphere API

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  publishedDate: string;
  category: string;
  url: string;
  source: string;
  doi?: string;
  citationCount?: number;
  venue?: string;
}

export interface Conference {
  id: string;
  title: string;
  location: string;
  date: string;
  category: string;
  description: string;
  url: string;
  deadline?: string;
}

export interface Journal {
  id: string;
  title: string;
  publisher: string;
  impactFactor?: string;
  issn?: string;
  subjects: string[];
  url: string;
  openAccess?: boolean;
}

export interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    imageLinks?: {
      thumbnail: string;
    };
    previewLink: string;
    infoLink: string;
    categories?: string[];
  };
}

export interface HFModel {
  id: string;
  modelId: string;
  author?: string;
  lastModified: string;
  downloads: number;
  likes: number;
  pipeline_tag?: string;
  tags: string[];
}

export interface DBLPPublication {
  title: string;
  authors: { author: string[] } | { author: string };
  venue: string;
  year: string;
  type: string;
  url: string;
  doi?: string;
}

export interface NSFAward {
  id: string;
  title: string;
  fundsObligatedAmt: string;
  awardeeName: string;
  date: string;
  expDate: string;
  abstractText?: string;
  agency?: string;
}

export interface OpenAlexSource {
  id: string;
  displayName: string;
  type: string;
  hostOrganization: string;
  countryCode: string;
  url: string;
  worksCount: number;
  citedByCount: number;
}

export interface ProjectOpportunity {
  id: string;
  title: string;
  organization: string;
  type: string;
  date: string;
  description: string;
  url: string;
  source: "OpenAlex" | "CrossRef";
}

// API-specific paper types for GeneralFinder
// Note: The backend normalizes all API responses to the Paper interface
// So these are just aliases for clarity in the frontend
export interface ArxivPaper extends Paper {}
export interface CrossRefWork extends Paper {}
export interface OpenAlexWork extends Paper {}
