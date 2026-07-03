export function isHidden(element) {
    if (!element) {
        return true;
    }

    return window.getComputedStyle(element).display === 'none';
}

export function isHumanClick(event) {
    return Boolean(event.screenX && event.screenX !== 0 && event.screenY && event.screenY !== 0);
}

export function qs(selector, root = document) {
    return root.querySelector(selector);
}

export function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
}

export function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export function escapeAttribute(value = '') {
    return escapeHtml(value);
}

export function slugify(value = '') {
    return String(value)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
