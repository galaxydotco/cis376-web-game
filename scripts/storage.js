/*
    CIS 376 - 01 ; Dr. Cumbie
    Jasmine Morgan
    4/13/2026
    Description: DoS Attack game clone 
*/

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAjj1rRsYnJYTEy6_YtT2jWLZ5qTgHSNww",
    authDomain: "game-project-a8124.firebaseapp.com",
    databaseURL: "https://game-project-a8124-default-rtdb.firebaseio.com",
    projectId: "game-project-a8124",
    storageBucket: "game-project-a8124.firebasestorage.app",
    messagingSenderId: "37373740010",
    appId: "1:37373740010:web:6ebd3583bcc7d4db4b6893"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

export const Storage = {
    async getTotalCount() {
        const snapshot = await database.ref('leaderboard').once('value');
        return snapshot.numChildren() || 1;
    },
    // 1. Save score globally
    async saveGlobalScore(username, time) {
        const scoreRef = database.ref('leaderboard').push();
        await scoreRef.set({
            username: username,
            score: parseFloat(time),
            timestamp: Date.now()
        });
    },

    // 2. Fetch Top Scores (Increased limit for the expander)
    async getGlobalLeaderboard(callback) {
        // Changed from 5 to 25 so the "Expand" button actually has data to show
        const topScoresRef = database.ref('leaderboard').orderByChild('score').limitToFirst(25);

        topScoresRef.on('value', (snapshot) => {
            const scores = [];
            snapshot.forEach((childSnapshot) => {
                scores.push(childSnapshot.val());
            });
            callback(scores);
        });
    },

    saveUser(name) { sessionStorage.setItem('dos_username', name); },
    getUser() { return sessionStorage.getItem('dos_username') || "GUEST"; },
    getBestTime() { return localStorage.getItem('dos_best_time') || "--"; }
};