<!DOCTYPE html>
<html lang="de">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AMP Event 2026</title>

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

    <!-- OPTIONAL: global wrapper (besser für GSAP & page transitions) -->
    <div id="page">
        <div id="main-content-container" class="container video-background" aria-hidden="true">
            <div id="background-gabrielle">
                <video id="background-video" playsinline autoplay muted loop preload="auto">
                    <source src="/media/video/AMP-26-Visual-Gold.mp4" type="video/mp4">
                </video>
                <video id="background-video-mobile" playsinline autoplay muted loop preload="auto">
                    <source src="/media/video/AMP-26-Visual-Gold-P.mp4" type="video/mp4">
                </video>
            </div>
        </div>

        <!-- DEIN KOMPLETTES AMP LAYOUT KOMMT HIER REIN -->
        <!-- NICHT in #app einsperren -->

        <?php include __DIR__ . '/partials/layout.php'; ?>

    </div>

</body>

</html>
