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
