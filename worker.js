const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 900;
const MAX_DIMENSION = 1600;
const METADATA_CACHE_TTL = 60 * 60 * 24 * 7;
const MEDIA_CACHE_TTL = 60 * 60 * 24 * 30;
const STALE_WHILE_REVALIDATE = 60 * 60 * 24 * 7;

function json(data, init = {}) {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json; charset=utf-8');
    return new Response(JSON.stringify(data), {
        ...init,
        headers,
    });
}

function buildCacheControl(ttl) {
    return `public, max-age=86400, s-maxage=${ttl}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`;
}

function clampDimension(rawValue, fallback) {
    const value = parseInt(rawValue, 10);
    if (Number.isNaN(value)) {
        return fallback;
    }

    return Math.max(1, Math.min(MAX_DIMENSION, value));
}

function getPhotoRequestOptions(url) {
    const width = clampDimension(url.searchParams.get('w'), DEFAULT_WIDTH);
    const height = clampDimension(url.searchParams.get('h'), DEFAULT_HEIGHT);
    return { width, height };
}

function getPlaceIdFromPath(pathname, prefix) {
    return decodeURIComponent(pathname.slice(prefix.length)).trim();
}

function applyCachingHeaders(response, ttl) {
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', buildCacheControl(ttl));
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

function isExtensionlessPath(pathname) {
    const lastSegment = pathname.split('/').pop() || '';
    return lastSegment === '' || !lastSegment.includes('.');
}

async function fetchAsset(request, env) {
    if (!env.ASSETS) {
        return new Response('Static asset binding is not configured.', { status: 500 });
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) {
        return assetResponse;
    }

    const url = new URL(request.url);
    if (!isExtensionlessPath(url.pathname)) {
        return assetResponse;
    }

    return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
}

async function fetchPhotoDescriptor(env, placeId) {
    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        headers: {
            'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY,
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

async function cachePhotoMediaResponse(env, cacheKey, descriptor, width, height) {
    const photoUrl = new URL(`https://places.googleapis.com/v1/${descriptor.name}/media`);
    photoUrl.searchParams.set('maxWidthPx', String(width));
    photoUrl.searchParams.set('maxHeightPx', String(height));
    photoUrl.searchParams.set('key', env.GOOGLE_MAPS_API_KEY);

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

    if (descriptor.authorAttributions.length > 0) {
        headers.set('X-MargMap-Photo-Attribution', JSON.stringify(descriptor.authorAttributions));
    }

    const response = new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers,
    });

    await caches.default.put(cacheKey, response.clone());
    return response;
}

async function handlePhotoMetadata(request, env, ctx) {
    if (!env.GOOGLE_MAPS_API_KEY) {
        return json({ error: 'Missing GOOGLE_MAPS_API_KEY' }, { status: 503 });
    }

    const url = new URL(request.url);
    const placeId = getPlaceIdFromPath(url.pathname, '/api/place-photo/');
    if (!placeId) {
        return json({ error: 'Missing place ID' }, { status: 400 });
    }

    const cacheKey = new Request(url.toString(), request);
    const cached = await caches.default.match(cacheKey);
    if (cached) {
        return applyCachingHeaders(cached, METADATA_CACHE_TTL);
    }

    try {
        const { width, height } = getPhotoRequestOptions(url);
        const descriptor = await fetchPhotoDescriptor(env, placeId);

        if (!descriptor) {
            return json({
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

        const response = json(body, {
            headers: {
                'Cache-Control': buildCacheControl(METADATA_CACHE_TTL),
            },
        });

        const mediaUrl = new URL(request.url);
        mediaUrl.pathname = `/api/place-photo-media/${encodeURIComponent(placeId)}`;
        mediaUrl.searchParams.set('w', String(width));
        mediaUrl.searchParams.set('h', String(height));
        const mediaCacheKey = new Request(mediaUrl.toString(), request);

        ctx.waitUntil(Promise.all([
            caches.default.put(cacheKey, response.clone()),
            cachePhotoMediaResponse(env, mediaCacheKey, descriptor, width, height),
        ]));

        return response;
    } catch (error) {
        return json({ error: error.message }, { status: 502 });
    }
}

async function handlePhotoMedia(request, env) {
    if (!env.GOOGLE_MAPS_API_KEY) {
        return new Response('Missing GOOGLE_MAPS_API_KEY', { status: 503 });
    }

    const url = new URL(request.url);
    const placeId = getPlaceIdFromPath(url.pathname, '/api/place-photo-media/');
    if (!placeId) {
        return new Response('Missing place ID', { status: 400 });
    }

    const cacheKey = new Request(url.toString(), request);
    const cached = await caches.default.match(cacheKey);
    if (cached) {
        return applyCachingHeaders(cached, MEDIA_CACHE_TTL);
    }

    try {
        const { width, height } = getPhotoRequestOptions(url);
        const descriptor = await fetchPhotoDescriptor(env, placeId);

        if (!descriptor) {
            return new Response('Photo not found', {
                status: 404,
                headers: { 'Cache-Control': buildCacheControl(METADATA_CACHE_TTL) },
            });
        }

        return await cachePhotoMediaResponse(env, cacheKey, descriptor, width, height);
    } catch (error) {
        return new Response(error.message, { status: 502 });
    }
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        if (url.pathname.startsWith('/api/place-photo-media/')) {
            return handlePhotoMedia(request, env, ctx);
        }

        if (url.pathname.startsWith('/api/place-photo/')) {
            return handlePhotoMetadata(request, env, ctx);
        }

        return fetchAsset(request, env);
    },
};
