export function renderSpeakers(speakers) {
    if (!Array.isArray(speakers) || speakers.length === 0) {
        return;
    }

    const { list, detail } = getSpeakerContainers();

    if (!list) {
        console.warn('renderSpeakers skipped: speaker containers not found');
        return;
    }

    list.innerHTML = speakers.map(createSpeakerCard).join('');

    const cards = Array.from(list.querySelectorAll('.speaker-card'));

    cards.forEach((card) => {
        card.addEventListener('click', () => {
            const speaker = speakers.find((item) => String(item.id) === card.dataset.id);

            if (!speaker) {
                return;
            }

            setActiveCard(cards, card);
            renderSpeakerDetail(detail, speaker);
        });
    });

    setActiveCard(cards, cards[0]);
    renderSpeakerDetail(detail, speakers[0]);
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
        <a href="#speaker" class="speaker-card speaker-link add-follow-img nav-l-talker-${escapeAttribute(speakerId)} nav-r-talker-${escapeAttribute(speakerId)} hide-overflow" data-id="${escapeAttribute(speakerId)}" data-img="${escapeAttribute(imagePath)}">
            <span class="name">${escapeHtml(speaker.name)}</span>
            <div class="speaker-description">
                <span class="description">${escapeHtml(speaker.role)}</span>
            </div>
        </a>
    `;
}

function renderSpeakerDetail(container, speaker) {
    const speakerId = String(speaker.id || slugify(speaker.name));
    const detailContainer = container || document.querySelector(`#nav-r-talker-${CSS.escape(speakerId)}`);

    if (!detailContainer) {
        return;
    }

    detailContainer.innerHTML = `
        <div class="detail speaker-detail">
            ${speaker.image ? `<img class="talker-img" src="${escapeAttribute(getImagePath(speaker.image))}" alt="${escapeAttribute(speaker.name)}">` : ''}
            <h1>${escapeHtml(speaker.name)}</h1>
            <h3>${escapeHtml(speaker.role)}</h3>
            <p>${escapeHtml(speaker.excerpt)}</p>
        </div>
    `;
}

function setActiveCard(cards, activeCard) {
    cards.forEach((card) => {
        const isActive = card === activeCard;

        card.classList.toggle('active', isActive);
        card.classList.toggle('is-active', isActive);
        card.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
}

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function escapeAttribute(value = '') {
    return escapeHtml(value);
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

function slugify(value = '') {
    return String(value)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
