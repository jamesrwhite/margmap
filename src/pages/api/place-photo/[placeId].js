import { env } from 'cloudflare:workers';
import {
    METADATA_CACHE_TTL,
    applyCachingHeaders,
    buildCacheControl,
    cachePhotoMediaResponse,
    fetchPhotoDescriptor,
    getPhotoRequestOptions,
    jsonResponse,
} from '../../../lib/photos.js';

export const prerender = false;

export async function GET({ params, request, locals }) {
    if (!env.GOOGLE_MAPS_API_KEY) {
        return jsonResponse({ error: 'Missing GOOGLE_MAPS_API_KEY' }, { status: 503 });
    }

    const placeId = params.placeId?.trim();
    if (!placeId) {
        return jsonResponse({ error: 'Missing place ID' }, { status: 400 });
    }

    const url = new URL(request.url);
    const cacheKey = new Request(url.toString(), request);
    const cached = await caches.default.match(cacheKey);
    if (cached) {
        return applyCachingHeaders(cached, METADATA_CACHE_TTL);
    }

    try {
        const { width, height } = getPhotoRequestOptions(url);
        const descriptor = await fetchPhotoDescriptor(env.GOOGLE_MAPS_API_KEY, placeId);

        if (!descriptor) {
            return jsonResponse({
                imageUrl: '',
                authorAttributions: [],
            }, {
                status: 404,
                headers: { 'Cache-Control': buildCacheControl(METADATA_CACHE_TTL) },
            });
        }

        const body = {
            imageUrl: `/api/place-photo-media/${encodeURIComponent(placeId)}?w=${width}&h=${height}`,
            authorAttributions: descriptor.authorAttributions,
        };

        const response = jsonResponse(body, {
            headers: {
                'Cache-Control': buildCacheControl(METADATA_CACHE_TTL),
            },
        });

        const mediaUrl = new URL(request.url);
        mediaUrl.pathname = `/api/place-photo-media/${encodeURIComponent(placeId)}`;
        mediaUrl.searchParams.set('w', String(width));
        mediaUrl.searchParams.set('h', String(height));
        const mediaCacheKey = new Request(mediaUrl.toString(), request);

        locals.cfContext.waitUntil(Promise.all([
            caches.default.put(cacheKey, response.clone()),
            cachePhotoMediaResponse(env.GOOGLE_MAPS_API_KEY, mediaCacheKey, descriptor, width, height),
        ]));

        return response;
    } catch (error) {
        return jsonResponse({ error: error.message }, { status: 502 });
    }
}
