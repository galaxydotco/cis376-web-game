/*
    CIS 376 - 01 ; Dr. Cumbie
    Jasmine Morgan
    4/13/2026
    Description: DoS Attack game clone 
*/

/**
 * GAME.JS - Terminal_V3.0 Core Logic
 * Handles game initialization, search filtering, and win-state calculations.
 */

import { Storage } from './storage.js';
import { runBootSequence } from './boot.js';

const config = { size: 6, timerMax: 30, arrows: ['↑', '→', '↓', '←'] };
let state = { grid: [], timeLeft: config.timerMax, isActive: false, timerInterval: null, hasMoved: false, startTime: null };

const sounds = {
    egg_pink: new Audio('assets/pink_spawn.mp3'),
    egg_rainbow: new Audio('assets/rainbow_spawn.mp3'),
    start: new Audio('assets/start.mp3'),
    win: new Audio('assets/win.mp3'),
    fail: new Audio('assets/fail.mp3'),
    error: new Audio('assets/error.mp3'),
    clickUpDn: new Audio('assets/click_up_down.mp3'),
    clickLeft: new Audio('assets/click_left.mp3'),
    clickRight: new Audio('assets/click_right.mp3')
};

Object.values(sounds).forEach(s => { s.volume = 0.3; s.preload = 'auto'; });

function unlockAudio() {
    Object.values(sounds).forEach(sound => {
        sound.muted = true;
        sound.play().then(() => {
            sound.pause();
            sound.muted = false;
            sound.currentTime = 0;
        }).catch(() => { });
    });
}

const statusDisplay = document.getElementById('status');
const timerDisplay = document.getElementById('timer');
const displayName = document.getElementById('display-name');
const highScoreEl = document.getElementById('high-score');
const leaderboardContainer = document.getElementById('global-leaderboard');

document.addEventListener('DOMContentLoaded', init);

 async function init() {
    await runBootSequence();

    renderLeaderboard();
    if (displayName) displayName.innerText = Storage.getUser();

    const playerForm = document.getElementById('player-form');
    if (playerForm) {
        playerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            unlockAudio();
            const nameInput = document.getElementById('username');
            if (nameInput && nameInput.value.length >= 3) {
                Storage.saveUser(nameInput.value);
                if (displayName) displayName.innerText = nameInput.value;
                setTimeout(startNewGame, 100);
            }
        });
    }

    const navReset = document.getElementById('nav-reset');
    if (navReset) {
        navReset.addEventListener('click', (e) => {
            e.preventDefault();
            unlockAudio();
            setTimeout(startNewGame, 50);
        });
    }

    // --- EXPAND BUTTON LOGIC (KEEP IT HERE) ---
    const expandBtn = document.getElementById('expand-leaderboard-btn');
    const container = document.getElementById('global-leaderboard');

    if (expandBtn && container) {
        expandBtn.onclick = (e) => {
            e.preventDefault();
            container.classList.toggle('expanded');

            if (container.classList.contains('expanded')) {
                expandBtn.innerText = '[-] COLLAPSE ARCHIVE';
                sounds.clickUpDn.currentTime = 0;
                sounds.clickUpDn.play().catch(() => { });
            } else {
                expandBtn.innerText = '[+] EXPAND ARCHIVE';
                sounds.clickLeft.currentTime = 0;
                sounds.clickLeft.play().catch(() => { });
            }
        };
    }
}

