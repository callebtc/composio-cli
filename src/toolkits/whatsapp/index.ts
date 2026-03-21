import { defineToolkit } from "../shared.js";

export const whatsappToolkit = defineToolkit({
  directoryName: "whatsapp",
  cliName: "whatsapp",
  apiSlug: "whatsapp",
  displayName: "WhatsApp",
  summary: "send message, templates",
  capabilities: ["messages", "templates"],
  examples: ["send-message", "send-template-message", "get-message-templates"],
  readCheckActions: ["list-templates"],
  featuredActions: [
    {
      canonical: "send-message",
      priority: 100,
      shortHelp: "Send a plain text WhatsApp message.",
    },
    {
      canonical: "send-template-message",
      priority: 90,
      shortHelp: "Send an approved template message.",
    },
    {
      canonical: "send-media",
      priority: 80,
      shortHelp: "Send an image, file, or other media.",
    },
    {
      canonical: "get-message-templates",
      priority: 70,
      shortHelp: "List available template messages.",
    },
    {
      canonical: "create-message-template",
      priority: 60,
      shortHelp: "Create a new template for review.",
    },
  ],
});
