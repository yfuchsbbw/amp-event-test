import { renderSpeakers } from '../ui/speakerRenderer.js';

export async function initSpeakers() {
    try {
        const response = await fetch('/data/speakers.json');

        if (!response.ok) {
            throw new Error('Could not load speakers.json');
        }

        const speakers = await response.json();

        renderSpeakers(speakers);
    } catch (error) {
        console.error('initSpeakers failed:', error);
    }
}
