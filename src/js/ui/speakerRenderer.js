import { gsap } from 'gsap';
import { escapeAttribute, escapeHtml, slugify } from '../core/helpers.js';

let imageSwapTimeline = null;
let floatingImageQuickX = null;
let floatingImageQuickY = null;
let floatingImageRequestId = 0;
let resetSpeakerProfileState = null;
let resetSpeakerProfileDelayCall = null;

export function resetSpeakerProfile({ delay = 0 } = {}) {
    resetSpeakerProfileDelayCall?.kill();
    resetSpeakerProfileDelayCall = null;

    if (delay > 0 && document.body.classList.contains('speaker-profile-open')) {
        resetSpeakerProfileDelayCall = gsap.delayedCall(delay, () => {
            resetSpeakerProfileDelayCall = null;
            resetSpeakerProfileState?.();
        });
        return;
    }

    resetSpeakerProfileState?.();
}

export function renderSpeakers(speakers, archiveSpeakers = []) {
    if (!Array.isArray(speakers) || speakers.length === 0) {
        return;
    }

    const { list, detail } = getSpeakerContainers();

    if (!list) {
        console.warn('renderSpeakers skipped: speaker containers not found');
        return;
    }

    const floatingImage = getFloatingImage();
    const speakerIntro = document.querySelector('#nav-l-speaker');
    const speakerPanel = document.querySelector('#nav-r-speaker');
    const initialSpeakerIntro = speakerIntro?.innerHTML || '';
    let activeSpeakers = speakers;
    let activeYear = '2026';

    resetSpeakerProfileState = () => {
        if (!document.body.classList.contains('speaker-profile-open')) {
            return;
        }

        gsap.killTweensOf([detail, list, speakerIntro]);
        document.body.classList.remove('speaker-profile-open');
        speakerPanel?.classList.remove('is-profile');

        activeYear = '2026';
        activeSpeakers = speakers;

        if (speakerIntro) {
            speakerIntro.innerHTML = initialSpeakerIntro;
            gsap.set(speakerIntro, { autoAlpha: 1, y: 0 });
        }

        if (list) {
            list.hidden = false;
            renderSpeakerList(list, activeSpeakers);
            bindSpeakerCards(list, activeSpeakers, floatingImage);
            gsap.set(list, { autoAlpha: 1, y: 0, opacity: 1 });
        }

        renderSpeakerDetail(detail, activeYear);
        gsap.set(detail, { autoAlpha: 1, y: 0 });
        hideFloatingImage(floatingImage);
    };

    renderSpeakerDetail(detail, activeYear);
    renderSpeakerList(list, activeSpeakers);
    bindSpeakerCards(list, activeSpeakers, floatingImage);

    detail?.addEventListener('click', (event) => {
        const backButton = event.target.closest('[data-speaker-back]');

        if (backButton) {
            event.preventDefault();
            closeSpeakerProfile({ detail, list, speakerIntro, speakerPanel, initialSpeakerIntro, activeYear });
            bindSpeakerCards(list, activeSpeakers, floatingImage);
            return;
        }

        const yearButton = event.target.closest('[data-speaker-year]');

        if (!yearButton) {
            return;
        }

        event.preventDefault();

        activeYear = yearButton.dataset.speakerYear;
        activeSpeakers = activeYear === '2024' ? archiveSpeakers : speakers;

        renderSpeakerDetail(detail, activeYear);
        transitionSpeakerList(list, activeSpeakers, floatingImage);
        hideFloatingImage(floatingImage);
    });

    list.addEventListener('click', (event) => {
        const card = event.target.closest('.speaker-card');

        if (!card) {
            return;
        }

        const speaker = activeSpeakers.find((item) => String(item.id) === card.dataset.id);

        if (!speaker) {
            return;
        }

        openSpeakerProfile({ speaker, detail, list, speakerIntro, speakerPanel, floatingImage });
    });
}

function renderSpeakerList(list, speakers) {
    list.innerHTML = speakers.map(createSpeakerCard).join('');
}

