/*
    CIS 376 - 01 ; Dr. Cumbie
    Jasmine Morgan
    4/13/2026
    Description: DoS Attack game clone 
*/

/**
 * GAME.JS - Terminal_V3.0 Core Logic
 * Handles game initialization, search filtering, and win-state calculations.
 */

import { runBootSequence } from './boot.js';
import { Storage } from './storage.js';

// --- DOM ELEMENTS ---
const statusDisplay = document.getElementById('status-text');
const searchInput = document.getElementById('search-bar');
const leaderboardList = document.getElementById('leaderboard-results');
const gameContainer = document.getElementById('game-ui');

// --- GAME STATE ---
let startTime;
let scores = [];

/**
 * INIT: The entry point. 
 * Waits for the boot sequence animation before revealing the game UI.
 */
async function init() {
    // 1. Run the "System Boot" and wait for the slide-up to finish
    await runBootSequence();

    // 2. Reveal the game interface
    gameContainer.style.opacity = "1";
    
    // 3. Load existing leaderboard data from Firebase
    await refreshLeaderboard();

    // 4. Set the start time for the player's session
    startTime = Date.now();
    
    console.log("System Ready. Timer started.");
}

/**
 * REFRESH LEADERBOARD: Fetches top scores and renders them to the UI.
 */
async function refreshLeaderboard() {
    scores = await Storage.getTopScores(25); // Pulling top 25 performers
    leaderboardList.innerHTML = ''; 

    scores.forEach((entry, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${index + 1}. ${entry.name}</span> <span>${entry.score}s</span>`;
        leaderboardList.appendChild(li);
    });
}

/**
 * HANDLE WIN: Triggered when the user completes the objective.
 * Calculates percentile rank and saves the score.
 */
async function handleWin() {
    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000; // Convert ms to seconds
    
    // Get the total number of players globally for accurate math
    const totalEntries = await Storage.getTotalCount();
    
    // Determine the user's rank relative to the currently loaded top scores
    let myRank = 1;
    if (Array.isArray(scores)) {
        for (let i = 0; i < scores.length; i++) {
            if (Number(scores[i].score) < timeTaken) {
                myRank++;
            }
        }
    }

    // --- PERCENTILE CALCULATION (Banish the NaN) ---
    // Formula: (Your Rank / Total Players) * 100
    let rawPercent = (myRank / (totalEntries || 1)) * 100;
    let topPercent = Math.ceil(rawPercent);

    // Safety checks: Ensure it stays between 1 and 100
    if (isNaN(topPercent)) topPercent = 100;
    topPercent = Math.min(Math.max(topPercent, 1), 100);

    // Update the UI with the final result
    statusDisplay.innerText = `ACCESS GRANTED: TOP ${topPercent}% SPEED (${timeTaken.toFixed(2)}s)`;
    statusDisplay.classList.add('success-flash');

    // Save the session to Firebase
    await Storage.saveScore(timeTaken);
    await refreshLeaderboard();
}

/**
 * FILTER LOGIC: (Optional) If you're using the search bar to filter shortcuts
 */
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    // Your filtering logic here...
    // Example: if (term === 'secret_key') handleWin();
});

// Fire the engines
init();