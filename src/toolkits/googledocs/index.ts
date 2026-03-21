import { defineToolkit } from "../shared.js";

export const googleDocsToolkit = defineToolkit({
  directoryName: "googledocs",
  cliName: "google-docs",
  apiSlug: "googledocs",
  displayName: "Google Docs",
  summary: "create, read, update, search, export documents",
  capabilities: ["create", "read", "update", "search", "export"],
  examples: ["create-document", "get-document-by-id", "update-document-markdown"],
  readCheckActions: ["get-document-by-id", "get-document-plaintext", "search-documents"],
  aliases: ["googledocs", "google_docs"],
  featuredActions: [
    {
      canonical: "create-document",
      priority: 100,
      shortHelp: "Create a blank Google Doc with a title and optional starter text.",
    },
    {
      canonical: "get-document-by-id",
      priority: 90,
      shortHelp: "Read one Google Doc by document ID.",
    },
    {
      canonical: "get-document-plaintext",
      priority: 80,
      shortHelp: "Read a Google Doc as plain text without traversing raw Docs JSON.",
    },
    {
      canonical: "search-documents",
      priority: 70,
      shortHelp: "Search Google Docs by name, content, and date filters.",
    },
    {
      canonical: "update-document-markdown",
      priority: 60,
      shortHelp: "Replace the full document body from Markdown content.",
    },
    {
      canonical: "update-document-section-markdown",
      priority: 50,
      shortHelp: "Replace or insert one document section from Markdown.",
    },
    {
      canonical: "update-existing-document",
      priority: 40,
      shortHelp: "Apply structured batch edits like insertions, deletions, and formatting.",
    },
    {
      canonical: "insert-text-action",
      priority: 30,
      shortHelp: "Insert or append text into an existing document.",
    },
    {
      canonical: "replace-all-text",
      priority: 20,
      shortHelp: "Run a global find-and-replace across the document.",
    },
    {
      canonical: "export-document-as-pdf",
      priority: 10,
      shortHelp: "Export a Google Doc as PDF for sharing or download.",
    },
  ],
});
