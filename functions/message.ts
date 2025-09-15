import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequest: PagesFunction<Env> = async (context) => {
	// Middleware handles security - this function only handles business logic
	return new Response("Hello from Cloudflare Pages!");
};