function bindSpeakerCards(list, speakers, floatingImage) {
    const cards = Array.from(list.querySelectorAll('.speaker-card'));

    cards.forEach((card) => {
        const showSpeaker = (event) => {
            const speaker = speakers.find((item) => String(item.id) === card.dataset.id);

            if (!speaker) {
                return;
            }

            setActiveCard(cards, card);
            showFloatingImage(floatingImage, speaker, event, event.type === 'mouseenter');
        };

        card.addEventListener('mousemove', (event) => moveFloatingImage(floatingImage, event));
        card.addEventListener('mouseenter', showSpeaker);
        card.addEventListener('focus', showSpeaker);
        card.addEventListener('click', showSpeaker);
        card.addEventListener('mouseleave', () => {
            hideFloatingImage(floatingImage);
            setActiveCard(cards, null);
        });
        card.addEventListener('blur', () => {
            hideFloatingImage(floatingImage);
            setActiveCard(cards, null);
        });
    });
}

function openSpeakerProfile({ speaker, detail, list, speakerIntro, speakerPanel, floatingImage }) {
    if (!detail || !list || !speakerIntro || !speakerPanel) {
        return;
    }

    resetSpeakerProfileDelayCall?.kill();
    resetSpeakerProfileDelayCall = null;
    hideFloatingImage(floatingImage);
    gsap.killTweensOf([detail, list, speakerIntro]);
    gsap.to([detail, list, speakerIntro], {
        duration: 0.28,
        autoAlpha: 0,
        y: -18,
        ease: 'power2.inOut',
        onComplete: () => {
            document.body.classList.add('speaker-profile-open');
            speakerPanel.classList.add('is-profile');
            list.hidden = true;

            speakerIntro.innerHTML = `
                <img class="speaker-profile-image" src="${escapeAttribute(getImagePath(speaker.image))}" alt="${escapeAttribute(speaker.name)}">
            `;

            detail.innerHTML = createSpeakerProfile(speaker);

            const profileImage = speakerIntro.querySelector('.speaker-profile-image');
            const profile = detail.querySelector('.speaker-profile');
            gsap.set([speakerIntro, detail], { autoAlpha: 1, y: 0 });
            gsap.set(profileImage, { autoAlpha: 0, scale: 1.035 });
            gsap.set(profile, { autoAlpha: 0, y: 32 });
            gsap.to(profileImage, {
                duration: 0.55,
                autoAlpha: 1,
                scale: 1,
                ease: 'power3.out',
            });
            gsap.to(profile, {
                duration: 0.5,
                autoAlpha: 1,
                y: 0,
                delay: 0.08,
                ease: 'power3.out',
            });
        },
    });
}

function closeSpeakerProfile({ detail, list, speakerIntro, speakerPanel, initialSpeakerIntro, activeYear }) {
    const profileImage = speakerIntro?.querySelector('.speaker-profile-image');
    const profile = detail?.querySelector('.speaker-profile');

    gsap.killTweensOf([profileImage, profile, detail, list, speakerIntro]);
    gsap.to([profileImage, profile], {
        duration: 0.25,
        autoAlpha: 0,
        y: -18,
        ease: 'power2.inOut',
        onComplete: () => {
            document.body.classList.remove('speaker-profile-open');
            speakerPanel?.classList.remove('is-profile');

            if (speakerIntro) {
                speakerIntro.innerHTML = initialSpeakerIntro;
            }

            if (list) {
                list.hidden = false;
            }

            renderSpeakerDetail(detail, activeYear);
            gsap.set([speakerIntro, detail, list], { autoAlpha: 0, y: 24 });
            gsap.to([speakerIntro, detail, list], {
                duration: 0.45,
                autoAlpha: 1,
                y: 0,
                stagger: 0.04,
                ease: 'power3.out',
            });
        },
    });
}

