const DIACRITICS = /[̀-ͯ]/g;

export function slugify(value) {
    return value
        .normalize('NFKD')
        .replace(DIACRITICS, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
