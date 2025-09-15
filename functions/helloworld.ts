import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequest: PagesFunction<Env> = async (context) => {
	return new Response("Hello, world!");
};
