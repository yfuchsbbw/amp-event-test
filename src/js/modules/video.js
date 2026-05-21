export function initVideo() {
    const desktopVideo = document.querySelector('#background-video');
    const mobileVideo = document.querySelector('#background-video-mobile');

    if (!desktopVideo && !mobileVideo) {
        return;
    }

    const startVideos = () => {
        videoStart(desktopVideo, 1);
        videoStart(mobileVideo, 1.8);
    };

    desktopVideo?.addEventListener('loadeddata', startVideos, { once: true });
    mobileVideo?.addEventListener('loadeddata', startVideos, { once: true });
    startVideos();
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
