<!DOCTYPE html>
<html lang="de">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AMP Event 2026</title>
    <script>document.documentElement.classList.add('fonts-loading');</script>
    <link rel="preload" href="/fonts/HelveticaNeueLTW02-55Roman.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/fonts/HelveticaNeueLTW01-65Medium.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/fonts/HelveticaNeueLTW01-75Bold.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="icon" type="image/x-icon" href="/media/favicon/favicon.ico">
    <!-- Optional: Favicon -->
    <link rel="shortcut icon" href="/media/favicon/favicon.png">

    <?php
    // DEV MODE (Vite Server)
    $isDev = true;
    ?>

    <?php if ($isDev): ?>
        <!-- Vite Dev Server -->
        <script type="module" src="http://localhost:5173/@vite/client"></script>
        <script type="module" src="http://localhost:5173/src/js/app.js"></script>
    <?php else: ?>
        <?php
        // PROD MODE (Build später)
        $manifest = json_decode(file_get_contents(__DIR__ . '/public/build/.vite/manifest.json'), true);
        $entry = $manifest['src/js/app.js'];
        $jsFile = $entry['file'];
        ?>

        <?php foreach (($entry['css'] ?? []) as $cssFile): ?>
            <link rel="stylesheet" href="/build/<?= $cssFile ?>">
        <?php endforeach; ?>
        <script type="module" src="/build/<?= $jsFile ?>"></script>
    <?php endif; ?>

</head>

<body>
    <svg width="0" height="0" aria-hidden="true" focusable="false" class="svg-filters">
        <filter id="video-white-to-light-gray" color-interpolation-filters="sRGB">
            <feColorMatrix
                in="SourceGraphic"
                result="white-mask"
                type="matrix"
                values="0 0 0 0 1
                        0 0 0 0 1
                        0 0 0 0 1
                        0.8504 2.8608 0.2888 0 -3.2" />
            <feComponentTransfer in="white-mask" result="inverse-white-mask">
                <feFuncA type="table" tableValues="1 0" />
            </feComponentTransfer>
            <feComposite in="SourceGraphic" in2="inverse-white-mask" operator="in" result="source-without-white" />
            <feFlood flood-color="#e9ebe6" flood-opacity="0.90" result="gray" />
            <feComposite in="gray" in2="white-mask" operator="in" result="gray-lines" />
            <feComposite in="gray-lines" in2="source-without-white" operator="over" />
        </filter>
    </svg>
    <div id="page">
        <div id="main-content-container" class="container video-background" aria-hidden="true">
            <div id="background-gabrielle">
                <video id="background-video" playsinline muted loop preload="none">
                    <source data-src="/media/video/AMP-26-Visual-Gold.mp4" type="video/mp4">
                </video>
                <video id="background-video-mobile" playsinline muted loop preload="none">
                    <source data-src="/media/video/AMP-26-Visual-Gold-P.mp4" type="video/mp4">
                </video>
            </div>
        </div>
        <?php include __DIR__ . '/partials/layout.php'; ?>

    </div>

</body>

</html>
