import { gsap } from 'gsap';
import { isHumanClick, qsa } from '../core/helpers.js';
import { state } from '../core/state.js';
import { resetProgramDetail } from '../ui/programRenderer.js';
import { resetSpeakerProfile } from '../ui/speakerRenderer.js';

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
    const leftNavClass = getNavigationClass(trigger, 'l');
    const rightNavClass = getNavigationClass(trigger, 'r');
    const navClass = getNavigationClass(trigger, side);

    if (!navClass) {
        return;
    }

    if (event.ampSectionNavigationStarted) {
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

    event.preventDefault();
    event.ampSectionNavigationStarted = true;

    closeOverlayNavigation();
    updateLogoColor(trigger, 'r');
    resetSpeakerProfileBeforePageChange(rightNavClass, 'r');
    resetProgramDetailBeforePageChange(rightNavClass, 'r');

    const transitionSections = isHumanClick(event) ? animateSectionChange : showSectionInstantly;

    if (leftNavClass) {
        transitionSections(trigger, leftNavClass, 'l');
    }

    if (rightNavClass) {
        transitionSections(trigger, rightNavClass, 'r');
        updateNavigationState(trigger, rightNavClass);
    }

    updateHash(trigger);
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
        navigateToInitialAnchor('home');
        return;
    }

    if (navigateToInitialAnchor(hash)) {
        return;
    }

    if (/^news-.+$/.test(hash)) {
        const newsAnchor = document.querySelector(`${mode} a[href="#${cssEscape(hash.replace(/-.*/, ''))}"]`);
        const newsTrigger = document.querySelector(`#${cssEscape(hash)} .news-openable`);

        newsAnchor?.click();
        newsTrigger?.click();
        return;
    }

    navigateToInitialAnchor('home');
}

function bindNavigationEvents(signal) {
    qsa('*[class*="nav-l"], *[class*="nav-r"]').forEach((element) => {
        element.addEventListener('click', (event) => {
            const side = getNavigationClass(element, 'r') ? 'r' : 'l';

            changeSection(event, side);
        }, { signal });
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
    if (isMobileLayout()) {
        animateLeftSectionSequentially(navClass);
        return;
    }

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

function animateLeftSectionSequentially(navClass) {
    const halfDuration = SECTION_TRANSITION_DURATION / 2;
    const timeline = gsap.timeline({
        defaults: { duration: halfDuration },
        onComplete: () => {
            removeCompletedSectionTimeline(timeline);
            unlockSectionNavigation();
        },
    });
    sectionTransitionTimelines.push({ side: 'l', timeline });

    getInactiveSections(navClass, 'l').forEach((element) => {
        timeline
            .set(element, { willChange: 'opacity' }, 0)
            .to(element, { autoAlpha: 0, force3D: true, ease: 'power2.inOut' }, 0)
            .call(() => element.classList.remove('show'), [], halfDuration)
            .set(element, { willChange: 'auto' }, halfDuration);
    });

    getActiveSections(navClass).forEach((element) => {
        timeline
            .set(element, { willChange: 'opacity', autoAlpha: 0 }, halfDuration)
            .call(() => element.classList.add('show'), [], halfDuration)
            .to(element, { autoAlpha: 1, force3D: true, ease: 'power2.inOut' }, halfDuration)
            .set(element, { willChange: 'auto' }, SECTION_TRANSITION_DURATION);
    });
}

function animateRightSection(trigger, navClass, side) {
    if (isMobileLayout()) {
        animateRightSectionSequentially(trigger, navClass, side);
        return;
    }

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

function animateRightSectionSequentially(trigger, navClass, side) {
    const halfDuration = SECTION_TRANSITION_DURATION / 2;
    const timeline = gsap.timeline({
        defaults: { duration: halfDuration },
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
            .call(() => element.classList.remove('show'), [], halfDuration)
            .set(element, { willChange: 'auto' }, halfDuration);
    });

    getActiveSections(navClass).forEach((element) => {
        timeline
            .call(() => changePageOnBody(trigger, side), [], halfDuration)
            .set(element, { willChange: 'opacity', autoAlpha: 0 }, halfDuration)
            .call(() => element.classList.add('show'), [], halfDuration)
            .to(element, { autoAlpha: 1, force3D: true, ease: 'power2.inOut' }, halfDuration)
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

function resetSpeakerProfileBeforePageChange(navClass, side) {
    if (side !== 'r' || !navClass) {
        return;
    }

    const nextPage = navClass.replace('nav-r-', '');

    if (nextPage !== 'speaker') {
        resetSpeakerProfileAfterSectionTransition();
    }
}

function resetProgramDetailBeforePageChange(navClass, side) {
    if (side !== 'r' || !navClass) {
        return;
    }

    const nextPage = navClass.replace('nav-r-', '');

    if (nextPage === 'programm') {
        resetProgramDetail();
        return;
    }

    resetProgramDetailAfterSectionTransition();
}

function resetSpeakerProfileAfterSectionTransition() {
    resetSpeakerProfile({ delay: SECTION_TRANSITION_DURATION });
}

function resetProgramDetailAfterSectionTransition() {
    resetProgramDetail({ delay: SECTION_TRANSITION_DURATION });
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

function isMobileLayout() {
    return window.matchMedia('(max-width: 1024px)').matches;
}

function navigateToInitialAnchor(hash) {
    const mode = getNavigationModeSelector();
    const anchor = document.querySelector(`${mode} a[href="#${cssEscape(hash)}"]`)
        || document.querySelector(`header a[href="#${cssEscape(hash)}"]`)
        || document.querySelector(`a[href="#${cssEscape(hash)}"]`);

    if (!anchor) {
        return false;
    }

    const event = {
        currentTarget: anchor,
        preventDefault() {},
        stopImmediatePropagation() {},
        ampSectionNavigationStarted: false,
    };

    changeSection(event, getNavigationClass(anchor, 'r') ? 'r' : 'l');
    return true;
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

function updateHash(trigger) {
    const hash = trigger.getAttribute('href');

    if (!hash || !hash.startsWith('#') || window.location.hash === hash) {
        return;
    }

    window.history.pushState(null, '', hash);
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
