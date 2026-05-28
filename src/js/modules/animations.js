import lottie from 'lottie-web';
import { state } from '../core/state.js';

export function initAnimations() {
    loadLogoAnimations();
}

export function loadLogoAnimations() {
    const logoTargets = [
        '#logo-animated',
        '#logo-placeholder',
        '#logo-placeholder1',
        '#logo-placeholder2',
        '#logo-placeholder3',
    ];

    logoTargets.forEach((selector) => {
        const container = document.querySelector(selector);

        if (!container || container.dataset.logoLoaded === 'true') {
            return;
        }

        container.dataset.logoLoaded = 'true';

        const animation = lottie.loadAnimation({
            container,
            renderer: 'svg',
            loop: false,
            autoplay: true,
            path: '/media/json/AMP-26-Logo-Black.json',
        });

        animation.addEventListener('DOMLoaded', () => {
            state.logoAnimationLoaded = true;
        });

        animation.addEventListener('data_failed', () => {
            state.logoAnimationLoaded = true;
        });
    });
}