function createSpeakerProfile(speaker) {
    const paragraphs = Array.isArray(speaker.bio) && speaker.bio.length > 0
        ? speaker.bio
        : [speaker.excerpt].filter(Boolean);
    const bioText = paragraphs.join(' ');
    const links = Array.isArray(speaker.links) && speaker.links.length > 0
        ? speaker.links
        : [];

    return `
        <article class="speaker-profile">
            <button type="button" class="speaker-profile__back" data-speaker-back aria-label="Zurück zur Speakerliste">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                    <path d="M6 12H18M6 12L11 7M6 12L11 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
            </button>
            <p class="speaker-profile__role">${escapeHtml(speaker.role)}</p>
            <h2>${escapeHtml(speaker.name)}</h2>
            <div class="speaker-profile__bio">
                <p>${escapeHtml(bioText)}</p>
            </div>
            ${links.length > 0 ? `
                <div class="speaker-profile__links">
                    ${links.map((link) => `
                        <a href="${escapeAttribute(link.href)}" target="_blank" rel="noopener noreferrer">
                            ${escapeHtml(link.label)}
                            <span class="speaker-profile__link-arrow" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" focusable="false">
                                    <path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                            </span>
                        </a>
                    `).join('')}
                </div>
            ` : ''}
        </article>
    `;
}

function transitionSpeakerList(list, speakers, floatingImage) {
    gsap.killTweensOf(list);
    gsap.to(list, {
        duration: 0.3,
        opacity: 0,
        ease: 'power2.out',
        onComplete: () => {
            renderSpeakerList(list, speakers);
            bindSpeakerCards(list, speakers, floatingImage);
            gsap.to(list, {
                duration: 0.3,
                opacity: 1,
                ease: 'power2.out',
            });
        },
    });
}

function getSpeakerContainers() {
    const existingList = document.querySelector('#speaker-list')
        || document.querySelector('[data-speaker-list]')
        || document.querySelector('.speaker-wrapper');
    const existingDetail = document.querySelector('#speaker-detail')
        || document.querySelector('[data-speaker-detail]');

    if (existingList) {
        return {
            list: existingList,
            detail: existingDetail,
        };
    }

    return {
        list: null,
        detail: null,
    };
}

function createSpeakerCard(speaker) {
    const speakerId = String(speaker.id || slugify(speaker.name));
    const imagePath = getImagePath(speaker.image);

    return `
        <button type="button" class="speaker-card speaker-link add-follow-img hide-overflow" data-id="${escapeAttribute(speakerId)}" data-img="${escapeAttribute(imagePath)}">
            <span class="name">${escapeHtml(speaker.name)}</span>
            <span class="description">${escapeHtml(speaker.role)}</span>
            <span class="speaker-card__arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" focusable="false">
                    <path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
            </span>
        </button>
    `;
}

