const bootLines = [
    "[ OK ] INITIALIZING KERNEL...",
    "[ OK ] LOADING SYSTEM.DRV",
    "[ OK ] MOUNTING NETWORK PROTOCOLS...",
    "[ WARN ] PACKET LOSS DETECTED IN SECTOR 7G",
    "[ OK ] BYPASSING ENCRYPTION...",
    "[ !! ] DOS ATTACK DETECTED",
    "[ OK ] ESTABLISHING SECURE CONNECTION...",
    "READY FOR OPERATOR AUTHENTICATION..."
];

export async function runBootSequence() {
    const log = document.getElementById('boot-log');
    const screen = document.getElementById('boot-screen');
    
    for (let line of bootLines) {
        let div = document.createElement('div');
        div.className = 'log-entry';
        div.innerText = line;
        log.appendChild(div);
        
        // Random "stutter" for realism
        await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100));
    }

    // Wait a moment at the end, then fade out
    setTimeout(() => {
        screen.classList.add('fade-out');
    }, 1000);
}

document.addEventListener('DOMContentLoaded', runBootSequence);