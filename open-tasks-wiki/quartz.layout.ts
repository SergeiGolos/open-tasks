import { PageLayout, LayoutOptions } from "./quartz/components"

const options: LayoutOptions = {
  // Left sidebar configuration
  leftSidebar: {
    components: [
      "Profile",
      "Search",
      "RecentNotes",
    ],
    width: 256,
  },

  // Right sidebar configuration
  rightSidebar: {
    components: [
      "TableOfContents",
      "Backlinks",
    ],
    width: 256,
  },

  // Body components
  body: [
    "Content",
  ],

  // Footer components
  footer: [
    "PageFooter",
  ],

  // Page components
  page: [
    "ArticleTitle",
    "Content",
  ],
}

export const layout: PageLayout = {
  ...options,
  // Custom branding for bitcobblers/open-tasks
  theme: {
    typography: {
      header: "Inter, system-ui, sans-serif",
      body: "Inter, system-ui, sans-serif",
      code: "JetBrains Mono, Fira Code, monospace",
    },
    colors: {
      lightMode: {
        light: "#faf8f5",
        dark: "#2a2a2a",
        gray: "#5e5e5e",
        lightgray: "#e5e5e5",
        darkgray: "#b8b8b8",
        secondary: "#2563eb",
        tertiary: "#7c3aed",
        highlight: "#fef3c7",
        textHighlight: "#3b82f6",
      },
      darkMode: {
        light: "#1a1a1a",
        dark: "#e0e0e0",
        gray: "#6b6b6b",
        lightgray: "#2a2a2a",
        darkgray: "#a0a0a0",
        secondary: "#3b82f6",
        tertiary: "#a855f7",
        highlight: "#92400e",
        textHighlight: "#60a5fa",
      }
    }
  }
}

export default layout