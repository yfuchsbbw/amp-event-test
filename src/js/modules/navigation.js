import { gsap } from 'gsap';
import { isHumanClick, qsa } from '../core/helpers.js';
import { state } from '../core/state.js';

let navigationController = null;
const SECTION_TRANSITION_DURATION = 0.6;
let sectionTransitionTimelines = [];

export function initNavigation() {
    if (navigationController) {
        navigationController.abort();
    }

    navigationController = new AbortController();
    bindNavigationEvents(navigationController.signal);
    bindMobileNavigation(navigationController.signal);
    handleAnchor();
}

export function changeSection(event, side) {
    const trigger = event.currentTarget;
    const navClass = getNavigationClass(trigger, side);

    if (!navClass) {
        return;
    }

    if (side === 'l' && trigger.classList.contains('nav-r-location') && navClass === 'nav-l-location') {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.ampSectionNavigationStarted = true;
        closeOverlayNavigation();
        animateSectionChange(trigger, navClass, side);
        animateSectionChange(trigger, 'nav-r-location', 'r');
        updateNavigationState(trigger, 'nav-r-location');
        return;
    }

    if (isBlockedSectionNavigation(event)) {
        blockNavigationEvent(event);
        return;
    }

    if (isBlockedHomeNavigation(navClass)) {
        blockNavigationEvent(event);
        return;
    }

    event.ampSectionNavigationStarted = true;

    closeOverlayNavigation();
    updateLogoColor(trigger, side);
    updatePageClassBeforeSectionChange(trigger);

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

function bindMobileNavigation(signal) {
    const trigger = document.querySelector('#mobile-nav-trigger');
    const navigation = document.querySelector('#main-nav');

    if (!trigger || !navigation) {
        return;
    }

    trigger.addEventListener('click', () => {
        const isOpen = trigger.classList.toggle('open');

        navigation.classList.toggle('active', isOpen);
        document.body.classList.toggle('mobile-nav-open', isOpen);
        trigger.setAttribute('aria-expanded', String(isOpen));
        trigger.setAttribute('aria-label', isOpen ? 'Navigation schliessen' : 'Navigation oeffnen');
    }, { signal });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && trigger.classList.contains('open')) {
            closeOverlayNavigation();
            trigger.focus();
        }
    }, { signal });
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
    cancelSectionTransitions(side);
    lockSectionNavigation();

    if (side === 'l') {
        animateLeftSection(navClass);
        return;
    }

    animateRightSection(trigger, navClass, side);
}

function animateLeftSection(navClass) {
    const timeline = gsap.timeline({
        defaults: { duration: SECTION_TRANSITION_DURATION },
        onComplete: () => {
            removeCompletedSectionTimeline(timeline);
            unlockSectionNavigation();
        },
    });
    sectionTransitionTimelines.push({ side: 'l', timeline });

    getInactiveSections(navClass, 'l').forEach((element) => {
        timeline
            .set(element, { willChange: 'opacity', position: 'absolute' }, 0)
            .to(element, { autoAlpha: 0, force3D: true, ease: 'power2.inOut' }, 0)
            .call(() => element.classList.remove('show'), [], SECTION_TRANSITION_DURATION)
            .set(element, { position: 'static', willChange: 'auto' }, SECTION_TRANSITION_DURATION);
    });

    getActiveSections(navClass).forEach((element) => {
        timeline
            .set(element, { willChange: 'opacity' }, 0)
            .call(() => element.classList.add('show'), [], 0)
            .to(element, { autoAlpha: 1, force3D: true, ease: 'power2.inOut' }, 0)
            .set(element, { willChange: 'auto' }, SECTION_TRANSITION_DURATION);
    });
}

