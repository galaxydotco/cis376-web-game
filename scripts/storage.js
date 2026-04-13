/*
    CIS 376 - 01 ; Dr. Cumbie
    Jasmine Morgan
    4/13/2026
    Description: DoS Attack game clone 
*/

export const Storage = {
    saveBestTime(newTime) {
        const currentBest = localStorage.getItem('dos_best_time');
        if (currentBest === null || parseFloat(newTime) < parseFloat(currentBest)) {
            localStorage.setItem('dos_best_time', newTime);
            return true;
        }
        return false;
    },
    getBestTime() {
        const best = localStorage.getItem('dos_best_time');
        return best ? `${best}s` : "--";
    },
    saveUser(name) {
        sessionStorage.setItem('dos_username', name);
    },
    getUser() {
        return sessionStorage.getItem('dos_username') || "GUEST";
    }
};