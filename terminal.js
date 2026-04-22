/**
 * Hasan's Advanced Terminal, Matrix Rain & Pixel Game
 * v3.0.0 - "Precision & Polish Edition"
 */

document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('terminal-trigger');
    const overlay = document.getElementById('terminal-overlay');
    const input = document.getElementById('terminal-input');
    const output = document.getElementById('terminal-output');
    const closeBtn = overlay.querySelector('.control.close');
    const body = document.getElementById('terminal-body');
    const gameContainer = document.getElementById('game-container');
    
    let history = [];
    let historyIndex = -1;
    let isGameRunning = false;
    let gameLoop;
    let keys = {}; // For continuous game movement

    const BANNER = `
  _    _         _____          _   _ 
 | |  | |  /\\    / ____|   /\\   | \\ | |
 | |__| | /  \\  | (___    /  \\  |  \\| |
 |  __  |/ /\\ \\  \\___ \\  / /\\ \\ | . \` |
 | |  | / ____ \\ ____) |/ ____ \\| |\\  |
 |_|  |/_/    \\_\\_____//_/    \\_\\_| \\_|
                                       
   _____ _____ _____ ______ _  __
  / ____|_   _/ ____|  ____| |/ /
 | |      | || |    | |__  | ' / 
 | |      | || |    |  __| |  <  
 | |____ _| || |____| |____| . \\ 
  \\_____|_____\\_____|______|_|\\_\\
                                       
    [ SYSTEM: ONLINE | NODE: HASAN_PROD | VERSION: 3.5_STABLE ]
    [ Type 'help' to see available operator commands ]
    `;

    const commands = {
        'help': () => printHelp(),
        '?': () => printHelp(),
        'clear': () => { output.innerHTML = ''; },
        'exit': () => toggleTerminal(false),
        'about': () => {
            printLine("HASAN ÇİÇEK - Advanced Systems & Software Engineer", "cmd");
            printLine("Specialist in FreeBSD Mastery, High-Performance Infrastructure, and Backend Logic.");
            printLine("Focus: Engineering ultra-scalable production nodes and kernel-level networking.");
        },
        'stack': () => {
            printLine("TECHNICAL REPERTOIRE:", "cmd");
            printLine("  [Kernel/Net]  FreeBSD, PF Firewall (NAT/SNAT/BINAT), OpenVPN, Traffic Analysis");
            printLine("  [Services]    Docker Swarm, Nginx, Squid Proxy, Snort IDS/IPS, Kea DHCP");
            printLine("  [Automation]  Bash-to-Service (RC scripts), Node.js, Python, Git CI/CD");
            printLine("  [Build]       Node.js, React, Electron, Redis, PostgreSQL, C++ Concurrency");
        },
        'stats': () => {
            printLine("MISSION CRITICAL METRICS:", "cmd");
            printLine("  - SIMULATED: 35,000+ Concurrent VPN Clients in FreeBSD Jails");
            printLine("  - PERFORMANCE: ~2.8 Gbps Throughput Benchmarking & Optimization");
            printLine("  - CERTIFIED: CCNA (Intro to Networks & IT Essentials)");
        },
        'projects': () => {
            printLine("ARCHITECTURE ARTIFACTS:", "cmd");
            printLine("  1. VPN_JAIL_SIM      - 35k node simulation with custom PF routing");
            printLine("  2. BASH_RC_AUTOMATOR - Framework for FreeBSD production services");
            printLine("  3. NODE_MONITOR_APP  - Real-time system diagnostics tool (Electron)");
            printLine("  4. LIMITED_SHELL     - Secure environment restriction system");
            printLine("  5. ZETACCESS_PAM     - PAM infrastructure and authentication module");
        },
        'repos': () => {
            printLine("FETCHING PERSONAL REPOSITORIES...", "cmd");
            setTimeout(() => {
                printLine("- About (Modern portfolio system)");
                printLine("- FreeBSD-Service-Scripts (RC logic collection)");
                printLine("- Jail-Orchestrator (Node.js backend for jails)");
                printLine("- Snort-Tuning-Config (Production IDS rules)");
            }, 500);
        },
        'theme': (args) => {
            if (!args[0]) {
                printLine("Usage: theme [name]. Available: matrix, neon, cyber, plasma, reset", "error");
                return;
            }
            const theme = args[0].toLowerCase();
            document.body.className = 'modern-theme system-dash';
            if (theme !== 'reset') {
                document.body.classList.add(`theme-${theme}`);
                printLine(`Theme switched to ${theme.toUpperCase()}`, "success");
                if (theme === 'matrix') startMatrixRain();
                else stopMatrixRain();
            } else {
                printLine("Theme reset to default.", "success");
                stopMatrixRain();
            }
        },
        'game': () => startPixelGame(),
        'contact': () => {
            printLine("COMMUNICATIONS CHANNEL:", "cmd");
            printLine("  Email:    contact@hasancicek.com");
            printLine("  Location: GLOBAL_ZONE_A");
        },
        'social': () => {
            printLine("EXTERNAL NODES:", "cmd");
            printLine("  GitHub:   github/cicekhasann");
            printLine("  LinkedIn: linkedin/cicekhasan");
        },
        'whoami': () => printLine("guest@hasan-shell:~$ A terminal-bound explorer."),
        'date': () => printLine(new Date().toLocaleString()),
        'neofetch': () => {
            printLine("OS: FreeBSD 14.3-STABLE", "cmd");
            printLine("Kernel: 14.3-RELEASE-p1");
            printLine("Shell: hasan-sh 3.0");
            printLine("Uptime: 255 days, 12:04:32");
            printLine("CPU: 32-core Virtual Xeon");
            printLine("Memory: 128GB / 256GB");
        },
        'history': () => {
            history.forEach((cmd, i) => printLine(`  ${i+1}  ${cmd}`));
        }
    };

    function printLine(text, type = '') {
        const div = document.createElement('div');
        div.className = `line ${type}`;
        div.innerHTML = text;
        output.appendChild(div);
        body.scrollTop = body.scrollHeight;
    }

    function printBanner() {
        const div = document.createElement('div');
        div.className = 'banner-line';
        div.textContent = BANNER;
        output.appendChild(div);
        body.scrollTop = body.scrollHeight;
    }

    function printHelp() {
        printLine("AVAILABLE OPERATOR COMMANDS:", "cmd");
        const cmds = Object.keys(commands).sort();
        cmds.forEach(c => {
            printLine(`  ${c.padEnd(12)} - Access ${c} module`);
        });
    }

    function toggleTerminal(show) {
        if (show) {
            overlay.classList.remove('hidden');
            // Force clear default text and show banner
            if (output.innerHTML.includes("Welcome to Hasan's Private Shell") || output.innerHTML.trim() === '') {
                output.innerHTML = '';
                printBanner();
            }
            setTimeout(() => input.focus(), 50);
        } else {
            overlay.classList.add('hidden');
            if (isGameRunning) stopPixelGame();
        }
    }

    trigger.addEventListener('click', () => toggleTerminal(true));
    closeBtn.addEventListener('click', () => toggleTerminal(false));

    overlay.querySelector('.terminal-window').addEventListener('click', () => {
        if (!isGameRunning) input.focus();
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = input.value.trim();
            if (val) {
                printLine(`<span class="prompt">hasan@shell:~$</span> ${val}`);
                history.push(val);
                historyIndex = history.length;
                const parts = val.split(' ');
                const cmd = parts[0].toLowerCase();
                const args = parts.slice(1);
                if (commands[cmd]) commands[cmd](args);
                else printLine(`Command not found: ${cmd}. Type '?' for help.`, "error");
            }
            input.value = '';
        } else if (e.key === 'ArrowUp') {
            if (historyIndex > 0) {
                historyIndex--;
                input.value = history[historyIndex];
            }
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            if (historyIndex < history.length - 1) {
                historyIndex++;
                input.value = history[historyIndex];
            } else {
                historyIndex = history.length;
                input.value = '';
            }
            e.preventDefault();
        } else if (e.key === 'Tab') {
            const val = input.value.trim();
            const matches = Object.keys(commands).filter(c => c.startsWith(val));
            if (matches.length === 1) input.value = matches[0];
            else if (matches.length > 1) printLine(matches.join('  '), "success");
            e.preventDefault();
        }
    });

    // --- Matrix Rain Logic ---
    const mCanvas = document.getElementById('matrix-canvas');
    const mCtx = mCanvas.getContext('2d');
    let mDrops = [];
    let mInterval;

    function startMatrixRain() {
        mCanvas.width = window.innerWidth;
        mCanvas.height = window.innerHeight;
        const columns = mCanvas.width / 20;
        mDrops = Array(Math.floor(columns)).fill(1);
        if (mInterval) clearInterval(mInterval);
        mInterval = setInterval(drawMatrix, 50);
    }

    function stopMatrixRain() {
        clearInterval(mInterval);
        mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);
    }

    function drawMatrix() {
        mCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        mCtx.fillRect(0, 0, mCanvas.width, mCanvas.height);
        mCtx.fillStyle = '#0F0';
        mCtx.font = '15px monospace';
        for (let i = 0; i < mDrops.length; i++) {
            const text = String.fromCharCode(Math.random() * 128);
            mCtx.fillText(text, i * 20, mDrops[i] * 20);
            if (mDrops[i] * 20 > mCanvas.height && Math.random() > 0.975) mDrops[i] = 0;
            mDrops[i]++;
        }
    }

    // --- Pixel Game: Packet Collector v2 ---
    const gCanvas = document.getElementById('game-canvas');
    const gCtx = gCanvas.getContext('2d');
    let player = { x: 0, y: 0, w: 25, h: 25, speed: 7 };
    let packets = [];
    let enemies = [];
    let gameScore = 0;

    function startPixelGame() {
        gameContainer.classList.remove('hidden');
        isGameRunning = true;
        gameScore = 0;
        updateScore(0);
        gCanvas.width = 400;
        gCanvas.height = 400;
        player.x = gCanvas.width / 2 - 12;
        player.y = gCanvas.height - 40;
        packets = [];
        enemies = [];
        keys = {};
        document.getElementById('game-overlay').classList.remove('hidden');
        document.getElementById('game-overlay').querySelector('.game-msg').innerText = "SPACE TO START | HOLD ARROWS";
        
        window.addEventListener('keydown', keyDownHandler);
        window.addEventListener('keyup', keyUpHandler);
        gameLoop = requestAnimationFrame(gameUpdate);
    }

    function stopPixelGame() {
        isGameRunning = false;
        cancelAnimationFrame(gameLoop);
        gameContainer.classList.add('hidden');
        window.removeEventListener('keydown', keyDownHandler);
        window.removeEventListener('keyup', keyUpHandler);
        input.focus();
    }

    function keyDownHandler(e) {
        keys[e.code] = true;
        if (e.code === 'Space') document.getElementById('game-overlay').classList.add('hidden');
        if (e.code === 'Escape') stopPixelGame();
    }

    function keyUpHandler(e) {
        keys[e.code] = false;
    }

    function updateScore(s) {
        gameScore = s;
        document.querySelector('.game-score').innerText = `SCORE: ${gameScore}`;
    }

    function gameUpdate() {
        if (!isGameRunning) return;

        // Continuous Movement
        if (keys['ArrowLeft']) player.x -= player.speed;
        if (keys['ArrowRight']) player.x += player.speed;

        if (player.x < 0) player.x = 0;
        if (player.x > gCanvas.width - player.w) player.x = gCanvas.width - player.w;

        gCtx.fillStyle = '#000';
        gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);

        // Scanlines effect in game
        gCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        for(let i=0; i<gCanvas.height; i+=4) gCtx.fillRect(0, i, gCanvas.width, 1);

        // Player
        gCtx.fillStyle = getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8';
        gCtx.fillRect(player.x, player.y, player.w, player.h);
        gCtx.strokeStyle = '#fff';
        gCtx.strokeRect(player.x, player.y, player.w, player.h);

        // Spawn items (Difficulty increases with score)
        let spawnRate = 0.05 + (gameScore / 2000);
        if (Math.random() < spawnRate) packets.push({ x: Math.random() * (gCanvas.width - 12), y: -12, w: 12, h: 12 });
        if (Math.random() < spawnRate * 0.6) enemies.push({ x: Math.random() * (gCanvas.width - 12), y: -12, w: 12, h: 12 });

        // Packets
        gCtx.fillStyle = '#22c55e';
        packets.forEach((p, i) => {
            p.y += 3 + (gameScore / 500);
            gCtx.fillRect(p.x, p.y, p.w, p.h);
            if (p.x < player.x + player.w && p.x + p.w > player.x && p.y < player.y + player.h && p.y + p.h > player.y) {
                packets.splice(i, 1);
                updateScore(gameScore + 10);
            }
            if (p.y > gCanvas.height) packets.splice(i, 1);
        });

        // Enemies
        gCtx.fillStyle = '#f43f5e';
        enemies.forEach((e, i) => {
            e.y += 4 + (gameScore / 400);
            gCtx.fillRect(e.x, e.y, e.w, e.h);
            if (e.x < player.x + player.w && e.x + e.w > player.x && e.y < player.y + player.h && e.y + e.h > player.y) gameOver();
            if (e.y > gCanvas.height) enemies.splice(i, 1);
        });

        if (isGameRunning) gameLoop = requestAnimationFrame(gameUpdate);
    }

    function gameOver() {
        isGameRunning = false;
        document.getElementById('game-overlay').classList.remove('hidden');
        document.getElementById('game-overlay').querySelector('.game-msg').innerText = "SYSTEM CRASHED!";
        printLine(`GAME OVER! Score: ${gameScore}`, "error");
        setTimeout(stopPixelGame, 2000);
    }
});
