import { defineToolkit } from "../shared.js";

export const stripeToolkit = defineToolkit({
  directoryName: "stripe",
  cliName: "stripe",
  apiSlug: "stripe",
  displayName: "Stripe",
  summary: "invoices",
  capabilities: ["invoices", "customers", "payments"],
  examples: ["list-invoices", "create-invoice", "create-customer"],
  readCheckActions: ["list-invoices"],
  featuredActions: [
    {
      canonical: "list-invoices",
      priority: 100,
      shortHelp: "List invoices for billing workflows.",
    },
    {
      canonical: "get-invoices-invoice",
      priority: 90,
      shortHelp: "Read one invoice by ID.",
    },
    {
      canonical: "create-customer",
      priority: 80,
      shortHelp: "Create a Stripe customer.",
    },
    {
      canonical: "create-invoice",
      priority: 70,
      shortHelp: "Create a draft invoice.",
    },
    {
      canonical: "send-invoice",
      priority: 60,
      shortHelp: "Send an invoice to the customer.",
    },
  ],
});