function renderLeaderboard(newScoreIndex = null) {
    Storage.getGlobalLeaderboard((scores) => {
        if (!leaderboardContainer) return;

        const currentUser = Storage.getUser();
        // This clears the "LOADING DATA..." text immediately
        leaderboardContainer.innerHTML = '';

        if (!scores || scores.length === 0) {
            leaderboardContainer.innerHTML = '<div class="text-center">NO ARCHIVES FOUND</div>';
            return;
        }

        if (highScoreEl && scores[0]) {
            highScoreEl.innerText = `${scores[0].score.toFixed(2)}s (${scores[0].username})`;
        }

        scores.forEach((entry, index) => {
            const div = document.createElement('div');
            div.className = 'entry d-flex justify-content-between p-1';

            // Highlight current user
            if (entry.username === currentUser) {
                div.classList.add('user-score-highlight');
                div.style.backgroundColor = 'rgba(0, 255, 65, 0.1)';
            }

            // Highlight the brand new score
            if (index === newScoreIndex) {
                div.classList.add('new-score-highlight');
            }

            div.innerHTML = `
                <span>
                    <span class="rank" style="opacity: 0.5;">#${index + 1}</span> 
                    ${entry.username.toUpperCase()}
                </span>
                <span class="fw-bold">${parseFloat(entry.score).toFixed(2)}s</span>
            `;
            leaderboardContainer.appendChild(div);
        });
    });
}

// --- MERGED & FIXED START FUNCTION ---
async function startNewGame() {
    clearInterval(state.timerInterval);
    state.isActive = true;
    state.hasMoved = false;
    state.timeLeft = config.timerMax;

    // 1. Set the Esports-grade Absolute Start Time
    state.startTime = Date.now();

    // 2. Theme & Easter Egg Selection
    document.body.classList.remove('theme-pink', 'theme-rainbow');
    const roll = Math.random();

    let startSound = sounds.start;
    if (roll < 0.10) {
        document.body.classList.add('theme-pink');
        if (statusDisplay) statusDisplay.innerText = "OVERRIDE: CYBER-VIBE DETECTED";
        startSound = sounds.egg_pink;
    } else if (roll < 0.15) {
        document.body.classList.add('theme-rainbow');
        if (statusDisplay) statusDisplay.innerText = "CRITICAL GLITCH: SPECTRUM SHIFT";
        startSound = sounds.egg_rainbow;
    } else {
        if (statusDisplay) {
            statusDisplay.innerText = "SIGNAL TRACE ACTIVE";
            statusDisplay.style.color = "#00ff41";
        }
    }

    // 3. Play the Audio
    try {
        startSound.currentTime = 0;
        await startSound.play();
    } catch (e) { console.warn("Audio blocked or not loaded"); }

    // 4. Start the Bulletproof Timer
    state.timerInterval = setInterval(() => {
        const now = Date.now();
        const elapsedSeconds = (now - state.startTime) / 1000;
        state.timeLeft = config.timerMax - elapsedSeconds;

        if (timerDisplay) {
            const displayTime = Math.max(0, state.timeLeft).toFixed(2);
            timerDisplay.innerText = displayTime + "s";
        }

        if (state.timeLeft <= 0) handleGameOver();
    }, 10);

    // 5. Build the Board
    requestAnimationFrame(() => {
        buildLevel();
    });
}

function buildLevel() {
    const board = document.getElementById('game-board');
    if (!board) return;
    state.grid = [];
    board.innerHTML = '';
    for (let i = 0; i < 36; i++) {
        state.grid.push({
            id: i,
            dir: Math.floor(Math.random() * 4),
            isBroken: Math.random() > 0.7 && i !== 0 && i !== 35
        });
    }
    renderBoard(board);
    updatePathTracing();
}

function renderBoard(board) {
    state.grid.forEach(cell => {
        const div = document.createElement('div');
        div.className = 'node';
        if (cell.isBroken) div.classList.add('broken');
        if (cell.id === 35) div.classList.add('exit');
        div.innerText = config.arrows[cell.dir];

        div.onclick = (e) => {
            e.preventDefault();
            if (!state.isActive) return;
            state.hasMoved = true;

            if (cell.isBroken) {
                if (!div.classList.contains('active')) {
                    sounds.error.currentTime = 0;
                    sounds.error.play().catch(() => { });
                    return;
                }
                cell.isBroken = false;
                div.classList.remove('broken');
                sounds.clickUpDn.currentTime = 0;
                sounds.clickUpDn.play().catch(() => { });
            } else {
                cell.dir = (cell.dir + 1) % 4;
                div.innerText = config.arrows[cell.dir];
                const s = (cell.dir === 0 || cell.dir === 2) ? sounds.clickUpDn :
                    (cell.dir === 1) ? sounds.clickRight : sounds.clickLeft;
                s.currentTime = 0;
                s.play().catch(() => { });
            }
            updatePathTracing();
        };
        board.appendChild(div);
    });
}

