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

    document.body.classList.remove('theme-pink', 'theme-rainbow');

    const roll = Math.random();
    if (roll < 0.10) {
        document.body.classList.add('theme-pink');
        if (statusDisplay) statusDisplay.innerText = "OVERRIDE: CYBER-VIBE DETECTED";
        if (sounds.egg_pink) sounds.egg_pink.play().catch(() => {}); 
    } 
    else if (roll < 0.15) {
        document.body.classList.add('theme-rainbow');
        if (statusDisplay) statusDisplay.innerText = "CRITICAL GLITCH: SPECTRUM SHIFT";
        if (sounds.egg_rainbow) sounds.egg_rainbow.play().catch(() => {});
    } 
    else {
        if (statusDisplay) {
            statusDisplay.innerText = "SIGNAL TRACE ACTIVE";
            statusDisplay.style.color = "#00ff41";
        }
        if (sounds.start) sounds.start.play().catch(() => {});
    }

    state.timerInterval = setInterval(() => {
        state.timeLeft -= 0.01;
        if (timerDisplay) timerDisplay.innerText = state.timeLeft.toFixed(2) + "s";
        
        if (state.timeLeft <= 0) {
            clearInterval(state.timerInterval);
            state.isActive = false;
            if (sounds.fail) sounds.fail.play().catch(() => {});
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

            if (cell.isBroken) {
                // IMPORTANT: We only allow repair if the path is currently touching it
                if (!div.classList.contains('active')) return; 
                
                cell.isBroken = false;
                div.classList.remove('broken');
                // We update tracing immediately after the state change
            } else {
                cell.dir = (cell.dir + 1) % 4;
                div.innerText = config.arrows[cell.dir];

                if (cell.dir === 0 || cell.dir === 2) {
                    sounds.clickUpDn.currentTime = 0;
                    sounds.clickUpDn.play().catch(() => {});
                } else if (cell.dir === 1) {
                    sounds.clickRight.currentTime = 0;
                    sounds.clickRight.play().catch(() => {});
                } else if (cell.dir === 3) {
                    sounds.clickLeft.currentTime = 0;
                    sounds.clickLeft.play().catch(() => {});
                }
            }
            updatePathTracing();
        };
        board.appendChild(div);
    });
}

function updatePathTracing() {
    const nodes = document.querySelectorAll('.node');
    if (!nodes.length || !statusDisplay || !state.isActive) return;

    // 1. Clear previous visual path
    nodes.forEach(n => n.classList.remove('active'));
    
    let currIdx = 0;
    let visited = new Set();
    let reachedEnd = false;

    // 2. Trace the signal
    while (currIdx !== null) {
        // If we hit a broken node, the "active" green line stops HERE.
        if (state.grid[currIdx].isBroken) {
            nodes[currIdx].classList.add('active'); // Light it up so player can click to fix
            break; 
        }

        nodes[currIdx].classList.add('active');
        visited.add(currIdx);

        // Check if we reached the exit
        if (currIdx === 35) {
            reachedEnd = true;
            break; 
        }

        // Calculate next movement
        let x = currIdx % 6;
        let y = Math.floor(currIdx / 6);
        let direction = state.grid[currIdx].dir;

        if (direction === 0) y--;      // Up
        else if (direction === 1) x++; // Right
        else if (direction === 2) y++; // Down
        else if (direction === 3) x--; // Left

        if (x < 0 || x >= 6 || y < 0 || y >= 6) break;
        
        let nextIdx = y * 6 + x;
        if (visited.has(nextIdx)) break; // Loop protection
        
        currIdx = nextIdx;
    }

    // 3. THE FINAL VERIFICATION
    // Count every node on the board that is NOT broken (the "Required" nodes)
    const requiredNodes = state.grid.filter(cell => !cell.isBroken).length;
    // Count how many nodes our green path actually successfully visited
    const pathCount = visited.size;

    if (reachedEnd) {
        if (pathCount === requiredNodes) {
            // SUCCESS: Every single empty node is now green and we are at the exit
            handleWin();
        } else {
            // FAILURE: You touched the exit, but missed some nodes.
            if (!statusDisplay.innerText.includes("INCOMPLETE")) {
                if (sounds.error) {
                    sounds.error.currentTime = 0;
                    sounds.error.play().catch(() => {});
                }
                // Tell the player exactly how many nodes are missing
                const missing = requiredNodes - pathCount;
                statusDisplay.innerText = `INCOMPLETE CIRCUIT: ${missing} NODE(S) MISSING`;
                statusDisplay.style.color = "#ffaa00";
            }
        }
    } else {
        // Silent reset of the status message if the path is moved away from the exit
        if (state.isActive && statusDisplay.innerText.includes("INCOMPLETE")) {
            statusDisplay.innerText = "SIGNAL TRACE ACTIVE";
            statusDisplay.style.color = "#00ff41";
        }
    }
}

function updatePathTracing() {
    const nodes = document.querySelectorAll('.node');
    if (!nodes.length || !statusDisplay || !state.isActive) return;

    // 1. Clear previous visual path
    nodes.forEach(n => n.classList.remove('active'));
    
    let currIdx = 0;
    let visited = new Set();
    let reachedEnd = false;

    // 2. Trace the signal
    while (currIdx !== null) {
        // If we hit a broken node, the "active" green line stops HERE.
        if (state.grid[currIdx].isBroken) {
            nodes[currIdx].classList.add('active'); // Light it up so player can click to fix
            break; 
        }

        nodes[currIdx].classList.add('active');
        visited.add(currIdx);

        // Check if we reached the exit
        if (currIdx === 35) {
            reachedEnd = true;
            break; 
        }

        // Calculate next movement
        let x = currIdx % 6;
        let y = Math.floor(currIdx / 6);
        let direction = state.grid[currIdx].dir;

        if (direction === 0) y--;      // Up
        else if (direction === 1) x++; // Right
        else if (direction === 2) y++; // Down
        else if (direction === 3) x--; // Left

        if (x < 0 || x >= 6 || y < 0 || y >= 6) break;
        
        let nextIdx = y * 6 + x;
        if (visited.has(nextIdx)) break; // Loop protection
        
        currIdx = nextIdx;
    }

    // 3. THE FINAL VERIFICATION
    // Count every node on the board that is NOT broken (the "Required" nodes)
    const requiredNodes = state.grid.filter(cell => !cell.isBroken).length;
    // Count how many nodes our green path actually successfully visited
    const pathCount = visited.size;

    if (reachedEnd) {
        if (pathCount === requiredNodes) {
            // SUCCESS: Every single empty node is now green and we are at the exit
            handleWin();
        } else {
            // FAILURE: You touched the exit, but missed some nodes.
            if (!statusDisplay.innerText.includes("INCOMPLETE")) {
                if (sounds.error) {
                    sounds.error.currentTime = 0;
                    sounds.error.play().catch(() => {});
                }
                // Tell the player exactly how many nodes are missing
                const missing = requiredNodes - pathCount;
                statusDisplay.innerText = `INCOMPLETE CIRCUIT: ${missing} NODE(S) MISSING`;
                statusDisplay.style.color = "#ffaa00";
            }
        }
    } else {
        // Silent reset of the status message if the path is moved away from the exit
        if (state.isActive && statusDisplay.innerText.includes("INCOMPLETE")) {
            statusDisplay.innerText = "SIGNAL TRACE ACTIVE";
            statusDisplay.style.color = "#00ff41";
        }
    }
}

async function handleWin() {
    if (!state.isActive) return;
    state.isActive = false;
    clearInterval(state.timerInterval);
    
    if (sounds.win) sounds.win.play().catch(() => {});

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