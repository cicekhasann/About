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

document.addEventListener('DOMContentLoaded', () => {
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
    
    let currentUser = localStorage.getItem('hasan_user_name') || null;
    let currentPass = localStorage.getItem('hasan_user_pass') || null;
    let guestHighScore = parseInt(localStorage.getItem('hasan_guest_score')) || 0;

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
                                       
    [ SYSTEM: ONLINE | NODE: HASAN_PROD | VERSION: 5.6.1_STABLE ]
    [ Operator: ${currentUser || 'GUEST_EXPLOITER'} ]
    `;

    const commands = {
        'help': () => printHelp(),
        '?': () => printHelp(),
        'clear': () => { output.innerHTML = ''; },
        'exit': () => toggleTerminal(false),
        'register': async (args) => {
            if (currentUser) { printLine(`ACCESS DENIED: Linked to ${currentUser}.`, "error"); return; }
            if (!args[0] || !args[1]) { printLine("Usage: register [name] [password]", "error"); return; }
            const sb = getSupabase();
            if (!sb) { printLine("Database SDK not found.", "error"); return; }
            printLine("Registering...");
            const { error } = await sb.from('leaderboard').insert([{ name: args[0], passkey: args[1], score: 0, history: [] }]);
            if (error) printLine(`Error: ${error.message}`, "error");
            else {
                currentUser = args[0]; currentPass = args[1];
                localStorage.setItem('hasan_user_name', currentUser);
                localStorage.setItem('hasan_user_pass', currentPass);
                printLine(`Operator ${args[0]} registered & logged in.`, "success");
            }
        },
        'login': async (args) => {
            if (!args[0] || !args[1]) { printLine("Usage: login [name] [password]", "error"); return; }
            const sb = getSupabase();
            if (!sb) return;
            const { data, error } = await sb.from('leaderboard').select('*').eq('name', args[0]).eq('passkey', args[1]).single();
            if (error || !data) printLine("Invalid credentials.", "error");
            else {
                currentUser = data.name; currentPass = data.passkey;
                localStorage.setItem('hasan_user_name', currentUser);
                localStorage.setItem('hasan_user_pass', currentPass);
                printLine(`Welcome, ${currentUser}.`, "success");
            }
        },
        'leaderboard': async () => {
            printLine("FETCHING STANDINGS...", "cmd");
            const sb = getSupabase();
            if (!sb) return;
            const { data } = await sb.from('leaderboard').select('name, score').order('score', { ascending: false }).limit(10);
            if (data) data.forEach((row, i) => printLine(`${(i === 0) ? "👑 " : `${i+1}. `}${row.name.padEnd(15)} - ${row.score} pts`));
        },
        'game': () => startPixelGame(),
        'logout': () => {
            currentUser = null; currentPass = null;
            localStorage.removeItem('hasan_user_name');
            localStorage.removeItem('hasan_user_pass');
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
        printLine("AVAILABLE COMMANDS:", "cmd");
        Object.keys(commands).sort().forEach(c => printLine(`  ${c.padEnd(12)} - ${c} module`));
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
        window.addEventListener('keydown', gameKeyDown);
        window.addEventListener('keyup', gameKeyUp);
        gameLoop = requestAnimationFrame(gameUpdateLoop);
    }

    function stopPixelGame() { isGameRunning = false; cancelAnimationFrame(gameLoop); gameContainer.classList.add('hidden'); window.removeEventListener('keydown', gameKeyDown); window.removeEventListener('keyup', gameKeyUp); setTimeout(() => input.focus(), 100); }

    function gameKeyDown(e) { 
        if(e.code==='Space') {
            if (!isGameRunning) {
                startPixelGame(); // Restart fresh
            } else if (isGamePaused) {
                isGamePaused = false; 
                document.getElementById('game-overlay').classList.add('hidden'); 
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

            const spawnChance = (0.06 + (gameScore/6000) + (gameLevel * 0.01)) * (slowTime > 0 ? 0.6 : 1);
            if (Math.random() < spawnChance) {
                const rand = Math.random();
                let type = 'packet';
                if (rand < 0.12) type = 'virus';
                else if (rand < 0.16) type = 'firewall';
                else if (rand < 0.18) type = 'kernel';
                items.push({ x: Math.random() * (gCanvas.width - 20), y: -20, w: 16, h: 16, type });
            }

            items.forEach((item, i) => {
                let speed = (220 + (gameScore/12) + (gameLevel * 20)) * dt;
                if (slowTime > 0) speed *= 0.5;
                item.y += speed;
                if (item.x < player.x + player.w && item.x + item.w > player.x && item.y < player.y + player.h && item.y + item.h > player.y) {
                    if (item.type === 'packet') { gameScore += 10; document.getElementById('game-stat-score').innerText = gameScore; }
                    else if (item.type === 'firewall') slowTime = 5;
                    else if (item.type === 'kernel') shield = 4;
                    else if (item.type === 'virus') { if (shield <= 0) gameOver(); else shield = 0; }
                    items.splice(i, 1);
                }
                if (item.y > gCanvas.height) items.splice(i, 1);
            });
        }

        gCtx.fillStyle = '#000'; gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);
        gCtx.fillStyle = 'rgba(255,255,255,0.03)';
        for(let i=0; i<gCanvas.height; i+=4) gCtx.fillRect(0, i, gCanvas.width, 1);
        if (gameLevel > 1) {
            gCtx.fillStyle = `rgba(${gameLevel * 20}, 0, ${gameLevel * 10}, 0.05)`;
            gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);
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
        });
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
        if (sb && currentUser && currentPass) {
            printLine("Syncing global record...");
            const { data } = await sb.from('leaderboard').select('*').eq('name', currentUser).single();
            if (data) {
                const newHistory = [...(data.history || []), { score: gameScore, date: new Date().toISOString() }].slice(-5);
                await sb.from('leaderboard').update({ score: Math.max(data.score, gameScore), history: newHistory }).eq('name', currentUser).eq('passkey', currentPass);
            }
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
});
