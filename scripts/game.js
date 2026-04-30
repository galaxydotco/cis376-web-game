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
        }).catch(() => {});
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
}

// Add 'newScoreIndex' as an argument
function renderLeaderboard(newScoreIndex = null) {
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
            
            // Check if this row is the score the player JUST got
            if (index === newScoreIndex) {
                div.classList.add('new-score-highlight'); // Always gets the green border
                
                // ONLY add the text badge if it's the #1 spot
                if (index === 0) {
                    div.classList.add('top-record-badge');
                }
            } 
            
            div.innerHTML = `<span><span class="rank">#${index + 1}</span> ${entry.username.toUpperCase()}</span><span>${entry.score.toFixed(2)}s</span>`;
            leaderboardContainer.appendChild(div);
        });
    });
}

async function startNewGame() {
    clearInterval(state.timerInterval);
    state.isActive = true;
    state.hasMoved = false;
    state.timeLeft = config.timerMax;

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

    try {
        startSound.currentTime = 0;
        await startSound.play();
    } catch (e) {}

    state.timerInterval = setInterval(() => {
        state.timeLeft -= 0.01;
        if (timerDisplay) timerDisplay.innerText = state.timeLeft.toFixed(2) + "s";
        if (state.timeLeft <= 0) handleGameOver();
    }, 10);

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
    
    // RESET STATUS COLOR if they move away from the exit
    if (!reachedEnd && statusDisplay.innerText.includes("INCOMPLETE")) {
        statusDisplay.innerText = "SIGNAL TRACE ACTIVE";
        statusDisplay.style.color = "#00ff41";
    }

    if (reachedEnd) {
        if (brokenRemaining === 0) {
            handleWin();
        } else {
            // FIXED: Message now correctly warns about remaining nodes
            statusDisplay.innerText = `INCOMPLETE: ${brokenRemaining} NODES REMAINING`;
            statusDisplay.style.color = "#ffaa00";
            sounds.error.currentTime = 0;
            sounds.error.play().catch(() => {});
        }
    }
}

async function handleWin() {
    if (!state.isActive) return;
    state.isActive = false;
    clearInterval(state.timerInterval);
    
    // Absolute final time calculation
    const finalTime = Date.now();
    const timeTaken = Number(((finalTime - state.startTime) / 1000).toFixed(2));
    
    sounds.win.currentTime = 0;
    sounds.win.play().catch(() => {});
    
    // Save to database first so our current run is included in the array
    await Storage.saveGlobalScore(Storage.getUser(), timeTaken);

    Storage.getGlobalLeaderboard((scores) => {
        const totalEntries = scores.length;
        
        // Find our rank (1st, 2nd, 3rd, etc.)
        let myRank = 1;
        for (let i = 0; i < scores.length; i++) {
            // Force Number conversion to prevent string-math bugs
            if (Number(scores[i].score) < timeTaken) {
                myRank++;
            }
        }
        
        // Percentile Math: (Your Rank / Total Players) * 100
        let topPercent = Math.ceil((myRank / totalEntries) * 100);
        
        // Polish the display logic
        if (totalEntries <= 1) {
            topPercent = 1; // If you're the only player, you're Top 1%
        } else if (myRank === 1) {
            topPercent = 1; // The absolute fastest time is always Top 1%
        }
        
        // Safety bounds just in case
        topPercent = Math.max(1, Math.min(topPercent, 100));

        statusDisplay.innerText = `ACCESS GRANTED: TOP ${topPercent}% SPEED`;
        statusDisplay.style.color = "#00ff41";
        
        // myRank is 1st, 2nd, 3rd etc. Arrays start at 0, so we subtract 1!
        renderLeaderboard(myRank - 1); 
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


async function startNewGame() {
    clearInterval(state.timerInterval);
    state.isActive = true;
    state.hasMoved = false;
    state.timeLeft = config.timerMax;
    
    // NEW: Capture absolute start time
    state.startTime = Date.now(); 

    // ... (keep your sound logic and theme logic here) ...

    state.timerInterval = setInterval(() => {
        // NEW MATH: Absolute Time Calculation
        const now = Date.now();
        const elapsedMilliseconds = now - state.startTime;
        const elapsedSeconds = elapsedMilliseconds / 1000;
        
        state.timeLeft = config.timerMax - elapsedSeconds;

        if (timerDisplay) {
            // Ensure we don't show negative numbers if it lags at the very end
            const displayTime = Math.max(0, state.timeLeft).toFixed(2);
            timerDisplay.innerText = displayTime + "s";
        }

        if (state.timeLeft <= 0) {
            handleGameOver();
        }
    }, 10); // We still run at 10ms for smoothness, but the MATH is now bulletproof

    requestAnimationFrame(() => {
        buildLevel();
    });
}