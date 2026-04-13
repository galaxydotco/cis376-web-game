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
```
This is the "brain" of the signal tracking when interacting with the game. 
It calculates where the green light should travel next based on the direction of the arrow. 
It's really neat because it's like a running check to look all around to determine it's next step.

# WireFrame 