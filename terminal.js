/**
 * Hasan's Advanced Terminal, Matrix Rain & Pixel Game
 * v2.0.0 - "Master Operator Edition"
 */

document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('terminal-trigger');
    const overlay = document.getElementById('terminal-overlay');
    const input = document.getElementById('terminal-input');
    const output = document.getElementById('terminal-output');
    const closeBtn = overlay.querySelector('.control.close');
    const body = document.getElementById('terminal-body');
    const gameContainer = document.getElementById('game-container');
    
    // --- State Management ---
    let history = [];
    let historyIndex = -1;
    let isGameRunning = false;
    let gameLoop;

    const BANNER = `
  _    _                               _  _            _    
 | |  | |                             | |(_)          | |   
 | |__| |  __ _  ___   __ _  _ __     | | _   ___  ___| | __
 |  __  | / _\` |/ __| / _\` || '_ \\    | || | / __|/ _ \\ |/ /
 | |  | || (_| |\\__ \\| (_| || | | |   | || || (__|  __/   < 
 |_|  |_| \\__,_||___/ \\__,_||_| |_|   |_||_| \\___|\\___|_|\\_\\
                                                            
    [ SYSTEM: ONLINE | NODE: HASAN_PROD | VERSION: 3.5 ]
    [ Type 'help' to begin your session ]
    `;

    // --- Terminal Logic ---
    const commands = {
        'help': () => printHelp(),
        '?': () => printHelp(),
        'clear': () => { output.innerHTML = ''; },
        'exit': () => toggleTerminal(false),
        'about': () => printLine("Hasan Çiçek: Systems & Software Engineer. Specialist in FreeBSD, Network Orchestration, and High-Concurrency systems."),
        'skills': () => printLine("Kernel (FreeBSD), Network (PF, SNAT, BINAT), Security (Snort, Squid), Automation (Bash, Node.js), Web (React, PHP)."),
        'projects': () => printLine("VPN_JAIL_SIM, BASH_RC_AUTOMATOR, NODE_MONITOR_APP. Type 'repos' for more."),
        'repos': () => {
            printLine("Fetching artifacts from github/cicekhasann...", "cmd");
            setTimeout(() => {
                printLine("- About (Current portfolio)");
                printLine("- Livepcap-Analyzer (Go network tool)");
                printLine("- FreeBSD-Kernel-Config (Custom build scripts)");
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
        'resume': () => {
            printLine("Downloading HASAN_RESUME.PDF...");
            window.open('https://github.com/cicekhasann/About/raw/main/Hasan_Cicek_Resume.pdf', '_blank');
        },
        'ls': () => printLine("about.txt  skills.md  projects.conf  game.exe  resume.sh", "success"),
        'cat': (args) => {
            const file = args[0];
            if (file === 'about.txt') commands.about();
            else if (file === 'skills.md') commands.skills();
            else if (file === 'projects.conf') commands.projects();
            else printLine(`cat: ${file}: No such file`, "error");
        },
        'whoami': () => printLine("guest@hasan-portfolio:~$ A curious visitor in the matrix."),
        'date': () => printLine(new Date().toLocaleString()),
        'sudo': () => printLine("Nice try, but you need higher clearance for kernel access.", "error"),
        'neofetch': () => {
            printLine("OS: FreeBSD 14.3-STABLE", "cmd");
            printLine("Host: Hasan_Srv_Node_A");
            printLine("Kernel: 14.3-RELEASE-p1");
            printLine("Shell: hasan-sh 2.0");
            printLine("CPU: 32-core Virtualized Xeon");
            printLine("Memory: 128GB / 256GB");
        }
    };

    function printLine(text, type = '') {
        const div = document.createElement('div');
        div.className = `line ${type}`;
        div.innerHTML = text;
        output.appendChild(div);
        body.scrollTop = body.scrollHeight;
    }

    function printHelp() {
        printLine("AVAILABLE COMMANDS:", "cmd");
        const cmds = Object.keys(commands).sort();
        cmds.forEach(c => {
            printLine(`  ${c.padEnd(12)} - Action for ${c} operation`);
        });
    }

    function toggleTerminal(show) {
        if (show) {
            overlay.classList.remove('hidden');
            if (output.innerHTML === '') {
                printLine(BANNER.replace(/\n/g, '<br>'), "cmd");
            }
            setTimeout(() => input.focus(), 50); // Delay to ensure element is visible
        } else {
            overlay.classList.add('hidden');
            if (isGameRunning) stopPixelGame();
        }
    }

    // Focus input whenever user clicks anywhere inside the terminal window
    overlay.querySelector('.terminal-window').addEventListener('click', () => {
        input.focus();
    });

    trigger.addEventListener('click', () => toggleTerminal(true));
    closeBtn.addEventListener('click', () => toggleTerminal(false));

    // --- Input Handling ---
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
            if (matches.length === 1) {
                input.value = matches[0];
            } else if (matches.length > 1) {
                printLine(matches.join('  '), "success");
            }
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

    window.addEventListener('resize', () => {
        if (document.body.classList.contains('theme-matrix')) startMatrixRain();
    });

    // --- Pixel Game: Packet Collector ---
    const gCanvas = document.getElementById('game-canvas');
    const gCtx = gCanvas.getContext('2d');
    let player = { x: 0, y: 0, w: 20, h: 20 };
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
        player.x = gCanvas.width / 2 - 10;
        player.y = gCanvas.height - 30;
        packets = [];
        enemies = [];

        document.getElementById('game-overlay').classList.remove('hidden');
        document.getElementById('game-overlay').querySelector('.game-msg').innerText = "SPACE TO START | ARROWS TO MOVE";

        window.addEventListener('keydown', handleGameInput);
        gameLoop = requestAnimationFrame(gameUpdate);
    }

    function stopPixelGame() {
        isGameRunning = false;
        cancelAnimationFrame(gameLoop);
        gameContainer.classList.add('hidden');
        window.removeEventListener('keydown', handleGameInput);
        input.focus();
    }

    function handleGameInput(e) {
        if (!isGameRunning) return;
        if (e.code === 'Space') document.getElementById('game-overlay').classList.add('hidden');
        if (e.code === 'ArrowLeft') player.x -= 25;
        if (e.code === 'ArrowRight') player.x += 25;
        if (e.code === 'Escape') stopPixelGame();
        if (player.x < 0) player.x = 0;
        if (player.x > gCanvas.width - player.w) player.x = gCanvas.width - player.w;
    }

    function updateScore(s) {
        gameScore = s;
        document.querySelector('.game-score').innerText = `SCORE: ${gameScore}`;
    }

    function gameUpdate() {
        if (!isGameRunning) return;
        gCtx.fillStyle = '#000';
        gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);

        // Player
        gCtx.fillStyle = getComputedStyle(document.body).getPropertyValue('--color-primary') || '#38bdf8';
        gCtx.fillRect(player.x, player.y, player.w, player.h);

        // Spawning
        if (Math.random() < 0.05) packets.push({ x: Math.random() * (gCanvas.width - 10), y: -10, w: 10, h: 10 });
        if (Math.random() < 0.03) enemies.push({ x: Math.random() * (gCanvas.width - 10), y: -10, w: 10, h: 10 });

        // Packets (Green)
        gCtx.fillStyle = '#22c55e';
        packets.forEach((p, i) => {
            p.y += 4;
            gCtx.fillRect(p.x, p.y, p.w, p.h);
            if (p.x < player.x + player.w && p.x + p.w > player.x && p.y < player.y + player.h && p.y + p.h > player.y) {
                packets.splice(i, 1);
                updateScore(gameScore + 10);
            }
            if (p.y > gCanvas.height) packets.splice(i, 1);
        });

        // Enemies (Red)
        gCtx.fillStyle = '#f43f5e';
        enemies.forEach((e, i) => {
            e.y += 5;
            gCtx.fillRect(e.x, e.y, e.w, e.h);
            if (e.x < player.x + player.w && e.x + e.w > player.x && e.y < player.y + player.h && e.y + e.h > player.y) {
                gameOver();
            }
            if (e.y > gCanvas.height) enemies.splice(i, 1);
        });

        if (isGameRunning) gameLoop = requestAnimationFrame(gameUpdate);
    }

    function gameOver() {
        isGameRunning = false;
        document.getElementById('game-overlay').classList.remove('hidden');
        document.getElementById('game-overlay').querySelector('.game-msg').innerText = "KERNEL PANIC!";
        printLine(`GAME OVER! Score: ${gameScore}`, "error");
        setTimeout(stopPixelGame, 2000);
    }
});
