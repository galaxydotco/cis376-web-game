/*
    CIS 376 - 01 ; Dr. Cumbie
    Jasmine Morgan
    4/13/2026
    Description: DoS Attack game clone 
*/

import { Storage } from './storage.js';

const config = { size: 6, timerMax: 30, arrows: ['↑', '→', '↓', '←'] };
let state = { grid: [], timeLeft: config.timerMax, isActive: false, timerInterval: null, hasMoved: false };

// --- 1. AUDIO LIBRARY ---
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

// Set default volumes
Object.values(sounds).forEach(s => s.volume = 0.3);

// --- 2. DOM CACHE ---
const statusDisplay = document.getElementById('status');
const timerDisplay = document.getElementById('timer');
const displayName = document.getElementById('display-name');
const highScoreEl = document.getElementById('high-score');
const leaderboardContainer = document.getElementById('global-leaderboard');

document.addEventListener('DOMContentLoaded', init);

function init() {
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
            div.innerHTML = `<span><span class="rank">#${index + 1}</span> ${entry.username.toUpperCase()}</span><span>${entry.score.toFixed(2)}s</span>`;
            leaderboardContainer.appendChild(div);
        });
    });

    if (displayName) displayName.innerText = Storage.getUser();

    const playerForm = document.getElementById('player-form');
    if (playerForm) {
        playerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('username');
            if (nameInput && nameInput.value.length >= 3) {
                Storage.saveUser(nameInput.value);
                if (displayName) displayName.innerText = nameInput.value;
                startNewGame();
            } else {
                playerForm.classList.add('was-validated');
            }
        });
    }

    const navReset = document.getElementById('nav-reset');
    if (navReset) {
        navReset.addEventListener('click', (e) => {
            e.preventDefault();
            startNewGame();
        });
    }
}

function startNewGame() {
    clearInterval(state.timerInterval);
    state.isActive = true;
    state.hasMoved = false; // Reset move tracker
    state.timeLeft = config.timerMax;

    document.body.classList.remove('theme-pink', 'theme-rainbow');

    const roll = Math.random();
    if (roll < 0.10) {
        document.body.classList.add('theme-pink');
        if (statusDisplay) statusDisplay.innerText = "OVERRIDE: CYBER-VIBE DETECTED";
        sounds.egg_pink.play().catch(() => {});
    } 
    else if (roll < 0.15) {
        document.body.classList.add('theme-rainbow');
        if (statusDisplay) statusDisplay.innerText = "CRITICAL GLITCH: SPECTRUM SHIFT";
        sounds.egg_rainbow.play().catch(() => {});
    } 
    else {
        if (statusDisplay) {
            statusDisplay.innerText = "SIGNAL TRACE ACTIVE";
            statusDisplay.style.color = "#00ff41";
        }
        sounds.start.play().catch(() => {});
    }

    state.timerInterval = setInterval(() => {
        state.timeLeft -= 0.01;
        if (timerDisplay) timerDisplay.innerText = state.timeLeft.toFixed(2) + "s";
        
        if (state.timeLeft <= 0) {
            clearInterval(state.timerInterval);
            state.isActive = false;
            sounds.fail.play().catch(() => {});
            if (statusDisplay) {
                statusDisplay.innerText = "CONNECTION TERMINATED";
                statusDisplay.style.color = "#ff0041";
            }
        }
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
        div.dataset.id = cell.id;
        if (cell.isBroken) div.classList.add('broken');
        if (cell.id === 35) div.classList.add('exit');
        div.innerText = config.arrows[cell.dir];

        div.onclick = (e) => {
            e.preventDefault();
            if (!state.isActive) return;
            
            state.hasMoved = true; // Player has interacted with the board

            if (cell.isBroken) {
                // Repair logic: only fix if path is touching it
                if (!div.classList.contains('active')) {
                    sounds.error.currentTime = 0;
                    sounds.error.play().catch(() => {});
                    return;
                }
                cell.isBroken = false;
                div.classList.remove('broken');
                sounds.clickUpDn.play().catch(() => {});
            } else {
                cell.dir = (cell.dir + 1) % 4;
                div.innerText = config.arrows[cell.dir];

                // Play sound based on arrow direction
                const s = (cell.dir === 0 || cell.dir === 2) ? sounds.clickUpDn : 
                          (cell.dir === 1) ? sounds.clickRight : sounds.clickLeft;
                s.currentTime = 0;
                s.play().catch(() => {});
            }
            updatePathTracing();
        };
        board.appendChild(div);
    });
}

function updatePathTracing() {
    const nodes = document.querySelectorAll('.node');
    if (!nodes.length || !statusDisplay || !state.isActive) return;

    nodes.forEach(n => n.classList.remove('active'));
    
    let currIdx = 0;
    let visited = new Set();
    let reachedEnd = false;

    while (currIdx !== null) {
        nodes[currIdx].classList.add('active');
        visited.add(currIdx);

        // Path stops visually if it hits a broken node
        if (state.grid[currIdx].isBroken) break;

        if (currIdx === 35) {
            reachedEnd = true;
            break; 
        }

        let x = currIdx % 6;
        let y = Math.floor(currIdx / 6);
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

    // WIN CONDITION: Reached exit AND 0 broken nodes remaining on board
    const brokenRemaining = state.grid.filter(c => c.isBroken).length;

    if (reachedEnd) {
        if (brokenRemaining === 0) {
            handleWin();
        } else {
            statusDisplay.innerText = `INCOMPLETE: ${brokenRemaining} NODES REQUIRE REPAIR`;
            statusDisplay.style.color = "#ffaa00";
            sounds.error.currentTime = 0;
            sounds.error.play().catch(() => {});
        }
    } else {
        if (statusDisplay.innerText.includes("INCOMPLETE")) {
            statusDisplay.innerText = "SIGNAL TRACE ACTIVE";
            statusDisplay.style.color = "#00ff41";
        }
    }
}

async function handleWin() {
    if (!state.isActive || !state.hasMoved) return;
    state.isActive = false;
    clearInterval(state.timerInterval);
    
    sounds.win.play().catch(() => {});
    statusDisplay.innerText = "ALL SYSTEMS RECOVERED - ACCESS GRANTED";
    statusDisplay.style.color = "#00ff41";

    const timeTaken = (config.timerMax - state.timeLeft).toFixed(2);
    await Storage.saveGlobalScore(Storage.getUser(), timeTaken);
}

window.noclip = () => {
    clearInterval(state.timerInterval);
    if (timerDisplay) timerDisplay.innerText = "INF";
    return "Cheat Engaged.";
};