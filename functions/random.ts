import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequest: PagesFunction<Env> = async (context) => {
	const uuid = crypto.randomUUID();
	return new Response(uuid);
};