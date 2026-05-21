import lottie from 'lottie-web';

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

        lottie.loadAnimation({
            container,
            renderer: 'svg',
            loop: false,
            autoplay: true,
            path: '/media/json/AMP-26-Logo-Black.json',
        });
    });
}
