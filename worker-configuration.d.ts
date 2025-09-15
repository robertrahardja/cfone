// Type definitions for your Cloudflare Workers environment
interface Env {
  // Clerk authentication secret
  CLERK_SECRET_KEY: string;

  // KV Namespaces (if you add them later)
  SESSIONS?: KVNamespace;
  API_KEYS?: KVNamespace;

  // D1 Database (if you add it later)
  DB?: D1Database;

  // Environment variables
  ENVIRONMENT?: string;

  // Add other bindings as needed
}