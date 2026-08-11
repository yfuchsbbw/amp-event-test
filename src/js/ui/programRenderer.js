import { gsap } from 'gsap';
import { escapeHtml } from '../core/helpers.js';

let resetProgramDetailState = null;
let resetProgramDetailDelayCall = null;
let programDetailTimeline = null;
let programHoverCursorDelay = null;
let programHoverCursorFrame = null;
let programHoverCursorCurrent = null;
let programHoverCursorTarget = null;

const PROGRAM_REFERATE = [
    {
        id: 'start-referate',
        time: '13:00 Uhr',
        title: 'Start der Referate und Beiträge',
        items: [
            ['Prof. Dr. Francis Cheneval', 'Referat'],
            ['David Nauer', 'Referat'],
            ['Niels Hintermann', 'Referat'],
        ],
    },
    {
        id: 'referate-podium',
        time: '15:15 - 17:00 Uhr',
        title: 'Referate und Podiumsdiskussion',
        items: [
            ['Prof. Dr. Heike Bruch', 'Referat'],
            ['Podiumsdiskussion', ''],
        ],
    },
];

export function resetProgramDetail({ delay = 0 } = {}) {
    resetProgramDetailDelayCall?.kill();
    resetProgramDetailDelayCall = null;

    if (delay > 0 && document.body.classList.contains('program-detail-open')) {
        resetProgramDetailDelayCall = gsap.delayedCall(delay, () => {
            resetProgramDetailDelayCall = null;
            resetProgramDetailState?.();
        });
        return;
    }

    resetProgramDetailState?.();
}

export function renderProgram(programItems) {
    const list = document.querySelector('#program-list');
    const panel = document.querySelector('#nav-r-programm');
    const download = panel?.querySelector('.program-download');

    if (!list || !panel || !Array.isArray(programItems) || programItems.length === 0) {
        return;
    }

    list.innerHTML = programItems.map(createProgramItem).join('');
    panel.insertAdjacentHTML('beforeend', '<div id="program-detail" class="program-detail" aria-live="polite"></div>');

    const detail = panel.querySelector('#program-detail');

    resetProgramDetailState = () => {
        if (!document.body.classList.contains('program-detail-open') && !programDetailTimeline) {
            return;
        }

        programDetailTimeline?.kill();
        programDetailTimeline = null;
        gsap.killTweensOf([panel, list, detail, download]);
        document.body.classList.remove('changing_page');
        document.body.classList.remove('program-detail-open');
        detail.innerHTML = '';
        detail.hidden = true;
        list.hidden = false;
        download.hidden = false;
        gsap.set([list, download], { autoAlpha: 1, y: 0 });
        gsap.set(detail, { autoAlpha: 0, y: 18 });
        gsap.set(panel, { autoAlpha: 1, y: 0 });
    };

    detail.hidden = true;
    bindProgramDetail(panel, list, detail, download);
    bindProgramHoverCursor(list);
}

function createProgramItem(item) {
    const timeLabel = [item.timePrefix, item.time]
        .filter(Boolean)
        .join(' ');
    const referatIndex = getReferatIndex(item.title || '');
    const isReferat = referatIndex >= 0;
    const content = `
        <span>${escapeHtml(item.title)}</span>
        <time>${escapeHtml(timeLabel)} Uhr</time>
    `;

    return `
        <li class="program-item${isReferat ? ' program-item--referat' : ''}"${isReferat ? ` data-program-referat="${referatIndex}"` : ''}>
            ${isReferat
                ? `<button class="program-item__content" type="button">${content}</button>`
                : `<div class="program-item__content">${content}</div>`}
        </li>
    `;
}

function bindProgramDetail(panel, list, detail, download) {
    list.addEventListener('click', (event) => {
        const item = event.target.closest('[data-program-referat]');

        if (!item) {
            return;
        }

        const referat = PROGRAM_REFERATE[Number(item.dataset.programReferat)];

        if (!referat) {
            return;
        }

        hideProgramHoverCursor();
        openProgramDetail({ referat, panel, list, detail, download });
    });

    detail.addEventListener('click', (event) => {
        const backButton = event.target.closest('[data-program-back]');

        if (!backButton) {
            return;
        }

        closeProgramDetail({ panel, list, detail, download });
    });
}

function openProgramDetail({ referat, panel, list, detail, download }) {
    resetProgramDetailDelayCall?.kill();
    resetProgramDetailDelayCall = null;
    programDetailTimeline?.kill();
    programDetailTimeline = null;
    document.body.classList.remove('changing_page');
    gsap.killTweensOf([panel, list, detail, download]);
    document.body.classList.add('changing_page');

    programDetailTimeline = gsap.timeline({
        onComplete: () => {
            programDetailTimeline = null;
            document.body.classList.remove('changing_page');
        },
    });

    programDetailTimeline
        .to(panel, {
            duration: 0.28,
            autoAlpha: 0,
            y: -10,
            ease: 'power2.inOut',
        })
        .call(() => {
            detail.innerHTML = createProgramDetail(referat);
            detail.hidden = false;
            list.hidden = true;
            download.hidden = true;
            document.body.classList.add('program-detail-open');
            gsap.set([list, download], { autoAlpha: 1, y: 0 });
            gsap.set(detail, { autoAlpha: 1, y: 0 });
            gsap.set(panel, { y: 16 });
        })
        .to(panel, {
            duration: 0.42,
            autoAlpha: 1,
            y: 0,
            ease: 'power3.out',
        });
}

