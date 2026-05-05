# DoS Attack

> A fast-paced puzzle game where players fix network paths before time runs out.

---

## Author

**Jasmine Morgan**  
GitHub: https://github.com/galaxydotco

---

## User Story

- *As a player*  
- *I want* to quickly solve a network-style puzzle under pressure  
- *So that* I can prevent a simulated system hack from completing  

---

## Narrative

This project is a browser-based puzzle game inspired by the hacking minigame from *Welcome to the Game 2*. The player is given a grid of directional nodes and must create a valid path from the start to the exit before time runs out.

I chose this idea because I liked the tension and urgency of hacking-style minigames and wanted to recreate that experience in a simple web environment.

During development, I built the grid system, implemented randomized puzzle behavior, and added visual/audio feedback to enhance the experience. I also improved usability by adding a reboot system and refining the UI with Bootstrap.

One of the biggest challenges was debugging logic when deploying to a live server, which required troubleshooting timing issues and script execution.

---

## Attribution

### Libraries / Tools
- Bootstrap 5  
  https://getbootstrap.com/docs/5.3/components/navbar/

### Tutorials / References
- Khan Academy JS Game Development  
  https://www.khanacademy.org/computing/computer-programming/programming-games-visualizations  

- W3Schools CSS  
  https://www.w3schools.com/css/  

- W3Schools JavaScript  
  https://www.w3schools.com/js/  

- JavaScript Game Examples  
  https://github.com/proyecto26/awesome-jsgames  

### AI Usage
- Google Gemini was used to help debug deployment issues and resolve runtime errors.

### Assets
- Wireframe created using Canva

---
# Code Snippet 
```js
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
```
This snippet controls randomized visual and audio effects at the start of the game.

It matters because it enhances user experience by introducing variation and unexpected “glitch” events, making gameplay more engaging.

It works by generating a random value (roll) and conditionally applying themes, sounds, and status messages based on probability thresholds.

---

## Project Structure
```bash
.
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── game.js
│   ├── boot.js
│   └── storage.js
├── assets/
└── README.md
```

## Wireframe

<img width="1920" height="1080" alt="CIS 376 Web Game Wireframe" src="https://github.com/user-attachments/assets/76e64a75-9b22-4a6c-a617-d3dd743c4226" /> 
