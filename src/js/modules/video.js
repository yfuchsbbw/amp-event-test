export function initVideo() {
    const desktopVideo = document.querySelector('#background-video');
    const mobileVideo = document.querySelector('#background-video-mobile');

    if (!desktopVideo && !mobileVideo) {
        return;
    }

    const mobileQuery = window.matchMedia('(max-width: 768px)');
    let activeVideo = null;

    const activateVideo = () => {
        const nextVideo = mobileQuery.matches ? mobileVideo : desktopVideo;

        if (!nextVideo || nextVideo === activeVideo) {
            return;
        }

        pauseVideo(activeVideo);
        activeVideo = nextVideo;
        loadVideoSource(activeVideo);
        videoStart(activeVideo, mobileQuery.matches ? 1.8 : 1);
    };

    mobileQuery.addEventListener('change', activateVideo);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            pauseVideo(activeVideo);
            return;
        }

        videoStart(activeVideo);
    });

    activateVideo();
}

export function videoStart(video, startTime = 0) {
    if (!video) {
        return;
    }

    try {
        if (Number.isFinite(video.duration) && video.duration > startTime) {
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
    video.preload = window.matchMedia('(max-width: 768px)').matches ? 'metadata' : 'auto';
    video.load();
}

function pauseVideo(video) {
    if (video && !video.paused) {
        video.pause();
    }
}
