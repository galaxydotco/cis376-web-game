/*
    CIS 376 - 01 ; Dr. Cumbie
    Jasmine Morgan
    4/13/2026
    Description: DoS Attack game clone 
*/

import { Storage } from './storage.js';

const config = { size: 6, timerMax: 30, arrows: ['↑', '→', '↓', '←'] };
let state = { grid: [], timeLeft: config.timerMax, isActive: false, timerInterval: null };

// --- 1. AUDIO LIBRARY ---
const sounds = {
    start: new Audio('assets/start.mp3'),
    win: new Audio('assets/win.mp3'),
    fail: new Audio('assets/fail.mp3'),
    error: new Audio('assets/error.mp3'), // <-- Ensure there is a comma here
    clickUpDn: new Audio('assets/click_up_down.mp3'),
    clickLeft: new Audio('assets/click_left.mp3'),
    clickRight: new Audio('assets/click_right.mp3') // Last one doesn't need a comma
};

// Set volumes (optional)
Object.values(sounds).forEach(s => s.volume = 0.3);

// --- 2. GLOBAL DOM CACHE ---
const statusDisplay = document.getElementById('status');
const timerDisplay = document.getElementById('timer');
const displayName = document.getElementById('display-name');
const highScoreEl = document.getElementById('high-score');
const leaderboardContainer = document.getElementById('global-leaderboard');

document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    playerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('username');
        if (nameInput && nameInput.value.length >= 3) {
            sounds.start.play(); // PLAY START SOUND
            Storage.saveUser(nameInput.value);
            if (displayName) displayName.innerText = nameInput.value;
            startNewGame();
        }
        // ...
    });

    // Fetch Global Leaderboard
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
            div.innerHTML = `
                <span><span class="rank">#${index + 1}</span> ${entry.username.toUpperCase()}</span>
                <span>${entry.score.toFixed(2)}s</span>
            `;
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
    // 1. Reset state
    clearInterval(state.timerInterval);
    state.isActive = true;
    state.timeLeft = config.timerMax;

    // 2. Start Timer
    state.timerInterval = setInterval(() => {
        state.timeLeft -= 0.01;
        if (timerDisplay) timerDisplay.innerText = state.timeLeft.toFixed(2) + "s";

        if (state.timeLeft <= 0) {
            clearInterval(state.timerInterval);
            state.isActive = false;

            // --- PLAY FAIL SOUND HERE ---
            sounds.fail.play();

            if (statusDisplay) {
                statusDisplay.innerText = "CONNECTION TERMINATED";
                statusDisplay.style.color = "#ff0041";
            }
        }
    }, 10);

    // 3. Handle Easter Eggs (Apply themes before building the board)
    document.body.classList.remove('theme-pink', 'theme-rainbow');
    const roll = Math.random();
    if (roll < 0.10) {
        document.body.classList.add('theme-pink');
        if (statusDisplay) statusDisplay.innerText = "OVERRIDE: CYBER-VIBE DETECTED";
    } else if (roll < 0.15) {
        document.body.classList.add('theme-rainbow');
        if (statusDisplay) statusDisplay.innerText = "CRITICAL GLITCH: SPECTRUM SHIFT";
    } else {
        if (statusDisplay) {
            statusDisplay.innerText = "SIGNAL TRACE ACTIVE";
            statusDisplay.style.color = "#00ff41";
        }
    }

    // 4. Build Board and Trace Initial Path (ONLY ONCE)
    buildLevel();
    updatePathTracing();
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

            if (cell.isBroken) {
                if (!div.classList.contains('active')) {
                    sounds.error.play(); // PLAY ERROR SOUND (Link required)
                    // ... repair block logic
                    return;
                }
                cell.isBroken = false;
                div.classList.remove('broken');
            } else {
                cell.dir = (cell.dir + 1) % 4;
                div.innerText = config.arrows[cell.dir];

                // DIRECTIONAL SOUND LOGIC
                // 0: ↑, 1: →, 2: ↓, 3: ←
                if (cell.dir === 0 || cell.dir === 2) {
                    sounds.clickUpDn.currentTime = 0;
                    sounds.clickUpDn.play();
                } else if (cell.dir === 1) {
                    sounds.clickRight.currentTime = 0;
                    sounds.clickRight.play();
                } else if (cell.dir === 3) {
                    sounds.clickLeft.currentTime = 0;
                    sounds.clickLeft.play();
                }
            }
            updatePathTracing();
        };
        board.appendChild(div);
    });
    updatePathTracing();
}

function updatePathTracing() {
    const nodes = document.querySelectorAll('.node');
    if (!nodes.length || !statusDisplay) return;

    nodes.forEach(n => n.classList.remove('active'));
    let currIdx = 0;
    let visited = new Set();

    while (currIdx !== null) {
        nodes[currIdx].classList.add('active');

        // --- THE WIN CHECK ---
        if (currIdx === 35) {
            // We only trigger the win if the timer has actually started (to prevent 0.00s)
            if (state.timeLeft < config.timerMax) {
                handleWin();
            }
            return;
        }

        // If the path hits a broken node, it stops here.
        // This is why "Active-Only Repair" works—the path "stops" on the broken node,
        // making it 'active' so the player can fix it.
        if (state.grid[currIdx].isBroken) {
            if (statusDisplay) {
                // Only play the error sound if the message wasn't already showing
                // This prevents the sound from "machine-gunning" every time the path updates
                if (statusDisplay.innerText !== "SIGNAL BLOCKED: REPAIR REQUIRED") {
                    sounds.error.play();
                }
                statusDisplay.innerText = "SIGNAL BLOCKED: REPAIR REQUIRED";
                statusDisplay.style.color = "#ff0041";
            }
            break;
        }

        visited.add(currIdx);
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
}

async function handleWin() {
    // If the game isn't active or the timer hasn't even started, ignore the win
    if (!state.isActive || state.timeLeft >= config.timerMax) return;

    sounds.win.play(); // PLAY WIN SOUND
    state.isActive = false;
    clearInterval(state.timerInterval);

    const timeTaken = (config.timerMax - state.timeLeft).toFixed(2);
    const username = Storage.getUser();

    // Show win message immediately so the user sees they won
    if (statusDisplay) {
        statusDisplay.innerText = "ALL SYSTEMS RECOVERED - ACCESS GRANTED";
        statusDisplay.style.color = "#00ff41";
    }

    // Save to Firebase in the background
    await Storage.saveGlobalScore(username, timeTaken);
}

// Console Easter Egg
window.noclip = () => {
    clearInterval(state.timerInterval);
    if (timerDisplay) timerDisplay.innerText = "INF";
    return "Cheat Engaged.";
};