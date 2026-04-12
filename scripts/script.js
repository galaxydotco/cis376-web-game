const GRID_SIZE = 6;
const directions = ['↑', '→', '↓', '←'];
let gridData = [];
let timeLeft = 30;
let timerInterval;

const gridElement = document.getElementById('grid');
const statusElement = document.getElementById('status');
const timerElement = document.getElementById('timer');
const restartBtn = document.getElementById('restart-btn');

function initGame() {
    clearInterval(timerInterval);
    timeLeft = 30;
    statusElement.innerText = "CORRECT COURSE TO EXIT";
    statusElement.style.color = "#00ff41";
    
    generateLevel();
    startTimer();
}

function generateLevel() {
    gridData = [];
    gridElement.innerHTML = '';

    // create the base grid 
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        gridData.push({ dir: Math.floor(Math.random() * 4), isPath: false, isBroken: false });
    }

    // carve guarenteed path 
    let current = 0;
    gridData[0].isPath = true;
    while (current !== 35) {
        let x = current % GRID_SIZE;
        let y = Math.floor(current / GRID_SIZE);
        let canGoRight = x < GRID_SIZE - 1;
        let canGoDown = y < GRID_SIZE - 1;
        let move = (Math.random() > 0.5 && canGoRight) || !canGoDown ? 1 : 2;
        
        if (move === 1) { gridData[current].dir = 1; current++; } 
        else { gridData[current].dir = 2; current += GRID_SIZE; }
        gridData[current].isPath = true;
    }

    // break 4-6 nodes on path 
    gridData.forEach((data, i) => {
        if (data.isPath && i !== 0 && i !== 35 && Math.random() > 0.4) {
            data.isBroken = true;
            data.dir = Math.floor(Math.random() * 4);
        }
    });

    renderGrid();
    updateVisualPath();
}

function renderGrid() {
    gridData.forEach((data, i) => {
        const node = document.createElement('div');
        node.className = 'node';
        if (data.isBroken) node.classList.add('broken');
        node.innerText = directions[data.dir];
        
        node.onclick = function() {
            // cycle direction 
            data.dir = (data.dir + 1) % 4;
            this.innerText = directions[data.dir];
            this.classList.remove('broken');
            updateVisualPath();
        };
        gridElement.appendChild(node);
    });
}

function updateVisualPath() {
    const nodes = document.querySelectorAll('.node');
    if (!nodes.length) return;
    
    nodes.forEach(n => n.classList.remove('active'));

    let current = 0;
    let visited = new Set();

    while (current !== null) {
        nodes[current].classList.add('active');
        if (current === 35) return winGame();
        
        visited.add(current);
        let x = current % GRID_SIZE;
        let y = Math.floor(current / GRID_SIZE);
        let dir = gridData[current].dir;

        // move calculation based on direction
        if (dir === 0) y--; else if (dir === 1) x++;
        else if (dir === 2) y++; else if (dir === 3) x--;

        // if the next node isn't the hidden path, stop the visual 
        let next = (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) ? null : y * GRID_SIZE + x;
        if (next === null || visited.has(next)) break;
        current = next;
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft -= 0.01;
        timerElement.innerText = "TIME: " + timeLeft.toFixed(2) + "s";
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerElement.innerText = "TIME: 0.00s";
            statusElement.innerText = "SYSTEM LOCKED";
            statusElement.style.color = "#ff0041";
        }
    }, 10);
}

function winGame() {
    clearInterval(timerInterval);
    statusElement.innerText = "ACCESS GRANTED";
}

// final check to make sure button works
if (restartBtn) {
    restartBtn.onclick = initGame;
}

// kick off the first game
initGame();