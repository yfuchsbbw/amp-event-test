import { gsap } from 'gsap';
import { isHumanClick, qsa } from '../core/helpers.js';
import { state } from '../core/state.js';

let navigationController = null;

export function initNavigation() {
    if (navigationController) {
        navigationController.abort();
    }

    navigationController = new AbortController();
    bindNavigationEvents(navigationController.signal);
    handleAnchor();
}

export function changeSection(event, side) {
    const trigger = event.currentTarget;
    const navClass = getNavigationClass(trigger, side);

    if (!navClass) {
        return;
    }

    closeOverlayNavigation();
    updateLogoColor(trigger, side);

    if (isHumanClick(event)) {
        animateSectionChange(trigger, navClass, side);
    } else {
        showSectionInstantly(trigger, navClass, side);
    }

    if (side === 'r') {
        updateNavigationState(trigger, navClass);
    }
}

export function changePageOnBody(element, side) {
    if (side !== 'r') {
        return;
    }

    removeBodyPageClasses();

    const pageClass = getNavigationClass(element, side);

    if (!pageClass) {
        return;
    }

    const pageName = pageClass.replace(`nav-${side}-`, '');

    document.body.classList.add(`page-${pageName}`);
    state.currentPage = pageName;
}

export function handleAnchor() {
    const hash = window.location.hash.replace('#', '');

    if (!hash) {
        clickDefaultNavigation();
        return;
    }

    const mode = getNavigationModeSelector();
    const anchor = document.querySelector(`${mode} a[href="#${cssEscape(hash)}"]`);

    if (anchor) {
        anchor.click();
        return;
    }

    if (/^news-.+$/.test(hash)) {
        const newsAnchor = document.querySelector(`${mode} a[href="#${cssEscape(hash.replace(/-.*/, ''))}"]`);
        const newsTrigger = document.querySelector(`#${cssEscape(hash)} .news-openable`);

        newsAnchor?.click();
        newsTrigger?.click();
        return;
    }

    clickDefaultNavigation();
}

function bindNavigationEvents(signal) {
    qsa('*[class*="nav-l"]').forEach((element) => {
        element.addEventListener('click', (event) => changeSection(event, 'l'), { signal });
    });

    qsa('*[class*="nav-r"]').forEach((element) => {
        element.addEventListener('click', (event) => changeSection(event, 'r'), { signal });
    });

    qsa('*[class*="nav-desc"]').forEach((element) => {
        element.addEventListener('click', () => changeDesc(element), { signal });
    });
}

function changeDesc(trigger) {
    const navClass = Array.from(trigger.classList).find((className) => className.startsWith('nav-desc'));

    if (!navClass) {
        return;
    }

    const isOpen = qsa(`div[class*="${cssEscape(navClass)}"]`).some((element) => element.classList.contains('show'));
    const isTimetablePage = document.body.classList.contains('page-timetable');
    const timeline = gsap.timeline({ defaults: { ease: 'none' } });

    if (trigger.classList.contains('toggleable') && isOpen) {
        withTimetableLock(isTimetablePage, () => closeDescription(timeline));
        return;
    }

    if (!isOpen) {
        withTimetableLock(isTimetablePage, () => {
            closeDescription(timeline);
            openDescription(timeline, trigger, navClass);
        });
    }
}

function openDescription(timeline, trigger, navClass) {
    trigger.classList.add('show');

    qsa(`div.${cssEscape(navClass)}:not(.desktop):not(.mobile)`).forEach((element) => {
        const padding = parseInt(window.getComputedStyle(trigger).padding, 10) || 0;
        const height = getHiddenDescriptionHeight(trigger, element);

        timeline
            .add(() => element.classList.add('show'), 0)
            .fromTo(element, { paddingTop: 0, paddingBottom: 0 }, { paddingTop: padding, paddingBottom: padding, duration: 0.5 }, 0)
            .fromTo(element, { opacity: 0, height: 0 }, { opacity: 1, height, duration: 0.5 }, 0);
    });
}

function closeDescription(timeline) {
    qsa('div[class*="nav-desc"].desktop, div[class*="nav-desc"].mobile').forEach((element) => {
        element.classList.remove('show');
    });

    qsa('div[class*="nav-desc"].show:not(.desktop, .mobile)').forEach((element) => {
        timeline
            .to(element, { opacity: 0, height: 0, duration: 0.5 }, 0)
            .to(element, { paddingTop: 0, paddingBottom: 0, duration: 0.5 }, 0)
            .add(() => element.classList.remove('show'), 0.5);
    });
}

function withTimetableLock(enabled, callback) {
    if (enabled) {
        document.body.classList.add('changing_page');
    }

    callback();

    if (enabled) {
        gsap.delayedCall(0.5, () => document.body.classList.remove('changing_page'));
    }
}

