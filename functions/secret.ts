import type { PagesFunction } from '@cloudflare/workers-types';

interface EnvWithSecret extends Env {
	test_secret?: string;
}

export const onRequest: PagesFunction<EnvWithSecret> = async (context) => {
	// Middleware handles security - this function only handles business logic
	const secret = context.env.test_secret;
	return new Response(JSON.stringify({ secret: secret || 'Secret not found' }), {
		headers: { 'Content-Type': 'application/json' },
	});
};