// MIDDLEWARE: This code runs BEFORE every request to check security
// Think of it as a security guard at the door checking IDs

import { verifyToken } from '@clerk/backend';
import type { PagesFunction } from '@cloudflare/workers-types';

// Define the context type with Clerk user data
interface DataWithUser {
	user?: any; // Clerk user payload
}

export const onRequest: PagesFunction<Env, "", DataWithUser> = async (context) => {
	const { request, next, env } = context;
	const url = new URL(request.url);

	// STEP 1: DEFINE WHO CAN EMBED YOUR SITE
	// Only these websites can put your app in an iframe
	// Like a guest list at a party - only invited domains allowed
	const ALLOWED_DOMAINS = [
		'https://cfone-3ne.pages.dev',  // Your own site
		'http://localhost:3000',         // For testing locally
		'http://localhost:8080',         // For WordPress local testing
		// Add customer domains here like:
		// 'https://customer-site.com',
	];

	// STEP 2: CHECK WHERE THE REQUEST IS COMING FROM
	// Origin = Where JavaScript fetch() calls come from
	// Referer = What page is trying to embed you in an iframe
	const origin = request.headers.get('Origin');
	const referer = request.headers.get('Referer');

	// STEP 3: IS SOMEONE TRYING TO EMBED YOUR MAIN PAGE?
	// Check if they're loading your homepage (/) or index.html
	const isIframe = url.pathname === '/' || url.pathname === '/index.html';

	// If someone is embedding you, make sure they're on the guest list
	if (isIframe && referer) {
		// Parse the referring website's URL
		const refererUrl = new URL(referer);
		const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;

		// Block them if they're not on your allowed list
		if (!ALLOWED_DOMAINS.includes(refererOrigin)) {
			return new Response('This site cannot be embedded here', {
				status: 403,  // 403 = Forbidden
				headers: { 'X-Frame-Options': 'DENY' }  // Extra protection for old browsers
			});
		}
	}

	// STEP 4: CHECK LOGIN FOR API CALLS AND SENSITIVE ENDPOINTS
	// Protected paths that require authentication
	const protectedPaths = ['/api/', '/secret', '/dashboard'];
	const isProtectedPath = protectedPaths.some(path => url.pathname.startsWith(path));

	// Allow access from your own domain (iframe) without auth
	const isFromAllowedOrigin = origin && ALLOWED_DOMAINS.includes(origin);

	if (isProtectedPath && !isFromAllowedOrigin) {
		// Look for a token in the Authorization header
		// Format: "Authorization: Bearer abc123token"
		const token = request.headers.get('Authorization')?.replace('Bearer ', '');

		if (token) {
			try {
				// Ask Clerk: "Is this token valid? Who is this user?"
				const payload = await verifyToken(token, {
					secretKey: env.CLERK_SECRET_KEY,  // Your secret password with Clerk
				});

				// Save the user info for your function to use later
				context.data.user = payload;
			} catch (error) {
				// Token is fake or expired - kick them out
				console.error('Token verification failed:', error);
				return new Response('Unauthorized', { status: 401 });  // 401 = Not logged in
			}
		} else if (!url.pathname.includes('/public')) {
			// No token and not a public route? Block them
			return new Response('Authentication required', { status: 401 });
		}
	}

	// STEP 5: LET THE REQUEST CONTINUE
	// If they passed all checks, let them through to your actual function
	const response = await next();

	// STEP 6: ADD SECURITY HEADERS TO THE RESPONSE
	// Like putting a security seal on the envelope before sending it back
	const newResponse = new Response(response.body, response);

	// For iframes: Tell browsers which sites can embed you
	if (isIframe) {
		// CSP = Content Security Policy - modern browser security
		const cspFrameAncestors = ALLOWED_DOMAINS.join(' ');
		newResponse.headers.set('Content-Security-Policy', `frame-ancestors ${cspFrameAncestors};`);
	}

	// For API calls: Allow JavaScript from approved sites to call you
	// CORS = Cross-Origin Resource Sharing - lets approved sites use your API
	if (origin && ALLOWED_DOMAINS.includes(origin)) {
		newResponse.headers.set('Access-Control-Allow-Origin', origin);  // Yes, you can call me
		newResponse.headers.set('Access-Control-Allow-Credentials', 'true');  // You can send cookies
		newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');  // Allowed actions
		newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');  // Allowed headers
	}

	// STEP 7: ADD GENERAL SECURITY HEADERS
	// These protect against common web attacks
	newResponse.headers.set('X-Content-Type-Options', 'nosniff');  // Don't guess file types
	newResponse.headers.set('Strict-Transport-Security', 'max-age=31536000');  // Always use HTTPS

	// Send the response back with all security headers attached
	return newResponse;
}