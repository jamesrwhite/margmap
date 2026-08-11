const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 900;
const MAX_DIMENSION = 1600;
const STALE_WHILE_REVALIDATE = 60 * 60 * 24 * 7;

export const METADATA_CACHE_TTL = 60 * 60 * 24 * 7;
export const MEDIA_CACHE_TTL = 60 * 60 * 24 * 30;

export function jsonResponse(data, init = {}) {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json; charset=utf-8');
    return new Response(JSON.stringify(data), {
        ...init,
        headers,
    });
}

export function buildCacheControl(ttl) {
    return `public, max-age=86400, s-maxage=${ttl}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`;
}

function clampDimension(rawValue, fallback) {
    const value = parseInt(rawValue, 10);
    if (Number.isNaN(value)) {
        return fallback;
    }

    return Math.max(1, Math.min(MAX_DIMENSION, value));
}

export function getPhotoRequestOptions(url) {
    const width = clampDimension(url.searchParams.get('w'), DEFAULT_WIDTH);
    const height = clampDimension(url.searchParams.get('h'), DEFAULT_HEIGHT);
    return { width, height };
}

export function applyCachingHeaders(response, ttl) {
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', buildCacheControl(ttl));
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

export async function fetchPhotoDescriptor(apiKey, placeId) {
    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'photos',
        },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Place details request failed (${response.status}): ${text}`);
    }

    const payload = await response.json();
    const firstPhoto = payload.photos?.[0];

    if (!firstPhoto?.name) {
        return null;
    }

    return {
        name: firstPhoto.name,
        authorAttributions: (firstPhoto.authorAttributions || []).map((entry) => ({
            displayName: entry.displayName || '',
            uri: entry.uri || '',
            photoUri: entry.photoUri || '',
        })),
    };
}

export async function cachePhotoMediaResponse(apiKey, cacheKey, descriptor, width, height) {
    const photoUrl = new URL(`https://places.googleapis.com/v1/${descriptor.name}/media`);
    photoUrl.searchParams.set('maxWidthPx', String(width));
    photoUrl.searchParams.set('maxHeightPx', String(height));
    photoUrl.searchParams.set('key', apiKey);

    const upstreamResponse = await fetch(photoUrl.toString(), {
        redirect: 'follow',
        cf: {
            cacheTtl: MEDIA_CACHE_TTL,
            cacheEverything: true,
        },
    });

    if (!upstreamResponse.ok) {
        const text = await upstreamResponse.text();
        throw new Error(`Place photo request failed (${upstreamResponse.status}): ${text}`);
    }

    const headers = new Headers(upstreamResponse.headers);
    headers.set('Cache-Control', buildCacheControl(MEDIA_CACHE_TTL));

    const response = new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers,
    });

    await caches.default.put(cacheKey, response.clone());
    return response;
}
