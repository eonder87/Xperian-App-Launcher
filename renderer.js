const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
// Custom INI Parser to avoid dependencies
function parseIni(str) {
    const result = {};
    let currentSection = null;

    const lines = str.split(/\r?\n/);
    lines.forEach(line => {
        line = line.trim();
        if (!line || line.startsWith(';') || line.startsWith('#')) return; // Skip empty/comments

        if (line.startsWith('[') && line.endsWith(']')) {
            const sectionName = line.slice(1, -1).trim();
            currentSection = sectionName;
            if (!result[currentSection]) result[currentSection] = {};
        } else if (line.includes('=')) {
            const idx = line.indexOf('=');
            const key = line.slice(0, idx).trim();
            let val = line.slice(idx + 1).trim();
            // Remove quotes if present
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }

            if (currentSection) {
                result[currentSection][key] = val;
            } else {
                result[key] = val;
            }
        }
    });
    return result;
}

// Apps container
let apps = [];
let currentIndex = 0;

// Elements
const wheel = document.getElementById('wheel');
const bgLayer1 = document.getElementById('background-layer');

// --- LOCALIZATION ---
const translations = {
    en: {
        appsFolderNotFound: 'Apps Folder Not Found',
        noAppsFound: 'No Apps Found',
        launching: 'LAUNCHING...'
    },
    tr: {
        appsFolderNotFound: 'Apps Klasörü Bulunamadı',
        noAppsFound: 'Uygulama Bulunamadı',
        launching: 'BAŞLATILIYOR...'
    }
};

// Language State
let userLang = localStorage.getItem('app_lang') || (navigator.language.startsWith('tr') ? 'tr' : 'en');
let t = translations[userLang];

// Update UI Text helper
function updateUITexts() {
    t = translations[userLang];

    // Update Button Text
    const langBtn = document.getElementById('lang-btn');
    if (langBtn) langBtn.innerText = userLang.toUpperCase();

    // Update Dynamic Texts (re-render or specific ID updates)
    // If we have "No Apps" or "Error" currently shown in the wheel, we might need to refresh apps
    // But simplest is to just reload apps if the list is empty/error

    const appsEmpty = apps.length === 1 && (apps[0].id === 'error' || apps[0].id === 'demo');
    if (appsEmpty) {
        // Force refresh apps list to update localized name
        apps[0].name = apps[0].id === 'error' ? t.appsFolderNotFound : t.noAppsFound;
        renderWheelItems();
        updateVisuals();
    }
}
const bgLayer2 = document.getElementById('background-layer-2');
let activeBgLayer = 1; // Track which layer is currently visible
let bgUpdateTimeout = null; // For debouncing
const appTitle = document.getElementById('app-title');
const clock = document.getElementById('clock');
const exitBtn = document.getElementById('exit-btn');

// --- SOUND MANAGER (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const soundManager = {
    playMove: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine'; // Soft click
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    },
    playSelect: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        // Rich chord effect for selection
        const now = audioCtx.currentTime;
        const freqs = [440, 554, 659]; // A major chord
        freqs.forEach((f, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(now + 0.6);
        });
    },
    warmUp: () => {
        // Play a silent sound to wake up the AudioContext immediately
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0, audioCtx.currentTime); // SILENT
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    }
};

// --- GAMEPAD STATE ---
let lastGamepadTime = 0;
const GAMEPAD_THRESHOLD = 0.5;
const GAMEPAD_COOLDOWN = 150; // ms

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
            name: t.appsFolderNotFound,
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
            const config = parseIni(content);

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
            name: t.noAppsFound,
            path: '',
            bgGradient: gradients[0],
            logo: null
        });
    }
}

function preloadAssets() {
    console.log("Preloading and decoding assets...");
    apps.forEach(app => {
        // Helper to decode
        const decodeImg = (src) => {
            if (!src) return;
            const img = new Image();
            img.src = src.replace(/\\/g, '/');
            // Explicitly verify decode to force GPU upload
            if (img.decode) {
                img.decode().catch(e => console.warn("Could not decode image:", src));
            }
        };

        decodeImg(app.background);
        decodeImg(app.logo);
    });
}

