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
    state.timeLeft = config.timerMax;

    // 1. Reset Themes
    document.body.classList.remove('theme-pink', 'theme-rainbow');

    // 2. Roll for Easter Egg and Play Start Sound
    const roll = Math.random();
    if (roll < 0.10) {
        document.body.classList.add('theme-pink');
        if (statusDisplay) statusDisplay.innerText = "OVERRIDE: CYBER-VIBE DETECTED";
        if (sounds.egg_pink) sounds.egg_pink.play(); 
    } 
    else if (roll < 0.15) {
        document.body.classList.add('theme-rainbow');
        if (statusDisplay) statusDisplay.innerText = "CRITICAL GLITCH: SPECTRUM SHIFT";
        if (sounds.egg_rainbow) sounds.egg_rainbow.play();
    } 
    else {
        if (statusDisplay) {
            statusDisplay.innerText = "SIGNAL TRACE ACTIVE";
            statusDisplay.style.color = "#00ff41";
        }
        if (sounds.start) sounds.start.play();
    }

    // 3. Start the Clock
    state.timerInterval = setInterval(() => {
        state.timeLeft -= 0.01;
        if (timerDisplay) timerDisplay.innerText = state.timeLeft.toFixed(2) + "s";
        
        if (state.timeLeft <= 0) {
            clearInterval(state.timerInterval);
            state.isActive = false;
            if (sounds.fail) sounds.fail.play();
            if (statusDisplay) {
                statusDisplay.innerText = "CONNECTION TERMINATED";
                statusDisplay.style.color = "#ff0041";
            }
        }
    }, 10);

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
                // Bypass Prevention: Only repair if the path currently reaches this node
                if (!div.classList.contains('active')) {
                    if (sounds.error) sounds.error.play();
                    if (statusDisplay) {
                        statusDisplay.innerText = "SYSTEM LINK REQUIRED FOR REPAIR";
                        statusDisplay.style.color = "#ff0041";
                    }
                    return; 
                }
                cell.isBroken = false;
                div.classList.remove('broken');
            } else {
                cell.dir = (cell.dir + 1) % 4;
                div.innerText = config.arrows[cell.dir];

                // Directional Sounds
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

    // 1. Reset visual path
    nodes.forEach(n => n.classList.remove('active'));
    
    let currIdx = 0;
    let visited = new Set();
    let isBlocked = false;

    // 2. Trace the signal from the start (Index 0)
    while (currIdx !== null) {
        nodes[currIdx].classList.add('active');
        visited.add(currIdx);

        // If the path hits a broken node, stop immediately
        if (state.grid[currIdx].isBroken) {
            isBlocked = true;
            if (statusDisplay.innerText !== "SIGNAL BLOCKED: REPAIR REQUIRED") {
                if (sounds.error) sounds.error.play();
                statusDisplay.innerText = "SIGNAL BLOCKED: REPAIR REQUIRED";
                statusDisplay.style.color = "#ff0041";
            }
            break; 
        }

        // 3. WIN CHECK: If we hit the exit (Index 35) and didn't hit a break
        if (currIdx === 35 && !isBlocked) {
            // We only trigger the win if the timer has actually started
            if (state.timeLeft < config.timerMax) {
                handleWin();
            }
            return; // Exit function so we don't overwrite the "RECOVERED" text
        }

        // 4. Calculate Next Move
        let x = currIdx % 6;
        let y = Math.floor(currIdx / 6);
        let direction = state.grid[currIdx].dir;

        // 0: ↑, 1: →, 2: ↓, 3: ←
        if (direction === 0) y--;
        else if (direction === 1) x++;
        else if (direction === 2) y++;
        else if (direction === 3) x--;

        // Boundary Check (If path goes off-screen)
        if (x < 0 || x >= 6 || y < 0 || y >= 6) {
            if (statusDisplay) {
                statusDisplay.innerText = "SIGNAL LOST: OUT OF BOUNDS";
                statusDisplay.style.color = "#ffaa00";
            }
            break;
        }

        let nextIdx = y * 6 + x;

        // Loop prevention (If the path circles back on itself)
        if (visited.has(nextIdx)) {
            if (statusDisplay) {
                statusDisplay.innerText = "SIGNAL LOOP DETECTED";
                statusDisplay.style.color = "#ffaa00";
            }
            break;
        }

        currIdx = nextIdx;
    }
}

async function handleWin() {
    if (!state.isActive || state.timeLeft >= config.timerMax) return;

    if (sounds.win) sounds.win.play();
    state.isActive = false;
    clearInterval(state.timerInterval);

    const timeTaken = (config.timerMax - state.timeLeft).toFixed(2);
    const username = Storage.getUser();

    if (statusDisplay) {
        statusDisplay.innerText = "ALL SYSTEMS RECOVERED - ACCESS GRANTED";
        statusDisplay.style.color = "#00ff41";
    }

    await Storage.saveGlobalScore(username, timeTaken);
}

window.noclip = () => {
    clearInterval(state.timerInterval);
    if (timerDisplay) timerDisplay.innerText = "INF";
    return "Cheat Engaged.";
};