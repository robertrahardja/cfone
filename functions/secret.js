export async function onRequest(context) {
	const secret = context.env.test_secret;
	return new Response(JSON.stringify({ secret: secret || 'Secret not found' }), {
		headers: { 'Content-Type': 'application/json' },
	});
}