async function init() {
    // 1. Get the Correct Root Path
    const basePath = await ipcRenderer.invoke('get-base-path');
    console.log("Base Path:", basePath);

    // 2. Load Apps
    // 2. Load Apps
    await loadAppsFromConfig(basePath);

    // 2.1 Preload Images for smooth performance
    preloadAssets();

    // 3. Render
    // 3. Render
    renderWheelItems(); // Generate DOM elements once

    // 4. Warm up systems (Audio & GPU)
    soundManager.warmUp();

    // Force a layout recalc (Reflow) to ensure GPU layers are prepped
    document.body.offsetHeight;

    setTimeout(() => updateVisuals(), 100);
    startClock();

    // Trigger updateVisuals again slightly later to ensure transitions are "hot"
    setTimeout(() => updateVisuals(), 500);

    document.addEventListener('keydown', handleInput);

    if (exitBtn) {
        exitBtn.addEventListener('click', () => {
            soundManager.playSelect(); // Sound on exit click
            ipcRenderer.send('quit-app');
        });
    }

    // Language Toggle
    const langBtn = document.getElementById('lang-btn');
    if (langBtn) {
        langBtn.innerText = userLang.toUpperCase();
        langBtn.addEventListener('click', () => {
            userLang = userLang === 'en' ? 'tr' : 'en';
            localStorage.setItem('app_lang', userLang);
            soundManager.playSelect();
            updateUITexts();
        });
    }

    // Start Gamepad Loop
    requestAnimationFrame(pollGamepad);
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
                item.classList.add('active'); // Add active hook for CSS
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
                item.classList.remove('active');
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
                item.classList.remove('active');
            }
        } else {
            item.classList.remove('active');
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
    // Background (DEBOUNCED & DUAL BUFFERED)
    // Only update background if user stops scrolling for 150ms
    clearTimeout(bgUpdateTimeout);
    bgUpdateTimeout = setTimeout(() => {
        updateBackground(app);
    }, 150);

    // Title
    if (appTitle.innerText !== app.name) {
        appTitle.innerText = app.name;
        // Optimization: Do not re-trigger animation on every single scroll if it's too fast
        // But for title it's usually fine.
        appTitle.style.animation = 'none';
        appTitle.offsetHeight;
        appTitle.style.animation = 'slideDown 0.5s forwards';
    }
}

function updateBackground(app) {
    const nextLayer = activeBgLayer === 1 ? bgLayer2 : bgLayer1;
    const currentLayer = activeBgLayer === 1 ? bgLayer1 : bgLayer2;

    if (app.background && fs.existsSync(app.background)) {
        const newBg = `url('${app.background.replace(/\\/g, '/')}')`;
        // Optimization: Don't swap if same image
        if (nextLayer.style.backgroundImage !== newBg && currentLayer.style.backgroundImage !== newBg) {
            nextLayer.style.backgroundImage = newBg;
        }
    } else {
        nextLayer.style.backgroundImage = 'none';
        nextLayer.style.background = app.bgGradient;
    }

    // Swap Opacity
    nextLayer.classList.add('active');
    currentLayer.classList.remove('active');

    // Toggle state
    activeBgLayer = activeBgLayer === 1 ? 2 : 1;
}



function handleInput(e) {
    if (e.key === 'ArrowRight') {
        moveRight();
    } else if (e.key === 'ArrowLeft') {
        moveLeft();
    } else if (e.key === 'Enter') {
        launchCurrentApp();
    } else if (e.key === 'Escape') {
        ipcRenderer.send('quit-app');
    }
}

// Separated movement logic for reuse by Gamepad
// Separated movement logic for reuse by Gamepad
let isUpdating = false;

function scheduleUpdate() {
    if (isUpdating) return;
    isUpdating = true;
    requestAnimationFrame(() => {
        updateVisuals();
        isUpdating = false;
    });
}

function moveRight() {
    currentIndex++;
    if (currentIndex >= apps.length) currentIndex = 0;
    soundManager.playMove(); // SFX
    scheduleUpdate();
}

function moveLeft() {
    currentIndex--;
    if (currentIndex < 0) currentIndex = apps.length - 1;
    soundManager.playMove(); // SFX
    scheduleUpdate();
}

// --- GAMEPAD POLLING ---
function pollGamepad() {
    const gamepads = navigator.getGamepads();
    if (!gamepads) {
        requestAnimationFrame(pollGamepad);
        return;
    }

    // Check first active gamepad
    const gp = gamepads[0];
    if (gp) {
        const now = Date.now();
        if (now - lastGamepadTime > GAMEPAD_COOLDOWN) {
            // Axes (Stick)
            // Axis 0 is usually Left Stick X (-1 Left, 1 Right)
            if (gp.axes[0] > GAMEPAD_THRESHOLD) {
                moveRight();
                lastGamepadTime = now;
            } else if (gp.axes[0] < -GAMEPAD_THRESHOLD) {
                moveLeft();
                lastGamepadTime = now;
            }

            // D-Pad is often mapped to buttons 14 (Left) and 15 (Right) or Axes depending on driver.
            // Standard mapping: 12=Up, 13=Down, 14=Left, 15=Right
            if (gp.buttons[15] && gp.buttons[15].pressed) {
                moveRight();
                lastGamepadTime = now;
            } else if (gp.buttons[14] && gp.buttons[14].pressed) {
                moveLeft();
                lastGamepadTime = now;
            }

            // A Button (Selection) - Usually button 0
            if (gp.buttons[0] && gp.buttons[0].pressed) {
                // Debounce slightly longer for selection to avoid double launch ? 
                // Actually logic is safe enough but let's update time
                launchCurrentApp();
                lastGamepadTime = now + 500; // Longer cooldown after launch
            }
        }
    }
    requestAnimationFrame(pollGamepad);
}

function launchCurrentApp() {
    const app = apps[currentIndex];
    if (!app.path) return;

    soundManager.playSelect(); // SFX
    console.log("Launching", app.name);

    const originalText = appTitle.innerText;
    appTitle.innerText = t.launching;

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
