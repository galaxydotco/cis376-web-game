# Project Name
DoS Attack
April 13th, 2026
CIS 376

# Game Objective 
Based of the minigame in "Welcome to the Game 2." You have 30 seconds to solve the given puzzle. Your goal is to go from the top left to the bottom right by correcting the arrows to create a highlighted path to the end. The test begins imemdiately as you open the page to simulate being hacked, and you may repeat it by using the "reboot system" button.

# Rules 
Follow the connection from the Start node.
Click empty/broken nodes to correct the travel path.
Reach the Exit node before the buffer overflows.

# Tech Used 
HTML5
JAVASCRIPT
CSS
LocalStorage
Bootstrap 5

# Resource Links 
[Bootstrap NavBar Link](https://getbootstrap.com/docs/5.3/components/navbar/)

[Advanced JS for Web Games](https://www.khanacademy.org/computing/computer-programming/programming-games-visualizations)

[Other Games I referenced on Github](https://github.com/proyecto26/awesome-jsgames)

All w3school tutorials used

[W3Schools CSS Tutorial Link ](https://www.w3schools.com/css/) 

[W3Schools JavaScript Tutorial Link](https://www.w3schools.com/js/)


Gemini was a life saver for helping me resole the long list of issues I had running this on the live server.

# Code Snippet 
```
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
This is the "brain" of the signal tracking when interacting with the game. 
It calculates where the green light should travel next based on the direction of the arrow. 
It's really neat because it's like a running check to look all around to determine it's next step.

# WireFrame 
Created using Canva
<img width="1920" height="1080" alt="CIS 376  Web Game Wireframe" src="https://github.com/user-attachments/assets/76e64a75-9b22-4a6c-a617-d3dd743c4226" />