function updatePathTracing() {
    const nodes = document.querySelectorAll('.node');
    if (!nodes.length || !state.isActive) return;

    nodes.forEach(n => n.classList.remove('active'));
    let currIdx = 0;
    let visited = new Set();
    let reachedEnd = false;

    while (currIdx !== null) {
        nodes[currIdx].classList.add('active');
        visited.add(currIdx);
        if (state.grid[currIdx].isBroken) break;
        if (currIdx === 35) { reachedEnd = true; break; }

        let x = currIdx % 6, y = Math.floor(currIdx / 6);
        let direction = state.grid[currIdx].dir;

        if (direction === 0) y--;
        else if (direction === 1) x++;
        else if (direction === 2) y++;
        else if (direction === 3) x--;

        if (x < 0 || x >= 6 || y < 0 || y >= 6) break;
        let nextIdx = y * 6 + x;
        if (visited.has(nextIdx)) break;
        currIdx = nextIdx;
    }

    const brokenRemaining = state.grid.filter(c => c.isBroken).length;

    if (!reachedEnd && statusDisplay.innerText.includes("INCOMPLETE")) {
        statusDisplay.innerText = "SIGNAL TRACE ACTIVE";
        statusDisplay.style.color = "#00ff41";
    }

    if (reachedEnd) {
        if (brokenRemaining === 0) {
            handleWin();
        } else {
            statusDisplay.innerText = `INCOMPLETE: ${brokenRemaining} NODES REMAINING`;
            statusDisplay.style.color = "#ffaa00";
            sounds.error.currentTime = 0;
            sounds.error.play().catch(() => { });
        }
    }
}

async function handleWin() {
    if (!state.isActive) return;
    state.isActive = false;
    clearInterval(state.timerInterval);

    const finalTime = Date.now();
    const timeTaken = Number(((finalTime - state.startTime) / 1000).toFixed(2));

    sounds.win.currentTime = 0;
    sounds.win.play().catch(() => { });

    await Storage.saveGlobalScore(Storage.getUser(), timeTaken);

    // 1. Notice the 'await' added here to get the actual number
    const totalEntries = await Storage.getTotalCount(); 
    
    Storage.getGlobalLeaderboard((scores) => {
        let myRank = 1;

        if (Array.isArray(scores)) {
            for (let i = 0; i < scores.length; i++) {
                if (Number(scores[i].score) < timeTaken) {
                    myRank++;
                }
            }
        }

        // 2. Add a fallback (|| 1) to prevent dividing by zero
        let rawPercent = (myRank / (totalEntries || 1)) * 100;
        let topPercent = Math.ceil(rawPercent);

        if (myRank === 1) topPercent = 1;
        
        // 3. Final safety check: if math fails, default to 100 instead of NaN
        if (isNaN(topPercent)) topPercent = 100;

        statusDisplay.innerText = `ACCESS GRANTED: TOP ${topPercent}% SPEED`;
        statusDisplay.style.color = "#00ff41";

        renderLeaderboard(myRank - 1);
    });
}

function handleGameOver() {
    state.isActive = false;
    clearInterval(state.timerInterval);
    sounds.fail.currentTime = 0;
    sounds.fail.play().catch(() => { });
    statusDisplay.innerText = "CONNECTION TERMINATED";
    statusDisplay.style.color = "#ff0041";
}