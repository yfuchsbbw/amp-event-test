import '../css/main.css';

import { initSpeakers } from './modules/speakers.js';
import { initNavigation } from './modules/navigation.js';
import { initMobileNav } from './modules/mobileNav.js';
import { initHover } from './modules/hover.js';
import { initVideo } from './modules/video.js';
import { initAnimations } from './modules/animations.js';

document.addEventListener('DOMContentLoaded', async () => {

    await initSpeakers();

    initAnimations();
    initVideo();
    initNavigation();
    initMobileNav();
    initHover();
});