function getHiddenDescriptionHeight(trigger, element) {
    const previous = {
        display: element.style.display,
        height: element.style.height,
        opacity: element.style.opacity,
        paddingTop: element.style.paddingTop,
        paddingBottom: element.style.paddingBottom,
        position: element.style.position,
        visibility: element.style.visibility,
    };

    const padding = parseInt(window.getComputedStyle(trigger).padding, 10) || 0;

    element.style.display = 'block';
    element.style.height = 'auto';
    element.style.opacity = '0';
    element.style.paddingTop = `${padding}px`;
    element.style.paddingBottom = `${padding}px`;
    element.style.position = 'absolute';
    element.style.visibility = 'hidden';

    const height = element.scrollHeight;

    Object.assign(element.style, previous);

    return height;
}

function animateSectionChange(trigger, navClass, side) {
    document.body.classList.add('changing_page');

    if (side === 'l') {
        animateLeftSection(navClass);
        return;
    }

    animateRightSection(trigger, navClass, side);
}

function animateLeftSection(navClass) {
    const timeline = gsap.timeline({ defaults: { duration: 1 } });

    getInactiveSections(navClass, 'l').forEach((element) => {
        timeline
            .to(element, { opacity: 0 }, 0)
            .to(element, { position: 'absolute' }, 0)
            .call(() => element.classList.remove('show'), [], 1)
            .to(element, { position: 'static' }, 1);
    });

    getActiveSections(navClass).forEach((element) => {
        timeline
            .to(element, { opacity: 1 }, 0)
            .call(() => element.classList.add('show'), [], 0)
            .call(() => document.body.classList.remove('changing_page'), [], 1);
    });
}

function animateRightSection(trigger, navClass, side) {
    const timeline = gsap.timeline({ defaults: { duration: 0.5 } });

    getInactiveSections(navClass, 'r').forEach((element) => {
        timeline
            .to(element, { opacity: 0 }, 0)
            .call(() => element.classList.remove('show'));
    });

    getActiveSections(navClass).forEach((element) => {
        timeline
            .call(() => element.classList.add('show'))
            .call(() => changePageOnBody(trigger, side))
            .to(element, { opacity: 1 })
            .call(() => document.body.classList.remove('changing_page'));
    });
}

function showSectionInstantly(trigger, navClass, side) {
    getInactiveSections(navClass, side).forEach((element) => {
        element.classList.remove('show');
    });

    getActiveSections(navClass).forEach((element) => {
        element.classList.add('show');
        element.style.opacity = 1;
        changePageOnBody(trigger, side);
    });
}

function updateNavigationState(trigger, navClass) {
    qsa('div[class*="nav-desc"]').forEach((element) => {
        element.classList.remove('show');
    });

    qsa('.navigation a[class*="nav-"]').forEach((element) => {
        element.classList.toggle('active', element.classList.contains(navClass));
    });

    state.currentSection = navClass.replace('nav-r-', '');
    state.currentPage = state.currentSection;
}

function closeOverlayNavigation() {
    document.querySelector('.imprint')?.classList.remove('active');
    document.querySelector('#mobile-nav')?.classList.remove('active');
    document.querySelector('#main-content-container')?.classList.remove('hide');
    document.querySelector('#mobile-nav-trigger')?.classList.remove('open');
}

function updateLogoColor(trigger, side) {
    if (side !== 'r') {
        return;
    }

    document.body.classList.toggle('logo-white', trigger.classList.contains('mk-white-logo'));
}

function removeBodyPageClasses() {
    Array.from(document.body.classList)
        .filter((className) => className.startsWith('page-'))
        .forEach((className) => document.body.classList.remove(className));
}

function getNavigationClass(element, side) {
    return Array.from(element.classList).find((className) => className.startsWith(`nav-${side}-`)) || null;
}

function getActiveSections(navClass) {
    return qsa(`div[id*="${cssEscape(navClass)}"]`);
}

function getInactiveSections(navClass, side) {
    return qsa(`div[id*="nav-${side}-"]:not([id*="${cssEscape(navClass)}"])`);
}

function getNavigationModeSelector() {
    const mobileSize = window.matchMedia('(max-width: 1024px)');

    return mobileSize.matches ? '#mobile-nav nav' : 'header';
}

function clickDefaultNavigation() {
    const defaultAnchor = document.querySelector('header a[href="#home"]')
        || document.querySelector('a.nav-r-home')
        || document.querySelector('a[href="#home"]');

    defaultAnchor?.click();
}

function cssEscape(value) {
    return window.CSS?.escape ? CSS.escape(value) : String(value).replace(/"/g, '\\"');
}
