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
    {
      canonical: "send-interactive-buttons",
      priority: 50,
      shortHelp: "Send a WhatsApp message with interactive buttons.",
    },
    {
      canonical: "send-interactive-list",
      priority: 40,
      shortHelp: "Send a WhatsApp list selection message.",
    },
    {
      canonical: "send-location",
      priority: 30,
      shortHelp: "Send a location message.",
    },
    {
      canonical: "upload-media",
      priority: 20,
      shortHelp: "Upload media before sending it.",
    },
    {
      canonical: "get-business-profile",
      priority: 10,
      shortHelp: "Inspect the connected business profile.",
    },
  ],
});
