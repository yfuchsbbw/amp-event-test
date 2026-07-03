import { renderSpeakers } from '../ui/speakerRenderer.js';

export async function initSpeakers() {
    try {
        const [speakersResponse, archiveResponse] = await Promise.all([
            fetch('/data/speakers.json'),
            fetch('/data/speakers_2024.json'),
        ]);

        if (!speakersResponse.ok) {
            throw new Error('Could not load speakers.json');
        }

        if (!archiveResponse.ok) {
            throw new Error('Could not load speakers_2024.json');
        }

        const [speakers, archiveSpeakers] = await Promise.all([
            speakersResponse.json(),
            archiveResponse.json(),
        ]);

        renderSpeakers(speakers, archiveSpeakers);
    } catch (error) {
        console.error('initSpeakers failed:', error);
    }
}
