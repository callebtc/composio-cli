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
    {
      canonical: "list-customers",
      priority: 50,
      shortHelp: "List Stripe customers.",
    },
    {
      canonical: "retrieve-customer",
      priority: 40,
      shortHelp: "Read one customer record.",
    },
    {
      canonical: "create-payment-intent",
      priority: 30,
      shortHelp: "Create a payment intent for charging.",
    },
    {
      canonical: "list-payment-intents",
      priority: 20,
      shortHelp: "List payment intents and statuses.",
    },
    {
      canonical: "retrieve-upcoming-invoice",
      priority: 10,
      shortHelp: "Preview the next invoice for a customer.",
    },
  ],
});
