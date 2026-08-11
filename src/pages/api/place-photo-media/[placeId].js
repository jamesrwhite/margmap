import { env } from 'cloudflare:workers';
import {
    MEDIA_CACHE_TTL,
    METADATA_CACHE_TTL,
    applyCachingHeaders,
    buildCacheControl,
    cachePhotoMediaResponse,
    fetchPhotoDescriptor,
    getPhotoRequestOptions,
} from '../../../lib/photos.js';

export const prerender = false;

export async function GET({ params, request }) {
    if (!env.GOOGLE_MAPS_API_KEY) {
        return new Response('Missing GOOGLE_MAPS_API_KEY', { status: 503 });
    }

    const placeId = params.placeId?.trim();
    if (!placeId) {
        return new Response('Missing place ID', { status: 400 });
    }

    const url = new URL(request.url);
    const cacheKey = new Request(url.toString(), request);
    const cached = await caches.default.match(cacheKey);
    if (cached) {
        return applyCachingHeaders(cached, MEDIA_CACHE_TTL);
    }

    try {
        const { width, height } = getPhotoRequestOptions(url);
        const descriptor = await fetchPhotoDescriptor(env.GOOGLE_MAPS_API_KEY, placeId);

        if (!descriptor) {
            return new Response('Photo not found', {
                status: 404,
                headers: { 'Cache-Control': buildCacheControl(METADATA_CACHE_TTL) },
            });
        }

        return await cachePhotoMediaResponse(env.GOOGLE_MAPS_API_KEY, cacheKey, descriptor, width, height);
    } catch (error) {
        return new Response(error.message, { status: 502 });
    }
}
