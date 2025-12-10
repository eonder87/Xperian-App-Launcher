const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const ini = require('ini');

// Apps container
let apps = [];
let currentIndex = 0;

// Elements
const wheel = document.getElementById('wheel');
const bgLayer = document.getElementById('background-layer');
const appTitle = document.getElementById('app-title');
const clock = document.getElementById('clock');
const exitBtn = document.getElementById('exit-btn');

// Gradients for fallback
const gradients = [
    'linear-gradient(135deg, #000000 0%, #0d2538 100%)',
    'linear-gradient(135deg, #0f0514 0%, #3e1852 100%)',
    'linear-gradient(135deg, #210404 0%, #631111 100%)',
    'linear-gradient(135deg, #04101c 0%, #10426b 100%)',
    'linear-gradient(135deg, #0b0d12 0%, #1b2838 100%)'
];

async function loadAppsFromConfig(basePath) {
    const appsDir = path.join(basePath, 'apps');

    // Create apps dir if it doesn't exist (helpful for first run)
    if (!fs.existsSync(appsDir)) {
        try {
            fs.mkdirSync(appsDir);
        } catch (e) {
            console.error("Could not create apps dir:", e);
        }
    }

    if (!fs.existsSync(appsDir)) {
        apps = [{
            id: 'error',
            name: 'Apps Folder Not Found',
            path: '',
            bgGradient: gradients[0],
            logo: null
        }];
        return;
    }

    const files = fs.readdirSync(appsDir);
    const configFiles = files.filter(file => file.endsWith('.ini') || file.endsWith('.cfg'));

    apps = [];

    configFiles.forEach((file, index) => {
        try {
            const filePath = path.join(appsDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const config = ini.parse(content);

            if (config.Application && config.Application.Platform) {
                const defaultGradient = gradients[index % gradients.length];
                let clearLogo = config.Assets ? config.Assets['Clear Logo'] : null;
                let background = config.Assets ? config.Assets['Background'] : null;

                // Path Resolving Logic for Assets
                const resolveAssetPath = (assetPath) => {
                    if (!assetPath) return null;
                    if (path.isAbsolute(assetPath) && fs.existsSync(assetPath)) return assetPath;

                    // Check relative to Base Path (e.g., assets/logo.png -> C:/MyLauncher/assets/logo.png)
                    const fullPath = path.join(basePath, assetPath);
                    if (fs.existsSync(fullPath)) return fullPath;

                    // Check relative to Config File (less common but possible)
                    const localPath = path.join(appsDir, assetPath);
                    if (fs.existsSync(localPath)) return localPath;

                    return assetPath; // Return original if not found, let image error handler catch it
                };

                apps.push({
                    id: file.replace('.ini', '').replace('.cfg', ''),
                    name: config.Application.Platform,
                    path: config.Application.Location,
                    logo: resolveAssetPath(clearLogo),
                    background: resolveAssetPath(background),
                    bgGradient: defaultGradient,
                });
            }
        } catch (err) {
            console.error(`Error loading config file ${file}:`, err);
        }
    });

    if (apps.length === 0) {
        apps.push({
            id: 'demo',
            name: 'No Apps Found',
            path: '',
            bgGradient: gradients[0],
            logo: null
        });
    }
}

async function init() {
    // 1. Get the Correct Root Path
    const basePath = await ipcRenderer.invoke('get-base-path');
    console.log("Base Path:", basePath);

    // 2. Load Apps
    await loadAppsFromConfig(basePath);

    // 3. Render
    renderWheelItems(); // Generate DOM elements once

    setTimeout(() => updateVisuals(), 100);
    startClock();

    document.addEventListener('keydown', handleInput);
    if (exitBtn) {
        exitBtn.addEventListener('click', () => ipcRenderer.send('quit-app'));
    }
}

function renderWheelItems() {
    wheel.innerHTML = '';

    if (apps.length === 0) return;

    apps.forEach((app, index) => {
        const item = document.createElement('div');
        item.className = 'wheel-item';
        // Click to select
        item.onclick = () => {
            currentIndex = index;
            updateVisuals();
        };

        let content = '';
        if (app.logo && fs.existsSync(app.logo)) {
            content = `<img src="${app.logo.replace(/\\/g, '/')}" alt="${app.name}">`;
        } else {
            content = `<div class="fallback-text">${app.name.substring(0, 1)}</div>`;
        }

        item.innerHTML = content;
        wheel.appendChild(item);
    });
}

function updateVisuals() {
    const items = wheel.children;
    if (items.length === 0) return;

    // We only want to show 2 neighbors on each side (Total 5)
    // But we need to handle wrapping (if list is short or at ends)

    const count = apps.length;

    for (let i = 0; i < count; i++) {
        const item = items[i];

        // Calculate distance from current index
        // Handle wrapping distance (e.g. if current is 0, last item is -1 distance)
        let dist = i - currentIndex;

        // Shortest path wrapping logic
        if (dist > count / 2) dist -= count;
        if (dist < -count / 2) dist += count;

        // Default style for hidden items
        let opacity = 0;
        let transform = `translate(0, 200px) scale(0)`;
        let zIndex = 0;
        let pointerEvents = 'none';

        // ARC LOGIC configuration
        if (Math.abs(dist) <= 2) {
            opacity = 1;
            pointerEvents = 'auto';

            if (dist === 0) {
                // CENTER (Active)
                // Highest point (Peak of arc)
                transform = `translateX(0) translateY(-120px) scale(1.8)`;
                zIndex = 10;
                opacity = 1;
            } else if (Math.abs(dist) === 1) {
                // NEIGHBORS (1st)
                // Spread out to ~18vw (approx 35-40% of screen combined with center)
                const sign = Math.sign(dist);
                const tx = sign * 18;  // 18vw
                const ty = -40;        // Slightly lower than center
                const rot = sign * 15;

                transform = `translateX(${tx}vw) translateY(${ty}px) scale(1.2) rotate(${rot}deg)`;
                zIndex = 5;
                opacity = 1; // Full opacity for better visibility
            } else if (Math.abs(dist) === 2) {
                // OUTER (2nd)
                // Spread out to ~36vw (approx 72-80% total width span)
                const sign = Math.sign(dist);
                const tx = sign * 36;  // 36vw
                const ty = 60;         // Lowest point
                const rot = sign * 30;

                transform = `translateX(${tx}vw) translateY(${ty}px) scale(0.8) rotate(${rot}deg)`;
                zIndex = 1;
                opacity = 0.8;
            }
        }

        // Apply styles
        item.style.transform = transform;
        item.style.opacity = opacity;
        item.style.zIndex = zIndex;
        item.style.pointerEvents = pointerEvents;
    }

    // Update Background and Info for CURRENT item
    const app = apps[currentIndex];

    // Background
    if (app.background && fs.existsSync(app.background)) {
        // Check if bg actually changed to avoid flicker
        const newBg = `url('${app.background.replace(/\\/g, '/')}')`;
        if (bgLayer.style.backgroundImage !== newBg) {
            bgLayer.style.backgroundImage = newBg;
        }
    } else {
        bgLayer.style.backgroundImage = 'none';
        bgLayer.style.background = app.bgGradient;
    }

    // Title
    if (appTitle.innerText !== app.name) {
        appTitle.innerText = app.name;
        appTitle.style.animation = 'none';
        appTitle.offsetHeight;
        appTitle.style.animation = 'slideDown 0.5s forwards';
    }
}

function handleInput(e) {
    if (e.key === 'ArrowRight') {
        currentIndex++;
        if (currentIndex >= apps.length) currentIndex = 0;
        updateVisuals();
    } else if (e.key === 'ArrowLeft') {
        currentIndex--;
        if (currentIndex < 0) currentIndex = apps.length - 1;
        updateVisuals();
    } else if (e.key === 'Enter') {
        launchCurrentApp();
    } else if (e.key === 'Escape') {
        ipcRenderer.send('quit-app');
    }
}

function launchCurrentApp() {
    const app = apps[currentIndex];
    if (!app.path) return;

    console.log("Launching", app.name);

    const originalText = appTitle.innerText;
    appTitle.innerText = "LAUNCHING...";

    setTimeout(() => {
        appTitle.innerText = originalText;
    }, 4000);

    ipcRenderer.send('launch-app', app.path);
}

function startClock() {
    const updateTime = () => {
        const now = new Date();
        clock.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    updateTime();
    setInterval(updateTime, 1000);
}

init();