function animateRightSection(trigger, navClass, side) {
    const timeline = gsap.timeline({
        defaults: { duration: SECTION_TRANSITION_DURATION },
        onComplete: () => {
            removeCompletedSectionTimeline(timeline);
            unlockSectionNavigation();
        },
    });
    sectionTransitionTimelines.push({ side, timeline });

    getInactiveSections(navClass, 'r').forEach((element) => {
        timeline
            .set(element, { willChange: 'opacity' }, 0)
            .to(element, { autoAlpha: 0, force3D: true, ease: 'power2.inOut' }, 0)
            .call(() => element.classList.remove('show'), [], SECTION_TRANSITION_DURATION)
            .set(element, { willChange: 'auto' }, SECTION_TRANSITION_DURATION);
    });

    getActiveSections(navClass).forEach((element) => {
        timeline
            .set(element, { willChange: 'opacity' }, 0)
            .call(() => element.classList.add('show'), [], 0)
            .call(() => changePageOnBody(trigger, side), [], 0)
            .to(element, { autoAlpha: 1, force3D: true, ease: 'power2.inOut' }, 0)
            .set(element, { willChange: 'auto' }, SECTION_TRANSITION_DURATION);
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
    document.querySelector('#main-nav')?.classList.remove('active');
    document.querySelector('#main-content-container')?.classList.remove('hide');
    document.body.classList.remove('mobile-nav-open');

    const mobileTrigger = document.querySelector('#mobile-nav-trigger');

    mobileTrigger?.classList.remove('open');
    mobileTrigger?.setAttribute('aria-expanded', 'false');
    mobileTrigger?.setAttribute('aria-label', 'Navigation oeffnen');
}

function updateLogoColor(trigger, side) {
    if (side !== 'r') {
        return;
    }

    document.body.classList.toggle('logo-white', trigger.classList.contains('mk-white-logo'));
}

function updatePageClassBeforeSectionChange(trigger) {
    const rightNavClass = getNavigationClass(trigger, 'r');

    if (!rightNavClass) {
        return;
    }

    const pageName = rightNavClass.replace('nav-r-', '');

    if (pageName === 'programm') {
        changePageOnBody(trigger, 'r');
    }
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
    return qsa(`[id*="${cssEscape(navClass)}"]`);
}

function getInactiveSections(navClass, side) {
    return qsa(`[id*="nav-${side}-"]:not([id*="${cssEscape(navClass)}"])`);
}

function getNavigationModeSelector() {
    const mobileSize = window.matchMedia('(max-width: 1024px)');
    const mobileNavigation = document.querySelector('#mobile-nav nav');

    return mobileSize.matches && mobileNavigation ? '#mobile-nav nav' : 'header';
}

function clickDefaultNavigation() {
    const defaultAnchor = document.querySelector('header a[href="#home"]')
        || document.querySelector('a.nav-r-home')
        || document.querySelector('a[href="#home"]');

    defaultAnchor?.click();
}

function isBlockedSectionNavigation(event) {
    return false;
}

function isBlockedHomeNavigation(navClass) {
    if (state.logoAnimationLoaded || !navClass.endsWith('-home')) {
        return false;
    }

    return state.currentPage !== null && state.currentPage !== 'home';
}

function blockNavigationEvent(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
}

function cancelSectionTransitions(side) {
    const remainingTimelines = [];

    sectionTransitionTimelines.forEach((entry) => {
        if (entry.side !== side) {
            remainingTimelines.push(entry);
            return;
        }

        entry.timeline.kill();
        unlockSectionNavigation();
    });

    sectionTransitionTimelines = remainingTimelines;
}

function lockSectionNavigation() {
    state.activeSectionAnimations += 1;
    document.body.classList.add('changing_page');
}

function unlockSectionNavigation() {
    state.activeSectionAnimations = Math.max(0, state.activeSectionAnimations - 1);

    if (state.activeSectionAnimations === 0) {
        document.body.classList.remove('changing_page');
    }
}

function removeCompletedSectionTimeline(timeline) {
    sectionTransitionTimelines = sectionTransitionTimelines.filter((entry) => entry.timeline !== timeline);
}

function cssEscape(value) {
    return window.CSS?.escape ? CSS.escape(value) : String(value).replace(/"/g, '\\"');
}
