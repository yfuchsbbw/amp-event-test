import { renderProgram } from '../ui/programRenderer.js';

export async function initProgram() {
    try {
        const response = await fetch('/data/program.json');

        if (!response.ok) {
            throw new Error('Could not load program.json');
        }

        const programItems = await response.json();

        renderProgram(programItems);
    } catch (error) {
        console.error('initProgram failed:', error);
    }
}
