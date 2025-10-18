import { QuartzConfig } from "./quartz/cfg"

const config: QuartzConfig = {
  configuration: {
    title: "Open Tasks CLI | bitcobblers/open-tasks",
    baseUrl: "bitcobblers.github.io/open-tasks",
    description: "Flexible command-line tool for composable workflow automation by bitcobblers",
    author: "bitcobblers",
    enableSPA: true,
    enableLatex: false,
    enableCodeCopy: true,
    enableRSS: false,
  },

  plugins: {
    transformers: [
      "frontmatter",
      "markdown",
      "syntax",
      "toc"
    ],
    filters: [
      "draft"
    ],
    emitters: [
      "rss",
      "sitemap"
    ]
  }
}

export default config