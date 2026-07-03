import '../css/main.css';

import { initSpeakers } from './modules/speakers.js';
import { initProgram } from './modules/program.js';
import { initNavigation } from './modules/navigation.js';
import { initVideo } from './modules/video.js';
import { initAnimations } from './modules/animations.js';

document.addEventListener('DOMContentLoaded', async () => {

    await waitForFonts();
    await initProgram();
    await initSpeakers();

    initAnimations();
    initVideo();
    initNavigation();
});

async function waitForFonts() {
    if (!document.fonts?.ready) {
        document.documentElement.classList.remove('fonts-loading');
        return;
    }

    try {
        await Promise.all([
            document.fonts.load('400 16px "Helvetica Neue LT Pro"'),
            document.fonts.load('500 16px "Helvetica Neue LT Pro"'),
            document.fonts.load('700 16px "Helvetica Neue LT Pro"'),
            document.fonts.ready,
        ]);
    } finally {
        document.documentElement.classList.remove('fonts-loading');
    }
}
