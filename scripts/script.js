const GRID_SIZE = 6;
const directions = ['↑', '→', '↓', '←'];
let gridData = [];
let timeLeft = 30;
let timerInterval;

const gridElement = document.getElementById('grid');
const timerElement = document.getElementById('timer');
const restartBtn = document.getElementById('restart-btn');

// Initialize Game
function initGame() {
    clearInterval(timerInterval);
    timeLeft = 30;
    timerElement.innerText = `TIME REMAINING: ${timeLeft}s`;
    createGrid();
    startTimer();
}

function createGrid() {
    gridElement.innerHTML = '';
    gridData = [];

    // 1. Generate random nodes
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        gridData.push({
            index: i,
            dir: Math.floor(Math.random() * 4)
        });
    }

    // 2. Render Nodes to DOM
    const startIdx = 0;
    const exitIdx = (GRID_SIZE * GRID_SIZE) - 1;

    gridData.forEach((data, i) => {
        const node = document.createElement('div');
        node.classList.add('node');
        
        if (i === startIdx) node.classList.add('start');
        if (i === exitIdx) node.classList.add('exit');
        
        node.innerText = directions[data.dir];
        node.onclick = () => rotateNode(i, node);
        
        gridElement.appendChild(node);
    });
}

function rotateNode(index, element) {
    gridData[index].dir = (gridData[index].dir + 1) % 4;
    element.innerText = directions[gridData[index].dir];
    checkWin();
}

function checkWin() {
    let current = 0; // Start point
    const exit = (GRID_SIZE * GRID_SIZE) - 1;
    const visited = new Set();

    while (current !== exit) {
        if (visited.has(current)) break; // Prevent infinite loops
        visited.add(current);

        let x = current % GRID_SIZE;
        let y = Math.floor(current / GRID_SIZE);
        let dir = gridData[current].dir;

        // Calculate next movement
        if (dir === 0) y--;      // Up
        else if (dir === 1) x++; // Right
        else if (dir === 2) y++; // Down
        else if (dir === 3) x--; // Left

        // Check if move is out of bounds
        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) break;

        current = y * GRID_SIZE + x;
        
        if (current === exit) {
            clearInterval(timerInterval);
            setTimeout(() => alert("ACCESS GRANTED. SYSTEM BYPASSED."), 10);
            return;
        }
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.innerText = `TIME REMAINING: ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("HACK DETECTED. SYSTEM LOCKED.");
            initGame();
        }
    }, 1000);
}

// Event Listeners
restartBtn.addEventListener('click', initGame);

// Auto-start on load
initGame();