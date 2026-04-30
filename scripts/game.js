/*
    CIS 376 - 01 ; Dr. Cumbie
    Jasmine Morgan
    4/13/2026
    Description: DoS Attack game clone 
*/

import { Storage } from './storage.js';

const config = { size: 6, timerMax: 30, arrows: ['↑', '→', '↓', '←'] };
let state = { grid: [], timeLeft: config.timerMax, isActive: false, timerInterval: null, hasMoved: false };

// --- 1. AUDIO LIBRARY (With pre-unlock logic) ---
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

// Global volume and preload
Object.values(sounds).forEach(s => { 
    s.volume = 0.3; 
    s.preload = 'auto'; 
});

// CRITICAL: This function "wakes up" audio on the first click
function unlockAudio() {
    Object.values(sounds).forEach(sound => {
        sound.play().then(() => {
            sound.pause();
            sound.currentTime = 0;
        }).catch(() => {/* Silent fail until user clicks */});
    });
}

const statusDisplay = document.getElementById('status');
const timerDisplay = document.getElementById('timer');
const displayName = document.getElementById('display-name');
const highScoreEl = document.getElementById('high-score');
const leaderboardContainer = document.getElementById('global-leaderboard');

document.addEventListener('DOMContentLoaded', init);

function init() {
    renderLeaderboard();
    if (displayName) displayName.innerText = Storage.getUser();

    const playerForm = document.getElementById('player-form');
    if (playerForm) {
        playerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            unlockAudio(); // Unlock on form submit
            const nameInput = document.getElementById('username');
            if (nameInput && nameInput.value.length >= 3) {
                Storage.saveUser(nameInput.value);
                if (displayName) displayName.innerText = nameInput.value;
                startNewGame();
            }
        });
    }

    const navReset = document.getElementById('nav-reset');
    if (navReset) {
        navReset.addEventListener('click', (e) => { 
            e.preventDefault(); 
            unlockAudio(); // Unlock on reset click
            startNewGame(); 
        });
    }
}

function renderLeaderboard(newBestId = null) {
    Storage.getGlobalLeaderboard((scores) => {
        if (!leaderboardContainer) return;
        leaderboardContainer.innerHTML = '';
        if (scores.length === 0) {
            leaderboardContainer.innerHTML = '<div class="text-center">NO DATA FOUND</div>';
            return;
        }
        if (highScoreEl && scores[0]) {
            highScoreEl.innerText = `${scores[0].score}s (${scores[0].username})`;
        }
        scores.forEach((entry, index) => {
            const div = document.createElement('div');
            div.className = 'entry';
            if (index === 0) div.classList.add('top-record-glow'); 
            div.innerHTML = `<span><span class="rank">#${index + 1}</span> ${entry.username.toUpperCase()}</span><span>${entry.score.toFixed(2)}s</span>`;
            leaderboardContainer.appendChild(div);
        });
    });
}

function startNewGame() {
    clearInterval(state.timerInterval);
    state.isActive = true;
    state.hasMoved = false;
    state.timeLeft = config.timerMax;

    document.body.classList.remove('theme-pink', 'theme-rainbow');
    const roll = Math.random();
    
    // Play Start Sounds Based on Mode
    if (roll < 0.10) {
        document.body.classList.add('theme-pink');
        if (statusDisplay) statusDisplay.innerText = "OVERRIDE: CYBER-VIBE DETECTED";
        sounds.egg_pink.currentTime = 0;
        sounds.egg_pink.play().catch(e => console.log("Audio Blocked:", e));
    } else if (roll < 0.15) {
        document.body.classList.add('theme-rainbow');
        if (statusDisplay) statusDisplay.innerText = "CRITICAL GLITCH: SPECTRUM SHIFT";
        sounds.egg_rainbow.currentTime = 0;
        sounds.egg_rainbow.play().catch(e => console.log("Audio Blocked:", e));
    } else {
        if (statusDisplay) {
            statusDisplay.innerText = "SIGNAL TRACE ACTIVE";
            statusDisplay.style.color = "#00ff41";
        }
        sounds.start.currentTime = 0;
        sounds.start.play().catch(e => console.log("Audio Blocked:", e));
    }

    state.timerInterval = setInterval(() => {
        state.timeLeft -= 0.01;
        if (timerDisplay) timerDisplay.innerText = state.timeLeft.toFixed(2) + "s";
        if (state.timeLeft <= 0) handleGameOver();
    }, 10);

    buildLevel();
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
                    sounds.error.play().catch(() => {});
                    return;
                }
                cell.isBroken = false;
                div.classList.remove('broken');
                sounds.clickUpDn.currentTime = 0;
                sounds.clickUpDn.play().catch(() => {});
            } else {
                cell.dir = (cell.dir + 1) % 4;
                div.innerText = config.arrows[cell.dir];
                const s = (cell.dir === 0 || cell.dir === 2) ? sounds.clickUpDn : 
                          (cell.dir === 1) ? sounds.clickRight : sounds.clickLeft;
                s.currentTime = 0;
                s.play().catch(() => {});
            }
            
            requestAnimationFrame(() => updatePathTracing());
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
    if (reachedEnd && brokenRemaining === 0) {
        handleWin();
    } else if (reachedEnd && brokenRemaining > 0) {
        // Trigger error sound if they hit the exit but nodes are still broken
        sounds.error.currentTime = 0;
        sounds.error.play().catch(() => {});
        statusDisplay.innerText = `INCOMPLETE: ${brokenRemaining} NODES REMAIN`;
        statusDisplay.style.color = "#ffaa00";
    }
}

async function handleWin() {
    if (!state.isActive) return;
    state.isActive = false;
    clearInterval(state.timerInterval);
    
    sounds.win.currentTime = 0;
    sounds.win.play().catch(() => {});

    const timeTaken = parseFloat((config.timerMax - state.timeLeft).toFixed(2));
    
    Storage.getGlobalLeaderboard(async (scores) => {
        const totalPlayers = scores.length;
        const slowerPlayers = scores.filter(s => s.score > timeTaken).length;
        const percentile = totalPlayers > 0 ? ((slowerPlayers / totalPlayers) * 100).toFixed(0) : 100;

        statusDisplay.innerText = `ACCESS GRANTED: TOP ${100 - percentile}% SPEED`;
        statusDisplay.style.color = "#00ff41";

        await Storage.saveGlobalScore(Storage.getUser(), timeTaken);
        renderLeaderboard();
    });
}

function handleGameOver() {
    state.isActive = false;
    clearInterval(state.timerInterval);
    sounds.fail.currentTime = 0;
    sounds.fail.play().catch(() => {});
    statusDisplay.innerText = "CONNECTION TERMINATED";
    statusDisplay.style.color = "#ff0041";
}