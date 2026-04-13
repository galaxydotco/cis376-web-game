/*
    CIS 376 - 01 ; Dr. Cumbie
    Jasmine Morgan
    4/13/2026
    Description: DoS Attack game clone 
*/

import { Storage } from './storage.js';

const config = { size: 6, timerMax: 30, arrows: ['↑', '→', '↓', '←'] };
let state = { grid: [], timeLeft: config.timerMax, isActive: false, timerInterval: null };

document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    // DOM cache
    const playerForm = document.getElementById('player-form');
    const navReset = document.getElementById('nav-reset');
    const displayName = document.getElementById('display-name');
    const highScore = document.getElementById('high-score');

    if (displayName) displayName.innerText = Storage.getUser();
    if (highScore) highScore.innerText = Storage.getBestTime();

    if (playerForm) {
        playerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('username');
            if (nameInput && nameInput.value.length >= 3) {
                Storage.saveUser(nameInput.value);
                if (displayName) displayName.innerText = nameInput.value;
                startNewGame();
            } else {
                playerForm.classList.add('was-validated'); // listener
            }
        });
    }

    if (navReset) {
        navReset.addEventListener('click', (e) => {
            e.preventDefault();
            startNewGame();
        });
    }
}

function startNewGame() {
    const statusDisplay = document.getElementById('status');
    const timerDisplay = document.getElementById('timer');

    clearInterval(state.timerInterval);
    state.isActive = true;
    state.timeLeft = config.timerMax;

    if (statusDisplay) {
        statusDisplay.innerText = "SIGNAL TRACE ACTIVE";
        statusDisplay.style.color = "#00ff41";
    }

    buildLevel();
    
    state.timerInterval = setInterval(() => {
        state.timeLeft -= 0.01;
        if (timerDisplay) {
            timerDisplay.innerText = state.timeLeft.toFixed(2) + "s";
        }
        if (state.timeLeft <= 0) {
            clearInterval(state.timerInterval);
            state.isActive = false;
            if (statusDisplay) {
                statusDisplay.innerText = "CONNECTION TERMINATED";
                statusDisplay.style.color = "#ff0041";
            }
        }
    }, 10);
}

function buildLevel() {
    const board = document.getElementById('game-board');
    if (!board) return;
    state.grid = [];
    board.innerHTML = '';
    // create randomized items into each game instance
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
                cell.isBroken = false;
                div.classList.remove('broken');
            } else {
                cell.dir = (cell.dir + 1) % 4;
                div.innerText = config.arrows[cell.dir];
            }
            updatePathTracing();
        };
        board.appendChild(div);
    });
    updatePathTracing();
}

function updatePathTracing() {
    const nodes = document.querySelectorAll('.node');
    const statusDisplay = document.getElementById('status');
    if (!nodes.length) return;

    nodes.forEach(n => n.classList.remove('active'));
    let currIdx = 0;
    let visited = new Set();

    while (currIdx !== null) {
        nodes[currIdx].classList.add('active');
        if (currIdx === 35) {
            const unrepairedNodes = state.grid.filter(cell => cell.isBroken);
            if (unrepairedNodes.length === 0) {
                handleWin();
                return;
            } else {
                statusDisplay.innerText = `REPAIR REMAINING NODES: ${unrepairedNodes.length} LEFT`;
                statusDisplay.style.color = "#ff0041";
                return;
            }
        }
        // carve path 
        if (state.grid[currIdx].isBroken) break;
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

function handleWin() {
    if (!state.isActive) return;
    const statusDisplay = document.getElementById('status');
    state.isActive = false;
    clearInterval(state.timerInterval);
    
    if (statusDisplay) {
        statusDisplay.innerText = "ACCESS GRANTED";
        statusDisplay.style.color = "#00ff41";
    }
    
    const timeTaken = (config.timerMax - state.timeLeft).toFixed(2);
    Storage.saveBestTime(timeTaken);
    
    const highScoreEl = document.getElementById('high-score');
    if (highScoreEl) highScoreEl.innerText = Storage.getBestTime();
}

// console hint easter egg
console.log("%c[SYSTEM] Type 'noclip()' for infinite time.", "color: #00ff41; font-weight: bold;");
window.noclip = () => { 
    clearInterval(state.timerInterval); 
    timerDisplay.innerText = "INF"; 
    return "Cheat Engaged."; 
};