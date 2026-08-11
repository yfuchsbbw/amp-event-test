export function initVideo() {
    const desktopVideo = document.querySelector('#background-video');
    const mobileVideo = document.querySelector('#background-video-mobile');
    const allVideos = [desktopVideo, mobileVideo].filter(Boolean);

    if (!allVideos.length) {
        return;
    }

    const mobileQuery = window.matchMedia('(max-width: 768px)');
    let activeVideo = null;
    setSafariClass();

    const activateVideo = () => {
        const isMobile = mobileQuery.matches;
        const nextVideo = isMobile ? mobileVideo : desktopVideo;

        if (!nextVideo || nextVideo === activeVideo) {
            return;
        }

        allVideos
            .filter((video) => video !== nextVideo)
            .forEach(pauseVideo);

        activeVideo = nextVideo;
        loadVideoSource(activeVideo);
        videoStart(activeVideo, isMobile ? null : 1);
    };

    mobileQuery.addEventListener('change', activateVideo);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            pauseVideo(activeVideo);
            return;
        }

        videoStart(activeVideo, null);
    });

    requestAnimationFrame(() => {
        requestAnimationFrame(activateVideo);
    });
}

export function videoStart(video, startTime = 0) {
    if (!video) {
        return;
    }

    try {
        if (Number.isFinite(startTime) && Number.isFinite(video.duration) && video.duration > startTime) {
            video.currentTime = startTime;
        }

        const playPromise = video.play();

        if (playPromise) {
            playPromise.catch(() => {
                // Muted autoplay can still be blocked in edge browser states.
            });
        }
    } catch (error) {
        console.warn('videoStart failed:', error);
    }
}

function loadVideoSource(video) {
    const source = video?.querySelector('source[data-src]');

    if (!source || source.src) {
        return;
    }

    source.src = source.dataset.src;
    video.preload = 'auto';
    video.load();
}

function pauseVideo(video) {
    if (video && !video.paused) {
        video.pause();
    }
}

function setSafariClass() {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari) {
        document.documentElement.classList.add('is-safari');
    }
}
