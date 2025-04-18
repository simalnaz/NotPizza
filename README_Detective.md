# Detective Game - Local Setup and Execution Instructions

### A.1 Overview
This appendix provides detailed instructions for downloading, installing, and executing the Detective game project locally. The game is a browser-based interactive educational tool designed to teach core Data Structures and Algorithms (DSA) through narrative-driven gameplay. Developed using modular JavaScript and rendered via HTML5 Canvas, the game features three distinct puzzles that each align with an academic DSA concept: arrays, hash maps, and linked lists.

Due to browser security policies regarding file system access, the game must be hosted locally using an HTTP server in order to function as intended.

### A.2 Download Instructions
Access the final build archive:  
**Filename**: `Detective.zip`  
This archive contains all necessary HTML, JavaScript, CSS, and asset files required to run the game.

Extract the archive to a designated folder on your local machine. The folder structure must be preserved to ensure all relative paths (e.g., to image and style assets) remain intact.

### A.3 Running the Application
In order to execute the game, a local web server must be initiated. Below are three supported options depending on the tools available to the user.

#### A.3.1 Method 1: Using npx (Recommended)
This method requires Node.js to be installed.

```bash
npx serve
```

Run the command from the root directory of the unzipped Detective folder.  
The server will launch and provide a local URL (e.g., `http://localhost:3000`).  
Navigate to the provided URL in a modern web browser (Chrome, Firefox, or Edge).

#### A.3.2 Method 2: Using Python’s HTTP Server
For users with Python 3.x installed:

```bash
python -m http.server
```

Run the command from the project directory.  
Access the game at `http://localhost:8000`.

#### A.3.3 Method 3: Using Visual Studio Code with Live Server
1. Open the extracted project folder in Visual Studio Code.  
2. Install the **Live Server** extension via the Extensions Marketplace.  
3. Right-click on `index.html` and select **"Open with Live Server"**.  
The game will open automatically in the default browser.

### A.4 Gameplay Overview
Once loaded, the game initializes in a canvas element contained within `index.html`. The player assumes the role of a detective exploring a haunted hotel. Gameplay is structured into three chapters, each introducing a distinct DSA mechanic:

| Chapter | Concept     | Puzzle Description                                                    |
|---------|-------------|------------------------------------------------------------------------|
| 1       | Arrays      | Collect three scattered keys and return them to the ghost Elliot.      |
| 2       | Hash Maps   | Match ghost memories to guest names using a searchable guest book.     |
| 3       | Linked Lists| Reconstruct a ghost’s story by correctly reordering narrative nodes.   |

Each puzzle is tied to a dialogue-driven scenario where success results in a ghost moving on to the afterlife. The player receives feedback, encouragement, and occasional poetic reflections to reinforce learning and emotional engagement.

### A.5 Controls

| Function            | Input Method         |
|---------------------|----------------------|
| Move Character       | Arrow Keys or WASD  |
| Interact / Advance Text | Enter           |
| Open Inventory       | I                   |

### A.6 Technical Notes
- All core functionality is contained within modular JavaScript classes (e.g., `Ghost.js`, `Inventory.js`, `OverworldMap.js`).
- Game state is managed via object-oriented inheritance and event-driven updates.
- UI components such as the inventory system, guessing interface, and reverse puzzle are rendered dynamically and appended to the DOM as required.
- Educational logic and progress tracking are encapsulated within the `utils.js` file for clarity and reuse.

### A.7 Troubleshooting
- **Blank screen**: Ensure the game is hosted via a local HTTP server. Opening the HTML file directly will not work.
- **Missing images or styles**: Verify that the folder structure remains unmodified after extraction.
- **Unexpected behavior**: Use browser developer tools (`F12`) to inspect console output and trace issues.
