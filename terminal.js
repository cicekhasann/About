/**
 * Hasan's Advanced Terminal, Matrix Rain & Pixel Game
 * v5.6.1 - "The Focus Lock & UI Stability Update"
 */

const SUPABASE_URL = 'https://qzxtqxltrtpglrkwjvjj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_iGYsw-z13yooCZqMOiw1WA_KSTbLKRh';
let supabase = null;

function getSupabase() {
    if (supabase) return supabase;
    const sdk = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
    if (sdk && sdk.createClient) {
        supabase = sdk.createClient(SUPABASE_URL, SUPABASE_KEY);
        return supabase;
    }
    return null;
}

function initTerminal() {
    const trigger = document.getElementById('terminal-trigger');
    const overlay = document.getElementById('terminal-overlay');
    const input = document.getElementById('terminal-input');
    const output = document.getElementById('terminal-output');
    const closeBtn = overlay.querySelector('.control.close');
    const body = document.getElementById('terminal-body');
    const gameContainer = document.getElementById('game-container');
    const terminalWindow = overlay.querySelector('.terminal-window');
    
    let history = [];
    let historyIndex = -1;
    let isGameRunning = false;
    let isGamePaused = true;
    let gameLoop;
    let keys = {};
    let lastTime = 0;
    let gameLevel = 1;
    let gameMode = 'pixel'; // 'pixel' or 'brick'
    
    let currentUser = localStorage.getItem('hasan_user_name') || null;
    let currentPass = localStorage.getItem('hasan_user_pass') || null;
    let currentPlayerId = localStorage.getItem('hasan_user_id') || null;
    let guestHighScore = parseInt(localStorage.getItem('hasan_guest_score')) || 0;

    const BANNER = `
  _    _         _____          _   _ 
 | |  | |  /\\    / ____|   /\\   | \\ | |
 | |__| | /  \\  | (___    /  \\  |  \\| |
 |  __  |/ /\\ \\  \\___ \\  / /\\ \\ | . \\\` |
 | |  | / ____ \\ ____) |/ ____ \\| |\\  |
 |_|  |/_/    \\_\\_____//_/    \\_\\_| \\_|
                                       
   _____ _____ _____ ______ _  __
  / ____|_   _/ ____|  ____| |/ /
 | |      | || |    | |__  | ' / 
 | |      | || |    |  __| |  <  
 | |____ _| || |____| |____| . \\ 
  \\_____|_____\\_____|______|_|\\_\\
                                       
    [ SYSTEM: ONLINE | NODE: HASAN_PROD | VERSION: 5.6.1_STABLE ]
    [ Operator: ${currentUser || 'GUEST_EXPLOITER'} ]
    `;

    const virtualFiles = {
        'about.txt': "Systems & Software Engineer specializing in FreeBSD, Network Orchestration, and High-Concurrency systems. Operator of the Hasan_Prod node.",
        'skills.md': "Core: FreeBSD, Bash, Python, Node.js\nNetwork: Snort, Squid, PF Firewall, Redis\nHigh-Level: React, Electron, Microservices",
        'contact.env': "Email: hasan@operator.grid\nLocation: Istanbul Grid Node\nStatus: Available for complex orchestration."
    };

    const commands = {
        'help': () => printHelp(),
        '?': () => printHelp(),
        'clear': () => { output.innerHTML = ''; },
        'exit': () => toggleTerminal(false),
        'ls': () => {
            printLine("Directory: /home/hasan", "cmd");
            Object.keys(virtualFiles).forEach(f => printLine(`  -rwxr-xr-x  1 hasan hasan  1024 Apr 22 14:54 ${f}`));
        },
        'cat': (args) => {
            if (!args[0]) { printLine("Usage: cat [filename]", "error"); return; }
            if (virtualFiles[args[0]]) printLine(virtualFiles[args[0]]);
            else printLine(`cat: ${args[0]}: No such file or directory`, "error");
        },
        'whoami': () => {
            printLine("ID: " + (currentUser || "GUEST_EXPLOITER"));
            printLine("ACCESS_LEVEL: " + (currentUser ? "OPERATOR" : "ANONYMOUS"));
            printLine("SHELL: /usr/local/bin/hasan_shell");
        },
        'skills': () => {
            printLine("TECHNICAL REPERTOIRE:", "cmd");
            printLine("----------------------");
            printLine("[ ] FREEBSD KERNEL TUNING");
            printLine("[ ] NETWORK ORCHESTRATION");
            printLine("[ ] BASH-TO-SERVICE AUTOMATION");
            printLine("[ ] MICROSERVICES ARCHITECTURE");
        },
        'socials': () => {
            printLine("GRID CONNECTIONS:", "cmd");
            printLine("  GitHub   : github.com/cicekhasann");
            printLine("  LinkedIn : linkedin.com/in/hasancicek");
        },
        'repos': () => {
            printLine("FETCHING REPOSITORY DATA...", "cmd");
            const projects = [
                { name: "LivePcap-Analyzer", desc: "High-performance packet analysis engine.", stars: 42 },
                { name: "Antikor-OS", desc: "FreeBSD based network security distribution.", stars: 128 },
                { name: "Electron-Kesim-Plani", desc: "Professional furniture cutting optimization.", stars: 15 },
                { name: "Portfolio-v5", desc: "The terminal you are currently using.", stars: 99 }
            ];
            projects.forEach(p => {
                printLine(`>> ${p.name.padEnd(25)} [STARS: ${p.stars}]`);
                printLine(`   DESC: ${p.desc}`, "success");
            });
        },
        'theme': (args) => {
            const themes = ['matrix', 'neon', 'cyber', 'plasma'];
            if (!args[0] || !themes.includes(args[0])) {
                printLine(`Usage: theme [${themes.join('|')}]`, "error");
                return;
            }
            document.body.className = `theme-${args[0]}`;
            printLine(`Theme switched to ${args[0].toUpperCase()}.`, "success");
        },
        'register': async (args) => {
            if (currentUser) { printLine(`ACCESS DENIED: Linked to ${currentUser}.`, "error"); return; }
            if (!args[0] || !args[1]) { printLine("Usage: register [name] [password]", "error"); return; }
            const sb = getSupabase();
            if (!sb) { printLine("Database SDK not found.", "error"); return; }
            printLine("Registering...");
            const { data, error } = await sb.from('players').insert([{ username: args[0], passkey: args[1] }]).select().single();
            if (error) printLine(`Error: ${error.message}`, "error");
            else {
                currentUser = args[0]; currentPass = args[1]; currentPlayerId = data.id;
                localStorage.setItem('hasan_user_name', currentUser);
                localStorage.setItem('hasan_user_pass', currentPass);
                localStorage.setItem('hasan_user_id', currentPlayerId);
                printLine(`Operator ${args[0]} registered & logged in.`, "success");
            }
        },
        'login': async (args) => {
            if (!args[0] || !args[1]) { printLine("Usage: login [name] [password]", "error"); return; }
            const sb = getSupabase();
            if (!sb) return;
            const { data, error } = await sb.from('players').select('*').eq('username', args[0]).eq('passkey', args[1]).single();
            if (error || !data) printLine("Invalid credentials.", "error");
            else {
                currentUser = data.username; currentPass = data.passkey; currentPlayerId = data.id;
                localStorage.setItem('hasan_user_name', currentUser);
                localStorage.setItem('hasan_user_pass', currentPass);
                localStorage.setItem('hasan_user_id', currentPlayerId);
                printLine(`Welcome, ${currentUser}.`, "success");
            }
        },
        'leaderboard': async (args) => {
            const mode = (args[0] || gameMode).toLowerCase();
            printLine(`FETCHING ${mode.toUpperCase()} STANDINGS...`, "cmd");
            const sb = getSupabase();
            if (!sb) return;
            
            const { data, error } = await sb.from('game_scores')
                .select('score:high_score, players(username)')
                .eq('game_mode', mode)
                .order('high_score', { ascending: false })
                .limit(10);

            if (error) { printLine(`Error: ${error.message}`, "error"); return; }
            if (data) {
                data.forEach((row, i) => {
                    const name = row.players?.username || 'UNKNOWN';
                    printLine(`${(i === 0) ? "[TOP] " : `${(i+1).toString().padStart(2, '0')}. `}${name.padEnd(15)} - ${row.score} pts`);
                });
            } else {
                printLine("No data found for this module.", "error");
            }
        },
        'game': (args) => {
            if (!args[0]) {
                printLine("AVAILABLE GAMES:", "cmd");
                printLine("  pixel  - Packet management simulation.");
                printLine("  brick  - Infrastructure demolition (Brick Breaker).");
                printLine("  hockey - Hyper-threaded Air Hockey (Chaos Mode).");
                printLine("Usage: game [name] [mode] [p2name]");
                return;
            }
            const mode = args[0].toLowerCase().trim();
            if (mode === 'brick') startBrickGame();
            else if (mode === 'pixel') startPixelGame();
            else if (mode === 'hockey') {
                const isMulti = args[1] === 'multi';
                const p2Name = args[2] || (isMulti ? 'GUEST_2' : 'CPU_ORCHESTRATOR');
                startHockeyGame(isMulti, p2Name);
            } else {
                printLine(`Game '${mode}' not found.`, "error");
                printLine("Usage: game [pixel|brick|hockey]");
            }
        },
        'logout': () => {
            currentUser = null; currentPass = null; currentPlayerId = null;
            localStorage.removeItem('hasan_user_name');
            localStorage.removeItem('hasan_user_pass');
            localStorage.removeItem('hasan_user_id');
            printLine("Logged out.", "success");
        },
        'neofetch': () => {
            printLine("OS: FreeBSD 14.3-STABLE", "cmd");
            printLine("Operator: " + (currentUser || 'GUEST'));
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
    }

    function printHelp() {
        const descriptions = {
            'help': 'Display this systems operator manual',
            'game': 'Execute high-concurrency simulation modules',
            'clear': 'Purge terminal buffer',
            'ls': 'List virtual filesystem objects',
            'cat': 'Read object contents',
            'whoami': 'Display current operator status',
            'skills': 'Show technical repertoire',
            'socials': 'Display external grid connections',
            'repos': 'Fetch active project data',
            'theme': 'Switch UI color matrix',
            'register': 'Provision new operator credentials',
            'login': 'Authenticate existing operator',
            'leaderboard': 'Fetch global performance standings',
            'logout': 'Terminate current session',
            'neofetch': 'Display system information',
            'exit': 'Close terminal interface'
        };
        printLine("AVAILABLE COMMANDS:", "cmd");
        Object.keys(commands).sort().forEach(c => {
            const desc = descriptions[c] || `${c} module`;
            printLine(`  ${c.padEnd(12)} - ${desc}`);
        });
    }

    function toggleTerminal(show) {
        if (show) {
            overlay.classList.remove('hidden');
            output.innerHTML = '';
            printBanner();
            setTimeout(() => input.focus(), 100);
        } else {
            overlay.classList.add('hidden');
            if (isGameRunning) stopPixelGame();
        }
    }

    trigger.addEventListener('click', (e) => { e.preventDefault(); toggleTerminal(true); });
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleTerminal(false); });
    
    // Focus Lock: clicking anywhere in the window focuses the input
    terminalWindow.addEventListener('click', () => {
        if (!isGameRunning) input.focus();
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            const val = input.value.trim();
            if (val) {
                printLine(`<span class="prompt">hasan@shell:~$</span> ${val}`);
                history.push(val);
                historyIndex = history.length;
                const parts = val.split(' ');
                const cmd = parts[0].toLowerCase();
                const args = parts.slice(1);
                if (commands[cmd]) commands[cmd](args);
                else printLine(`Command not found: ${cmd}.`, "error");
            }
            input.value = '';
        } else if (e.key === 'ArrowUp') {
            if (historyIndex > 0) { historyIndex--; input.value = history[historyIndex]; }
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            if (historyIndex < history.length - 1) { historyIndex++; input.value = history[historyIndex]; }
            else { historyIndex = history.length; input.value = ''; }
            e.preventDefault();
        }
    });

    // --- Pixel Game Engine ---
    const gCanvas = document.getElementById('game-canvas');
    const gCtx = gCanvas.getContext('2d');
    let player = { x: 187, y: 360, w: 30, h: 20, speed: 450 }; 
    let items = [], gameScore = 0, slowTime = 0, shield = 0;
    
    // Brick Game State
    let ball = { x: 200, y: 300, dx: 0, dy: 0, r: 6 };
    let bricks = [];
    let ballLaunched = false;
    const BRICK_ROWS = 5, BRICK_COLS = 8, BRICK_W = 45, BRICK_H = 15, BRICK_PAD = 4;

    // Air Hockey State
    let pucks = [];
    let p1 = { x: 180, y: 450, w: 60, h: 15, score: 0 };
    let p2 = { x: 180, y: 50, w: 60, h: 15, score: 0 };
    let pucksPlayed = 0;
    let isMultiplayer = false;
    let chaosTimer = 0;

    async function startPixelGame() {
        gameContainer.classList.remove('hidden');
        isGameRunning = true; isGamePaused = true;
        gameScore = 0; gameLevel = 1; slowTime = 0; shield = 0;
        gCanvas.width = 400; gCanvas.height = 400;
        items = []; keys = {}; lastTime = performance.now();
        
        let hiScore = guestHighScore;
        const sb = getSupabase();
        if (sb && currentUser) {
            const { data } = await sb.from('leaderboard').select('score').eq('name', currentUser).single();
            if (data) hiScore = data.score;
        }

        document.getElementById('game-stat-user').innerText = currentUser || 'GUEST';
        document.getElementById('game-stat-score').innerText = '0';
        document.getElementById('game-stat-best').innerText = hiScore;
        document.getElementById('game-stat-level').innerText = '1';

        document.getElementById('game-overlay').classList.remove('hidden');
        
        gameMode = 'pixel';
        gameLoop = requestAnimationFrame(gameUpdateLoop);
    }

    async function startBrickGame() {
        gameContainer.classList.remove('hidden');
        isGameRunning = true; isGamePaused = true;
        gameScore = 0; gameLevel = 1; 
        gCanvas.width = 400; gCanvas.height = 400;
        player = { x: 175, y: 380, w: 50, h: 10, speed: 500 };
        resetBall();
        initBricks();
        keys = {}; lastTime = performance.now();
        
        let hiScore = guestHighScore;
        const sb = getSupabase();
        if (sb && currentUser) {
            const { data } = await sb.from('leaderboard').select('score').eq('name', currentUser).single();
            if (data) hiScore = data.score;
        }

        document.getElementById('game-stat-user').innerText = currentUser || 'GUEST';
        document.getElementById('game-stat-score').innerText = '0';
        document.getElementById('game-stat-best').innerText = hiScore;
        document.getElementById('game-stat-level').innerText = '1';

        document.getElementById('game-overlay').classList.remove('hidden');
        
        gameMode = 'brick';
        lastTime = performance.now();
        gameLoop = requestAnimationFrame(gameUpdateLoop);
    }

    async function startHockeyGame(multi = false, p2Name = 'CPU_ORCHESTRATOR') {
        gameContainer.classList.remove('hidden');
        isGameRunning = true; isGamePaused = true;
        gameScore = 0; gameLevel = 1; chaosTimer = 0; pucksPlayed = 0;
        isMultiplayer = multi;
        gCanvas.width = 400; gCanvas.height = 500;
        
        p1 = { x: 200, y: 460, w: 60, h: 15, score: 0, name: currentUser || 'GUEST' };
        p2 = { x: 200, y: 40, w: 60, h: 15, score: 0, name: p2Name };
        pucks = [{ x: 200, y: 250, dx: 0, dy: 0, r: 10 }];
        
        let hiScore = guestHighScore;
        const sb = getSupabase();
        if (sb && currentPlayerId) {
            const { data } = await sb.from('game_scores').select('high_score').eq('player_id', currentPlayerId).eq('game_mode', 'hockey').single();
            if (data) hiScore = data.high_score;
        }

        document.getElementById('game-stat-user').innerText = `${p1.name} vs ${p2.name}`;
        document.getElementById('game-stat-score').innerText = '0 - 0';
        document.getElementById('game-stat-best').innerText = hiScore;
        document.getElementById('game-stat-level').innerText = multi ? 'PvP' : 'PvE';

        const overlay = document.getElementById('game-overlay');
        overlay.classList.remove('hidden');
        overlay.querySelector('.game-msg-big').innerText = "HOCKEY INITIALIZED";
        overlay.querySelector('.game-controls').innerHTML = `
            <div style="display:flex; gap:10px; justify-content:center; margin-top:10px;">
                <button onclick="window.setHockeyMode(false)" class="mode-btn ${!multi?'active':''}">Solo (vs CPU)</button>
                <button onclick="window.setHockeyMode(true)" class="mode-btn ${multi?'active':''}">Multi (Local)</button>
            </div>
            <div id="p2-name-box" style="margin-top:10px; ${multi?'':'display:none;'}">
                P2 NAME: <input type="text" id="p2-name-input" value="${p2Name}" style="background:rgba(0,0,0,0.5); border:1px solid var(--color-primary); color:var(--color-primary); font-family:var(--font-mono); font-size:0.8rem; padding:4px; width:120px; outline:none; text-align:center;">
            </div>
            <div style="margin-top:10px; font-size:0.8rem; opacity:0.8;">PRESS SPACE TO COMMENCE</div>
        `;

        gameMode = 'hockey';
        lastTime = performance.now();
        gameLoop = requestAnimationFrame(gameUpdateLoop);
    }
    
    window.setHockeyMode = (multi) => {
        isMultiplayer = multi;
        document.getElementById('game-stat-level').innerText = multi ? 'PvP' : 'PvE';
        document.getElementById('p2-name-box').style.display = multi ? 'block' : 'none';
        if (multi) document.getElementById('p2-name-input').focus();
        
        const btns = document.querySelectorAll('.mode-btn');
        btns[0].classList.toggle('active', !multi);
        btns[1].classList.toggle('active', multi);
    };

    function spawnPuck(intense = false) {
        const count = intense ? 3 : 1;
        for(let i=0; i<count; i++) {
            pucks.push({
                x: 200,
                y: 250,
                dx: 0,
                dy: 0,
                r: 10
            });
        }
    }

    function initBricks() {
        bricks = [];
        for (let r = 0; r < BRICK_ROWS + gameLevel; r++) {
            for (let c = 0; c < BRICK_COLS; c++) {
                bricks.push({
                    x: c * (BRICK_W + BRICK_PAD) + 5,
                    y: r * (BRICK_H + BRICK_PAD) + 40,
                    status: 1,
                    color: `hsl(${(r * 40) % 360}, 70%, 60%)`
                });
            }
        }
    }

    function resetBall() {
        ball.x = player.x + player.w / 2;
        ball.y = player.y - ball.r - 2;
        ball.dx = 0;
        ball.dy = 0;
        ballLaunched = false;
    }

    function handleTouch(e) {
        e.preventDefault();
        const rect = gCanvas.getBoundingClientRect();
        const touch = e.touches[0];
        const tx = (touch.clientX - rect.left) * (gCanvas.width / rect.width);
        player.x = tx - player.w / 2;
        player.x = Math.max(0, Math.min(gCanvas.width - player.w, player.x));
        if (isGamePaused) startGame();
    }

    function stopPixelGame() { isGameRunning = false; cancelAnimationFrame(gameLoop); gameContainer.classList.add('hidden'); setTimeout(() => input.focus(), 100); }

    function showOverlay(msg) {
        const overlay = document.getElementById('game-overlay');
        overlay.classList.remove('hidden');
        overlay.querySelector('.game-msg-big').innerText = msg;
    }

    function startGame() {
        if (gameMode === 'hockey') {
            const p2Inp = document.getElementById('p2-name-input');
            if (p2Inp && isMultiplayer) {
                p2.name = p2Inp.value.trim() || 'GUEST_2';
                document.getElementById('game-stat-user').innerText = `${p1.name} vs ${p2.name}`;
            }
        }
        isGamePaused = false; 
        document.getElementById('game-overlay').classList.add('hidden');
        if (gameMode === 'brick' && !ballLaunched) {
            ball.dx = (Math.random() - 0.5) * 400;
            ball.dy = -300 - (gameLevel * 20);
            ballLaunched = true;
        }
        if (gameMode === 'hockey' && (pucks.length === 0 || (pucks.length === 1 && pucks[0].dy === 0))) {
            if (pucks.length === 0) spawnPuck();
            pucks.forEach(p => {
                p.dx = (Math.random() - 0.5) * 600;
                p.dy = Math.random() > 0.5 ? 500 : -500;
            });
        }
    }

    function gameKeyDown(e) { 
        // Prevent game controls from triggering when typing in terminal
        if (document.activeElement === input) return;
        if (gameContainer.classList.contains('hidden')) return;

        if(e.code==='Space') {
            if (!isGameRunning) {
                if (gameMode === 'brick') startBrickGame();
                else if (gameMode === 'hockey') startHockeyGame(isMultiplayer);
                else startPixelGame();
            } else if (isGamePaused) {
                startGame();
            }
        } 
        if(e.code==='Escape') stopPixelGame(); 
        keys[e.code] = true; 
    }
    function gameKeyUp(e) { keys[e.code] = false; }

    function gameUpdateLoop(timestamp) {
        if (!isGameRunning) return;
        const dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        if (!isGamePaused) {
            if (gameMode === 'pixel') {
                let newLevel = Math.floor(gameScore / 500) + 1;
            if (newLevel > gameLevel) {
                gameLevel = newLevel;
                document.getElementById('game-stat-level').innerText = gameLevel;
                document.getElementById('level-box').classList.add('level-up-anim');
                setTimeout(() => document.getElementById('level-box').classList.remove('level-up-anim'), 600);
            }

            const currentSpeed = slowTime > 0 ? player.speed * 0.6 : player.speed;
            if (keys['ArrowLeft']) player.x -= currentSpeed * dt;
            if (keys['ArrowRight']) player.x += currentSpeed * dt;
            player.x = Math.max(0, Math.min(gCanvas.width - player.w, player.x));
            if (slowTime > 0) slowTime -= dt;
            if (shield > 0) shield -= dt;

            // Visual background variation based on level
            if (gameLevel > 1) {
                const hue = (gameLevel * 40) % 360;
                gCtx.fillStyle = `hsla(${hue}, 70%, 20%, 0.1)`;
                gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);
            }

            const spawnChance = (0.06 + (gameScore/6000) + (gameLevel * 0.01)) * (slowTime > 0 ? 0.6 : 1);
            if (Math.random() < spawnChance) {
                const rand = Math.random();
                let type = 'packet';
                if (rand < 0.15) type = 'virus';
                else if (rand < 0.20) type = 'firewall';
                else if (rand < 0.23) type = 'kernel';
                else if (rand < 0.26) type = 'pink';
                items.push({ x: Math.random() * (gCanvas.width - 20), y: -20, w: 16, h: 16, type });
            }

            items.forEach((item, i) => {
                let speed = (200 + (gameLevel * 25) + Math.min(gameScore / 10, 300)) * dt;
                if (slowTime > 0) speed *= 0.5;
                item.y += speed;
                if (item.x < player.x + player.w && item.x + item.w > player.x && item.y < player.y + player.h && item.y + item.h > player.y) {
                    if (item.type === 'packet') { gameScore += 10; document.getElementById('game-stat-score').innerText = gameScore; }
                    else if (item.type === 'pink') { 
                        // TRANSFORM ALL VIRUSES TO PACKETS
                        items.forEach(it => { if(it.type === 'virus') it.type = 'packet'; });
                        gameScore += 50; 
                        document.getElementById('game-stat-score').innerText = gameScore;
                    }
                    else if (item.type === 'firewall') slowTime = 3 + Math.random() * 5;
                    else if (item.type === 'kernel') shield = 3 + Math.random() * 4;
                    else if (item.type === 'virus') { if (shield <= 0) gameOver(); else shield = 0; }
                    items.splice(i, 1);
                }
                if (item.y > gCanvas.height) items.splice(i, 1);
            });
            } else if (gameMode === 'brick') {
            // Brick Game Physics
            const currentSpeed = player.speed;
            if (keys['ArrowLeft']) player.x -= currentSpeed * dt;
            if (keys['ArrowRight']) player.x += currentSpeed * dt;
            player.x = Math.max(0, Math.min(gCanvas.width - player.w, player.x));

            if (!ballLaunched) {
                ball.x = player.x + player.w / 2;
                ball.y = player.y - ball.r - 2;
            } else {
                ball.x += ball.dx * dt;
                ball.y += ball.dy * dt;

                // Wall Collisions
                if (ball.x + ball.r > gCanvas.width || ball.x - ball.r < 0) {
                    ball.dx *= -1;
                    ball.x = ball.x < ball.r ? ball.r : gCanvas.width - ball.r;
                }
                if (ball.y - ball.r < 0) {
                    ball.dy *= -1;
                    ball.y = ball.r;
                }
                if (ball.y + ball.r > gCanvas.height) gameOver();

                // Paddle Collision
                if (ball.y + ball.r > player.y && ball.x > player.x && ball.x < player.x + player.w) {
                    ball.dy *= -1;
                    ball.y = player.y - ball.r;
                    ball.dx = ((ball.x - (player.x + player.w / 2)) / (player.w / 2)) * 300;
                }

                // Brick Collisions
                let activeBricks = 0;
                bricks.forEach(b => {
                    if (b.status === 1) {
                        activeBricks++;
                        if (ball.x > b.x && ball.x < b.x + BRICK_W && ball.y > b.y && ball.y < b.y + BRICK_H) {
                            ball.dy *= -1;
                            b.status = 0;
                            gameScore += 20;
                            document.getElementById('game-stat-score').innerText = gameScore;
                            activeBricks--;
                        }
                    }
                });

                if (activeBricks === 0) {
                    gameLevel++;
                    document.getElementById('game-stat-level').innerText = gameLevel;
                    initBricks();
                    resetBall();
                }
            }
        } else if (gameMode === 'hockey') {
            // Air Hockey Physics
            const speed = 400;
            // P1 Controls (Arrows or Touch)
            if (keys['ArrowLeft']) p1.x -= speed * dt;
            if (keys['ArrowRight']) p1.x += speed * dt;
            if (keys['ArrowUp']) p1.y -= speed * dt;
            if (keys['ArrowDown']) p1.y += speed * dt;

            // P2 Controls (WASD or Bot)
            if (isMultiplayer) {
                if (keys['KeyA']) p2.x -= speed * dt;
                if (keys['KeyD']) p2.x += speed * dt;
                if (keys['KeyW']) p2.y -= speed * dt;
                if (keys['KeyS']) p2.y += speed * dt;
            } else {
                // Simple Bot Logic
                const targetPuck = pucks.reduce((prev, curr) => (curr.y < prev.y ? curr : prev), pucks[0]);
                if (targetPuck) {
                    if (p2.x < targetPuck.x) p2.x += speed * 0.7 * dt;
                    if (p2.x > targetPuck.x) p2.x -= speed * 0.7 * dt;
                    if (p2.y < 100) p2.y += speed * 0.5 * dt;
                    if (p2.y > 50) p2.y -= speed * 0.5 * dt;
                }
            }

            // Boundary Constraints
            p1.x = Math.max(p1.w/2, Math.min(gCanvas.width - p1.w/2, p1.x));
            p1.y = Math.max(gCanvas.height / 2 + p1.h/2, Math.min(gCanvas.height - p1.h/2, p1.y));
            p2.x = Math.max(p2.w/2, Math.min(gCanvas.width - p2.w/2, p2.x));
            p2.y = Math.max(p2.h/2, Math.min(gCanvas.height / 2 - p2.h/2, p2.y));

            // Chaos Mode Timer
            chaosTimer += dt;
            if (chaosTimer > 30) { 
                const count = pucks.length;
                spawnPuck(true); 
                // Launch the new pucks immediately if game is running
                if (!isGamePaused) {
                    for(let i=count; i<pucks.length; i++) {
                        pucks[i].dx = (Math.random() - 0.5) * 600;
                        pucks[i].dy = (Math.random() - 0.5) * 500;
                    }
                }
                chaosTimer = 0; 
            }

            for (let idx = pucks.length - 1; idx >= 0; idx--) {
                const p = pucks[idx];
                p.x += p.dx * dt;
                p.y += p.dy * dt;

                // Side Wall Bounces
                if (p.x < p.r) { p.dx = Math.abs(p.dx) * 1.1; p.x = p.r; }
                else if (p.x > gCanvas.width - p.r) { p.dx = -Math.abs(p.dx) * 1.1; p.x = gCanvas.width - p.r; }
                
                // Velocity Minimum (Prevent slow bugged pucks)
                if (Math.abs(p.dy) < 50 && !isGamePaused) p.dy = p.y > gCanvas.height/2 ? -100 : 100;

                // Top/Bottom Goal and Walls
                const goalWidth = 120;
                const goalStart = (gCanvas.width - goalWidth) / 2;
                const goalEnd = goalStart + goalWidth;

                if (p.y < p.r) {
                    if (p.x > goalStart && p.x < goalEnd) {
                        p1.score++; pucksPlayed++;
                        document.getElementById('game-stat-score').innerText = `${p1.score} - ${p2.score}`;
                        document.getElementById('game-stat-level').innerText = `Pucks: ${pucksPlayed}/20`;
                        p2.y = 40; pucks.splice(idx, 1);
                        if (pucksPlayed >= 20) { gameOver(); return; }
                        if (pucks.length === 0) { isGamePaused = true; spawnPuck(); showOverlay(`P1 SCORES! (${pucksPlayed}/20)`); }
                        continue;
                    } else {
                        p.dy *= -1.1; p.y = p.r; 
                    }
                } else if (p.y > gCanvas.height - p.r) {
                    if (p.x > goalStart && p.x < goalEnd) {
                        p2.score++; pucksPlayed++;
                        document.getElementById('game-stat-score').innerText = `${p1.score} - ${p2.score}`;
                        document.getElementById('game-stat-level').innerText = `Pucks: ${pucksPlayed}/20`;
                        p1.y = 460; pucks.splice(idx, 1);
                        if (pucksPlayed >= 20) { gameOver(); return; }
                        if (pucks.length === 0) { isGamePaused = true; spawnPuck(); showOverlay(`P2 SCORES! (${pucksPlayed}/20)`); }
                        continue;
                    } else {
                        p.dy *= -1.1; p.y = gCanvas.height - p.r;
                    }
                }

                // Paddle Collisions (Circle-Rect)
                [p1, p2].forEach(paddle => {
                    const closestX = Math.max(paddle.x - paddle.w/2, Math.min(p.x, paddle.x + paddle.w/2));
                    const padY = Math.max(paddle.y - paddle.h/2, Math.min(p.y, paddle.y + paddle.h/2));
                    const distance = Math.hypot(p.x - closestX, p.y - padY);

                    if (distance < p.r) {
                        p.dy *= -1.25; 
                        p.dx = ((p.x - paddle.x) / (paddle.w / 2)) * 500;
                        p.y = paddle.y > gCanvas.height/2 ? paddle.y - paddle.h/2 - p.r : paddle.y + paddle.h/2 + p.r;
                    }
                });
            }

            gameScore = p1.score * 1000;
            document.getElementById('game-stat-level').innerText = `Pucks: ${pucksPlayed}/20`;

            if (pucksPlayed >= 20) gameOver();
        }
    }

    gCtx.fillStyle = '#000'; gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);
        
        if (gameMode === 'pixel') {
            gCtx.fillStyle = 'rgba(255,255,255,0.03)';
            for(let i=0; i<gCanvas.height; i+=4) gCtx.fillRect(0, i, gCanvas.width, 1);
            if (gameLevel > 1) {
                const hue = (gameLevel * 40) % 360;
                gCtx.fillStyle = `hsla(${hue}, 70%, 10%, 0.15)`;
                gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);
                
                if (gameLevel > 3) {
                    gCtx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`;
                    for(let i=0; i<10; i++) gCtx.fillRect(0, Math.random() * gCanvas.height, gCanvas.width, 1);
                }
            }
            gCtx.fillStyle = '#2d2d2d'; roundRect(gCtx, player.x, player.y, player.w, player.h, 4, true);
            gCtx.fillStyle = shield > 0 ? '#fbbf24' : (getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8');
            gCtx.fillRect(player.x + 4, player.y + 4, 4, 4);
            if (Math.sin(timestamp/100) > 0) gCtx.fillRect(player.x + 10, player.y + 4, 4, 4);
            items.forEach((item) => {
                if (item.type === 'packet') { gCtx.fillStyle = '#22c55e'; gCtx.beginPath(); gCtx.arc(item.x + 8, item.y + 8, 6, 0, Math.PI * 2); gCtx.fill(); }
                else if (item.type === 'virus') { gCtx.fillStyle = '#f43f5e'; drawStar(gCtx, item.x + 8, item.y + 8, 8, 8, 4); }
                else if (item.type === 'firewall') { gCtx.fillStyle = '#38bdf8'; gCtx.fillRect(item.x, item.y + 4, 16, 8); }
                else if (item.type === 'kernel') { gCtx.fillStyle = '#fbbf24'; drawHex(gCtx, item.x + 8, item.y + 8, 8); }
                else if (item.type === 'pink') { gCtx.fillStyle = '#ff79c6'; gCtx.beginPath(); gCtx.arc(item.x + 8, item.y + 8, 8, 0, Math.PI * 2); gCtx.fill(); gCtx.fillStyle="#fff"; gCtx.fillRect(item.x + 6, item.y + 4, 4, 8); gCtx.fillRect(item.x + 4, item.y + 6, 8, 4); }
            });
        } else if (gameMode === 'brick') {
            // Render Brick Game
            gCtx.fillStyle = '#fff';
            roundRect(gCtx, player.x, player.y, player.w, player.h, 2, true);
            
            gCtx.fillStyle = '#fff';
            gCtx.beginPath();
            gCtx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
            gCtx.fill();

            bricks.forEach(b => {
                if (b.status === 1) {
                    gCtx.fillStyle = b.color;
                    roundRect(gCtx, b.x, b.y, BRICK_W, BRICK_H, 2, true);
                }
            });
        } else if (gameMode === 'hockey') {
            // Render Air Hockey
            // Center Line
            gCtx.strokeStyle = 'rgba(255,255,255,0.2)';
            gCtx.beginPath(); gCtx.moveTo(0, gCanvas.height/2); gCtx.lineTo(gCanvas.width, gCanvas.height/2); gCtx.stroke();
            
            // Walls and Goals
            const goalWidth = 120;
            const goalStart = (gCanvas.width - goalWidth) / 2;
            
            gCtx.fillStyle = 'rgba(255,255,255,0.1)';
            // Top Walls
            gCtx.fillRect(0, 0, goalStart, 5);
            gCtx.fillRect(goalStart + goalWidth, 0, goalStart, 5);
            // Bottom Walls
            gCtx.fillRect(0, gCanvas.height - 5, goalStart, 5);
            gCtx.fillRect(goalStart + goalWidth, gCanvas.height - 5, goalStart, 5);

            // Goal Glow
            gCtx.fillStyle = '#38bdf8';
            gCtx.fillRect(goalStart, 0, goalWidth, 2);
            gCtx.fillRect(goalStart, gCanvas.height - 2, goalWidth, 2);

            // Paddles
            gCtx.fillStyle = '#f43f5e';
            roundRect(gCtx, p1.x - p1.w/2, p1.y - p1.h/2, p1.w, p1.h, 4, true);
            gCtx.strokeStyle = '#fff'; gCtx.lineWidth = 1; gCtx.stroke();

            gCtx.fillStyle = '#fbbf24';
            roundRect(gCtx, p2.x - p2.w/2, p2.y - p2.h/2, p2.w, p2.h, 4, true);
            gCtx.strokeStyle = '#fff'; gCtx.lineWidth = 1; gCtx.stroke();

            // Pucks
            gCtx.fillStyle = '#fff';
            pucks.forEach(p => {
                gCtx.beginPath(); gCtx.arc(p.x, p.y, p.r, 0, Math.PI*2); gCtx.fill();
                // Tail effect
                gCtx.fillStyle = 'rgba(255,255,255,0.3)';
                gCtx.beginPath(); gCtx.arc(p.x - p.dx*0.05, p.y - p.dy*0.05, p.r*0.8, 0, Math.PI*2); gCtx.fill();
                gCtx.fillStyle = '#fff';
            });
        }
        if (isGameRunning) gameLoop = requestAnimationFrame(gameUpdateLoop);
    }

    document.getElementById('game-logout-btn').addEventListener('click', () => {
        commands.logout();
        stopPixelGame();
        printLine("Session terminated via Dashboard.", "error");
    });

    async function gameOver() {
        isGameRunning = false;
        const overlay = document.getElementById('game-overlay');
        overlay.classList.remove('hidden');
        overlay.querySelector('.game-msg-big').innerText = "SYSTEM CRASHED!";
        
        const sb = getSupabase();
        if (sb && currentPlayerId) {
            printLine("Syncing global record...");
            const { data } = await sb.from('game_scores').select('*').eq('player_id', currentPlayerId).eq('game_mode', gameMode).single();
            const newHistory = data ? [...(data.history || []), { score: gameScore, date: new Date().toISOString() }].slice(-5) : [{ score: gameScore, date: new Date().toISOString() }];
            const highScore = data ? Math.max(data.high_score, gameScore) : gameScore;
            
            await sb.from('game_scores').upsert({ 
                player_id: currentPlayerId, 
                game_mode: gameMode, 
                high_score: highScore, 
                history: newHistory,
                updated_at: new Date().toISOString()
            }, { onConflict: 'player_id, game_mode' });
        } else if (gameScore > guestHighScore) {
            guestHighScore = gameScore; localStorage.setItem('hasan_guest_score', guestHighScore);
        }

        setTimeout(() => {
            if (!isGameRunning) {
                overlay.querySelector('.game-msg-big').innerText = "REBOOT READY";
                overlay.querySelector('.game-controls').innerText = "PRESS SPACE TO RESTART";
            }
        }, 1500);
    }

    function roundRect(ctx, x, y, width, height, radius, fill) { ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + width - radius, y); ctx.quadraticCurveTo(x + width, y, x + width, y + radius); ctx.lineTo(x + width, y + height - radius); ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height); ctx.lineTo(x + radius, y + height); ctx.quadraticCurveTo(x, y + height, x, y + height - radius); ctx.lineTo(x, y + radius); ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath(); if (fill) ctx.fill(); else ctx.stroke(); }
    function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) { let rot = Math.PI / 2 * 3, x = cx, y = cy, step = Math.PI / spikes; ctx.beginPath(); ctx.moveTo(cx, cy - outerRadius); for (let i = 0; i < spikes; i++) { x = cx + Math.cos(rot) * outerRadius; y = cy + Math.sin(rot) * outerRadius; ctx.lineTo(x, y); rot += step; x = cx + Math.cos(rot) * innerRadius; y = cy + Math.sin(rot) * innerRadius; ctx.lineTo(x, y); rot += step; } ctx.lineTo(cx, cy - outerRadius); ctx.closePath(); ctx.fill(); }
    function drawHex(ctx, x, y, r) { ctx.beginPath(); for (let i = 0; i < 6; i++) { ctx.lineTo(x + r * Math.cos(i * Math.PI / 3), y + r * Math.sin(i * Math.PI / 3)); } ctx.closePath(); ctx.fill(); }

    window.addEventListener('keydown', gameKeyDown);
    window.addEventListener('keyup', gameKeyUp);
    gCanvas.addEventListener('touchstart', handleTouch);
    gCanvas.addEventListener('touchmove', handleTouch);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTerminal);
} else {
    initTerminal();
}
