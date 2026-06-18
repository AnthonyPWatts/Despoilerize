export type SupportedSite = {
  id: string;
  label: string;
  description: string;
  domains: string[];
};

export const supportedSites: SupportedSite[] = [
  {
    id: "google-search",
    label: "Google Search",
    description: "Search result pages on Google.",
    domains: ["www.google.com", "www.google.co.uk"]
  },
  {
    id: "google-news",
    label: "Google News",
    description: "News feeds and topic pages.",
    domains: ["news.google.com"]
  },
  {
    id: "bbc",
    label: "BBC",
    description: "BBC Sport and related BBC pages.",
    domains: ["www.bbc.co.uk", "www.bbc.com"]
  },
  {
    id: "the-guardian",
    label: "The Guardian",
    description: "Guardian sport and article lists.",
    domains: ["www.theguardian.com"]
  },
  {
    id: "youtube",
    label: "YouTube",
    description: "Video lists, search, and recommendations.",
    domains: ["www.youtube.com"]
  }
];