function closeProgramDetail({ panel, list, detail, download }) {
    programDetailTimeline?.kill();
    programDetailTimeline = null;
    document.body.classList.remove('changing_page');
    gsap.killTweensOf([panel, list, detail, download]);
    document.body.classList.add('changing_page');

    programDetailTimeline = gsap.timeline({
        onComplete: () => {
            programDetailTimeline = null;
            document.body.classList.remove('changing_page');
        },
    });

    programDetailTimeline
        .to(panel, {
            duration: 0.28,
            autoAlpha: 0,
            y: -10,
            ease: 'power2.inOut',
        })
        .call(() => {
            document.body.classList.remove('program-detail-open');
            detail.innerHTML = '';
            detail.hidden = true;
            list.hidden = false;
            download.hidden = false;
            gsap.set([list, download], { autoAlpha: 1, y: 0 });
            gsap.set(detail, { autoAlpha: 0, y: 18 });
            gsap.set(panel, { y: 16 });
        })
        .to(panel, {
            duration: 0.42,
            autoAlpha: 1,
            y: 0,
            ease: 'power3.out',
        });
}

function createProgramDetail(referat) {
    return `
        <button type="button" class="program-detail__back" data-program-back aria-label="Zurück zum Programm">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                <path d="M6 12H18M6 12L11 7M6 12L11 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
        </button>
        <p class="program-detail__time">${escapeHtml(referat.time)}</p>
        <h2>${escapeHtml(referat.title)}</h2>
        <ol class="program-detail__list">
            ${referat.items.map(([title, type]) => `
                <li>
                    <span>${escapeHtml(title)}</span>
                    ${type ? `<small>${escapeHtml(type)}</small>` : ''}
                </li>
            `).join('')}
        </ol>
    `;
}

function getReferatIndex(title) {
    if (/start der referate/i.test(title)) {
        return 0;
    }

    if (/referate und podium/i.test(title)) {
        return 1;
    }

    return -1;
}

function bindProgramHoverCursor(list) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        return;
    }

    const cursor = getProgramHoverCursor();

    list.querySelectorAll('.program-item--referat').forEach((item) => {
        item.addEventListener('mouseenter', (event) => {
            showProgramHoverCursor(cursor, event);
        });

        item.addEventListener('mousemove', (event) => {
            moveProgramHoverCursor(cursor, event);
        });

        item.addEventListener('mouseleave', () => {
            hideProgramHoverCursor(cursor);
        });
    });
}

function getProgramHoverCursor() {
    let cursor = document.querySelector('#program-hover-cursor');

    if (cursor) {
        return cursor;
    }

    cursor = document.createElement('div');
    cursor.id = 'program-hover-cursor';
    cursor.className = 'program-hover-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" focusable="false">
            <path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
    `;
    document.body.appendChild(cursor);

    return cursor;
}

function hideProgramHoverCursor() {
    const cursor = document.querySelector('#program-hover-cursor');

    if (!cursor) {
        return;
    }

    stopProgramHoverCursorFollow(document.documentElement.classList.contains('is-mac-desktop'));
    cursor.style.transition = '';
    cursor.style.opacity = '';
    window.clearTimeout(programHoverCursorDelay);
    programHoverCursorDelay = null;
    cursor.classList.remove('is-visible');
}

function showProgramHoverCursor(cursor, event) {
    window.clearTimeout(programHoverCursorDelay);
    programHoverCursorDelay = null;
    cursor.style.transition = '';
    cursor.style.opacity = '';
    cursor.classList.remove('is-visible');
    moveProgramHoverCursor(cursor, event, true);
    cursor.getBoundingClientRect();

    programHoverCursorDelay = window.setTimeout(() => {
        programHoverCursorDelay = null;
        cursor.classList.add('is-visible');
        moveProgramHoverCursor(cursor, event);
    }, 10);
}

function moveProgramHoverCursor(cursor, event, immediate = false) {
    const nextPosition = {
        x: event.clientX - 8,
        y: event.clientY - 54,
    };

    if (!document.documentElement.classList.contains('is-mac-desktop')) {
        cursor.style.transform = `translate3d(${nextPosition.x}px, ${nextPosition.y}px, 0)`;
        return;
    }

    programHoverCursorTarget = nextPosition;

    if (!programHoverCursorCurrent) {
        programHoverCursorCurrent = { ...nextPosition };
        setProgramHoverCursorTransform(cursor, programHoverCursorCurrent);
    } else if (!document.documentElement.classList.contains('is-mac-desktop') && immediate) {
        programHoverCursorCurrent = { ...nextPosition };
        setProgramHoverCursorTransform(cursor, programHoverCursorCurrent);
    }

    startProgramHoverCursorFollow(cursor);
}

function startProgramHoverCursorFollow(cursor) {
    if (programHoverCursorFrame) {
        return;
    }

    const follow = () => {
        if (!programHoverCursorCurrent || !programHoverCursorTarget) {
            programHoverCursorFrame = null;
            return;
        }

        programHoverCursorCurrent.x += (programHoverCursorTarget.x - programHoverCursorCurrent.x) * 0.22;
        programHoverCursorCurrent.y += (programHoverCursorTarget.y - programHoverCursorCurrent.y) * 0.22;
        setProgramHoverCursorTransform(cursor, programHoverCursorCurrent);

        programHoverCursorFrame = requestAnimationFrame(follow);
    };

    programHoverCursorFrame = requestAnimationFrame(follow);
}

function stopProgramHoverCursorFollow(keepCurrentPosition = false) {
    if (programHoverCursorFrame) {
        cancelAnimationFrame(programHoverCursorFrame);
    }

    programHoverCursorFrame = null;
    if (!keepCurrentPosition) {
        programHoverCursorCurrent = null;
    }
    programHoverCursorTarget = null;
}

function setProgramHoverCursorTransform(cursor, position) {
    cursor.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
}
