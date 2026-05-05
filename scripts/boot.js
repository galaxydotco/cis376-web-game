/*
    CIS 376 - 01 ; Dr. Cumbie
    Jasmine Morgan
    4/13/2026 - 5/5/2026
    Description: DoS Attack game clone 
*/

const asciiArt = [
    " __________________________________________________________ ",
    "|  _______  ______  _______ __   _ _ __   _ _______ _      |",
    "|     |    |______  |  |  | | \\  | | | \\  | |_____| |      |",
    "|     |    |______  |  |  | |  \\_| | |  \\_| |     | |_____ |",
    "|_________________________________________________V3.0_____|",
    " "
];

const bootLines = [
    "[ OK ] KERNEL LOADED",
    "[ OK ] MOUNTING NETWORK PROTOCOLS...",
    "[ !! ] DOS ATTACK DETECTED - EMERGENCY RECOVERY ACTIVE",
    "READY FOR OPERATOR AUTHENTICATION..."
];

export async function runBootSequence() {
    const screen = document.getElementById('boot-screen');
    const log = document.getElementById('boot-log');
    
    // create a container for ASCII
    const asciiContainer = document.createElement('div');
    asciiContainer.id = 'boot-ascii';
    screen.insertBefore(asciiContainer, log);

    // 1. type out ASCII art
    for (let line of asciiArt) {
        asciiContainer.textContent += line + "\n";
        await new Promise(r => setTimeout(r, 50));
    }

    // 2. type out Log lines
    for (let line of bootLines) {
        let div = document.createElement('div');
        div.className = 'log-entry';
        div.innerText = line;
        log.appendChild(div);
        await new Promise(r => setTimeout(r, Math.random() * 300 + 100));
    }

    // 3. slide Up Transition
    return new Promise(resolve => {
        setTimeout(() => {
            screen.classList.add('slide-up');
            // wait for the CSS transition to finish (1s) before resolving
            setTimeout(resolve, 1000);
        }, 800);
    });
}