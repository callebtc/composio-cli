import { defineToolkit } from "../shared.js";

export const googleMapsToolkit = defineToolkit({
  directoryName: "googlemaps",
  cliName: "google-maps",
  apiSlug: "google_maps",
  displayName: "Google Maps",
  summary: "search places, geocode, routes, directions, place details",
  capabilities: ["places", "geocoding", "routes", "directions", "media"],
  examples: ["text-search", "get-route", "get-place-details"],
  readCheckActions: ["text-search", "nearby-search", "get-place-details"],
  aliases: ["googlemaps", "google_maps"],
  featuredActions: [
    {
      canonical: "text-search",
      priority: 100,
      shortHelp: "Search places from a natural-language query like restaurants or landmarks.",
    },
    {
      canonical: "get-place-details",
      priority: 90,
      shortHelp: "Fetch detailed metadata for one place ID.",
    },
    {
      canonical: "nearby-search",
      priority: 80,
      shortHelp: "Find places near a coordinate with type and radius filters.",
    },
    {
      canonical: "autocomplete",
      priority: 70,
      shortHelp: "Get typeahead place suggestions while the query is still incomplete.",
    },
    {
      canonical: "get-route",
      priority: 60,
      shortHelp: "Calculate route options between an origin and destination.",
    },
    {
      canonical: "compute-route-matrix",
      priority: 50,
      shortHelp: "Compare travel times and distances across many origins and destinations.",
    },
    {
      canonical: "geocoding-api",
      priority: 40,
      shortHelp: "Convert between addresses, coordinates, and place IDs.",
    },
    {
      canonical: "geocode-location",
      priority: 30,
      shortHelp: "Reverse geocode coordinates into a human-readable address.",
    },
    {
      canonical: "place-photo",
      priority: 20,
      shortHelp: "Download a place photo once you have a photo reference.",
    },
    {
      canonical: "maps-embed-api",
      priority: 10,
      shortHelp: "Generate an embeddable Google Maps URL or iframe.",
    },
  ],
});
