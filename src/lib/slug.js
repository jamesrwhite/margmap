import slugifyLib from 'slugify';

export function slugify(value) {
    return slugifyLib(value, { lower: true, strict: true });
}
