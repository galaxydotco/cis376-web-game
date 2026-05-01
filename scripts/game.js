/*
    CIS 376 - 01 ; Dr. Cumbie
    Jasmine Morgan
    4/13/2026
    Description: DoS Attack game clone 
*/

import { Storage } from './storage.js';

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

function init() {
    // Render the initial state of the leaderboard when the page loads
    renderLeaderboard();
    if (displayName) displayName.innerText = Storage.getUser();

    const playerForm = document.getElementById('player-form');
    if (playerForm) {
        playerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            unlockAudio();
            const nameInput = document.getElementById('username');

            // Basic validation to ensure the username is at least 3 characters
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

    // Inside your init() function in game.js
    const expandBtn = document.getElementById('expand-leaderboard-btn');

    if (expandBtn) {
        console.log("Expand button found!"); // Check your browser console (F12) for this!

        expandBtn.onclick = (e) => {
            e.preventDefault();
            const container = document.getElementById('global-leaderboard');

            container.classList.toggle('expanded');
            console.log("Expanded class toggled:", container.classList.contains('expanded'));

            if (container.classList.contains('expanded')) {
                expandBtn.innerText = '[-] COLLAPSE ARCHIVE';
                sounds.clickUpDn.play().catch(() => { });
            } else {
                expandBtn.innerText = '[+] EXPAND ARCHIVE';
                sounds.clickLeft.play().catch(() => { });
            }
        };
    } else {
        console.error("Expand button NOT found in the DOM.");
    }
}

function renderLeaderboard(newScoreIndex = null) {
    Storage.getGlobalLeaderboard((scores) => {
        if (!leaderboardContainer) return;

        // --- NEW: HIGHLIGHT LOGIC ---
        // Retrieve the current user's stored name so we can compare it against the list
        const currentUser = Storage.getUser();

        leaderboardContainer.innerHTML = '';

        // Handle empty states gracefully
        if (scores.length === 0) {
            leaderboardContainer.innerHTML = '<div class="text-center">NO DATA FOUND</div>';
            return;
        }

        // Update the top-level high score display element if it exists
        if (highScoreEl && scores[0]) {
            highScoreEl.innerText = `${scores[0].score}s (${scores[0].username})`;
        }

        // Loop through every score in the fetched dataset
        scores.forEach((entry, index) => {
            const div = document.createElement('div');
            div.className = 'entry';

            // --- NEW: HIGHLIGHT CURRENT USER'S SCORES ---
            // If the entry's username matches the active user, add a specific highlight class
            if (entry.username === currentUser) {
                div.classList.add('user-score-highlight');
            }

            // Highlight the brand new score if they just finished a game
            if (index === newScoreIndex) {
                div.classList.add('new-score-highlight');
                if (index === 0) {
                    div.classList.add('top-record-badge');
                }
            }

            // Construct the HTML for the entry row
            div.innerHTML = `<span><span class="rank">#${index + 1}</span> ${entry.username.toUpperCase()}</span><span>${entry.score.toFixed(2)}s</span>`;
            leaderboardContainer.appendChild(div);

            const expandBtn = document.getElementById('expand-leaderboard-btn');
            if (expandBtn) {
                expandBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    leaderboardContainer.classList.toggle('expanded');

                    if (leaderboardContainer.classList.contains('expanded')) {
                        expandBtn.innerText = '[-] COLLAPSE ARCHIVE';
                        sounds.clickUpDn.currentTime = 0;
                        sounds.clickUpDn.play().catch(() => { });
                    } else {
                        expandBtn.innerText = '[+] EXPAND ARCHIVE';
                        sounds.clickLeft.currentTime = 0;
                        sounds.clickLeft.play().catch(() => { });
                    }
                });
            }
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

    Storage.getGlobalLeaderboard((scores) => {
        const totalEntries = scores.length;
        let myRank = 1;
        for (let i = 0; i < scores.length; i++) {
            if (Number(scores[i].score) < timeTaken) {
                myRank++;
            }
        }

        let topPercent = Math.ceil((myRank / totalEntries) * 100);
        if (totalEntries <= 1 || myRank === 1) topPercent = 1;
        topPercent = Math.max(1, Math.min(topPercent, 100));

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