function renderSpeakerDetail(container, activeYear) {
    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="detail speaker-detail">
            <div class="speaker-detail__years" aria-label="Speaker Archiv">
                <button type="button" data-speaker-year="2026" class="speaker-year-button${activeYear === '2026' ? ' is-active' : ''}">2026</button>
                <span>|</span>
                <button type="button" data-speaker-year="2024" class="speaker-year-button${activeYear === '2024' ? ' is-active' : ''}">2024</button>
            </div>
        </div>
    `;
}

function getFloatingImage() {
    let image = document.querySelector('#speaker-hover-image');

    if (!image) {
        image = document.createElement('img');
        image.id = 'speaker-hover-image';
        image.className = 'speaker-hover-image';
        image.alt = '';
        image.setAttribute('aria-hidden', 'true');
        document.body.appendChild(image);
        gsap.set(image, { autoAlpha: 0, x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }

    return image;
}

function showFloatingImage(image, speaker, event, immediate = false) {
    if (!image || !speaker.image) {
        hideFloatingImage(image);
        return;
    }

    const imagePath = getImagePath(speaker.image);

    if (event?.clientX !== undefined && event?.clientY !== undefined) {
        positionFloatingImage(image, event.clientX, event.clientY, immediate);
    } else {
        const rect = event?.currentTarget?.getBoundingClientRect();

        if (rect) {
            positionFloatingImage(image, rect.right, rect.top, true);
        }
    }

    image.alt = speaker.name || '';
    image.dataset.visible = 'true';
    image.classList.add('is-visible');

    setFloatingImageSource(image, imagePath);
}

function setFloatingImageSource(image, imagePath) {
    const currentImagePath = image.getAttribute('src');
    const imageChanged = currentImagePath !== imagePath;

    imageSwapTimeline?.kill();
    imageSwapTimeline = null;
    gsap.killTweensOf(image);

    if (!imageChanged) {
        gsap.to(image, {
            duration: 0.16,
            autoAlpha: 1,
            scale: 1,
            ease: 'power2.out',
            overwrite: 'auto',
        });
        return;
    }

    const requestId = ++floatingImageRequestId;
    image.dataset.requestedSrc = imagePath;
    image.onload = null;
    image.onerror = null;
    image.removeAttribute('src');
    gsap.set(image, { autoAlpha: 0, scale: 0.985 });

    const revealLatestImage = () => {
        if (requestId !== floatingImageRequestId || image.dataset.requestedSrc !== imagePath) {
            return;
        }

        imageSwapTimeline = gsap.to(image, {
            duration: 0.24,
            autoAlpha: 1,
            scale: 1,
            ease: 'power2.out',
            overwrite: 'auto',
            onComplete: () => {
                imageSwapTimeline = null;
            },
        });
    };

    image.onload = revealLatestImage;
    image.onerror = () => {
        if (requestId === floatingImageRequestId) {
            hideFloatingImage(image);
        }
    };
    image.src = imagePath;

    if (image.complete && image.naturalWidth > 0) {
        revealLatestImage();
    }
}

function moveFloatingImage(image, event) {
    if (!image || image.dataset.visible !== 'true') {
        return;
    }

    positionFloatingImage(image, event.clientX, event.clientY);
}

function positionFloatingImage(image, x, y, immediate = false) {
    const offsetX = 6;
    const offsetY = 1;
    const width = 305;
    const height = 430;
    const maxX = window.innerWidth - width - 12;
    const minY = 12 + height;
    const nextX = Math.max(12, Math.min(x + offsetX, maxX));
    const nextY = Math.max(y - height - offsetY, minY - height);

    if (immediate) {
        gsap.set(image, { x: nextX, y: nextY });
        return;
    }

    if (!floatingImageQuickX || !floatingImageQuickY) {
        const quickToOptions = {
            duration: 0.45,
            ease: 'expo.out',
        };

        floatingImageQuickX = gsap.quickTo(image, 'x', quickToOptions);
        floatingImageQuickY = gsap.quickTo(image, 'y', quickToOptions);
    }

    floatingImageQuickX(nextX);
    floatingImageQuickY(nextY);
}

function resetFloatingImageQuickTo() {
    floatingImageQuickX = null;
    floatingImageQuickY = null;
}

function hideFloatingImage(image) {
    if (!image) {
        return;
    }

    imageSwapTimeline?.kill();
    imageSwapTimeline = null;
    floatingImageRequestId += 1;
    image.onload = null;
    image.onerror = null;
    resetFloatingImageQuickTo();

    image.dataset.visible = 'false';
    image.classList.remove('is-visible');

    gsap.to(image, {
        duration: 0.22,
        autoAlpha: 0,
        ease: 'power2.out',
        overwrite: 'auto',
    });
}

function setActiveCard(cards, activeCard) {
    cards.forEach((card) => {
        const isActive = card === activeCard;

        card.classList.toggle('active', isActive);
        card.classList.toggle('is-active', isActive);
        card.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
}

function getImagePath(image = '') {
    if (!image) {
        return '';
    }

    if (image.startsWith('/') || image.startsWith('http')) {
        return image;
    }

    return `/media/img/${image}`;
}
