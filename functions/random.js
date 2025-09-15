export function onRequest(context) {
	const uuid = crypto.randomUUID();
	return new Response(uuid);
}