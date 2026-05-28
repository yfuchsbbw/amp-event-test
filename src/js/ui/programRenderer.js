export function renderProgram(programItems) {
    const list = document.querySelector('#program-list');

    if (!list || !Array.isArray(programItems) || programItems.length === 0) {
        return;
    }

    list.innerHTML = programItems.map(createProgramItem).join('');
}

function createProgramItem(item) {
    const timeLabel = [item.timePrefix, item.time]
        .filter(Boolean)
        .join(' ');

    return `
        <li class="program-item">
            <span>${escapeHtml(item.title)}</span>
            <time>${escapeHtml(timeLabel)} Uhr</time>
        </li>
    `;
}

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
