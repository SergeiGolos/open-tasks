import { QuartzConfig } from "./quartz/cfg"

const config: QuartzConfig = {
  configuration: {
    title: "Open Tasks CLI | bitcobblers/open-tasks",
    baseUrl: "bitcobblers.github.io/open-tasks",
    description: "Flexible command-line tool for composable workflow automation by bitcobblers",
    author: "bitcobblers",

    // Enable features for better documentation
    enableSPA: true,
    enableLatex: false,
    enableCodeCopy: true,
    enableRSS: false,
  },

  plugins: {
    transformers: [
      // Frontmatter processing
      frontmatter: {},
      // Markdown rendering
      markdown: {},
      // Syntax highlighting
      syntax: {
        theme: "github-dark",
        wrap: true,
      },
      // Table of contents
      toc: {
        minDepth: 2,
        maxDepth: 3,
      },
    ],
    filters: [
      // Remove drafts
      draft: {},
    ],
    emitters: [
      // Generate RSS feed
      rss: {
        siteUrl: "https://bitcobblers.github.io/open-tasks",
        title: "Open Tasks CLI Documentation",
        description: "Documentation for the Open Tasks CLI workflow automation tool",
      },
      // Generate sitemap
      sitemap: {},
    ]
  }
}

export default config