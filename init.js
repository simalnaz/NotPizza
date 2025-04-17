(function () {
  // Initialize the Ghosts
  const ghosts = [
    new GhostName({
      x: utils.withGrid(10),
      y: utils.withGrid(7),
      src: "/images/characters/people/npc4.png",
      rememberedDetail: "bakes lemon cake",
      id: "ghost1",
    }),
    new GhostName({
      x: utils.withGrid(2),
      y: utils.withGrid(3),
      src: "/images/characters/people/elliot.png",
      rememberedDetail: "carries a golden pocket watch",
      id: "ghost2",
    }),
    new GhostName({
      x: utils.withGrid(12),
      y: utils.withGrid(10),
      src: "/images/characters/people/npc2.png",
      rememberedDetail: "plays the violin at midnight",
      id: "ghost3",
    }),
    // Add new ghosts
    new GhostName({
      x: utils.withGrid(5),
      y: utils.withGrid(5),
      src: "/images/characters/people/npc1.png", // Adjust image path as needed
      rememberedDetail: "wears a navy blue suit",
      id: "ghost4",
    }),
    new GhostName({
      x: utils.withGrid(8),
      y: utils.withGrid(9),
      src: "/images/characters/people/npc3.png", // Adjust image path as needed
      rememberedDetail: "has a pearl necklace",
      id: "ghost5",
    }),
    new GhostName({
      x: utils.withGrid(15),
      y: utils.withGrid(6),
      src: "/images/characters/people/npc5.png", // Adjust image path as needed
      rememberedDetail: "smokes a wooden pipe",
      id: "ghost6",
    }),
    new GhostName({
      x: utils.withGrid(4),
      y: utils.withGrid(12),
      src: "/images/characters/people/npc6.png", // Adjust image path as needed
      rememberedDetail: "carries a red umbrella",
      id: "ghost7",
    }),
  ];

  // Initialize the Overworld
  const overworld = new Overworld({
    element: document.querySelector(".game-container"),
  });

  window.overworld = overworld; // Make it global
  overworld.init().catch(console.error);
  
  window.keyArrayDisplay.init();

  //Cheat for debugging
  document.addEventListener("keydown", (e) => {
    if (e.key === "L") {
      overworld.startMap(window.OverworldMaps.Lobby);
    }
    if (e.key === "K") {
      window.elliotShouldFade = true;
      utils.gameProgress.chapter1Completed = true;
      utils.keyCollection.keysFound = ["Iron Master Key", "Silver Room Key", "Gold Safe Key"];
      alert("Chapter 1 complete cheat activated");
    }
    if (e.key === "i") {
      overworld.startMap(window.OverworldMaps.Hallway);
    }
    // Add a debug key for testing ghost identification
    if (e.key === "G") {
      utils.identifyGhost("Elliot");
      alert("Identified Elliot!");
    }
  });
  
  // Initialize NotebookMenu (This is fine here)
  const notebookMenu = new NotebookMenu();
  notebookMenu.init(document.querySelector(".game-container"));

  document.getElementById("notebook-icon").addEventListener("click", () => {
    notebookMenu.toggle();
  });

})();

document.addEventListener("DOMContentLoaded", function() {
  // Create a flag to track if the letter has been read
  window.letterRead = false;

  // Reference to the letter icon
  const letterIcon = document.getElementById("letter-icon");

  // Function to handle letter click
  function handleLetterClick() {
    // Stop the letter from shaking
    letterIcon.style.animation = "none";

    // Hide the letter icon
    letterIcon.style.display = "none";

    // Set the flag that the letter has been read
    window.letterRead = true;
    console.log("[Letter Click] Letter icon clicked! Setting window.letterRead to true.");

    // Start the letter reading cutscene
    if (window.overworld && window.overworld.map) {
      console.log("[Letter Click] Starting letter reading text messages...");

      window.overworld.map.startCutscene([
        // --- Part 1: Reading the Letter ---
        { type: "textMessage", text: "Dear Detective Lumen," },
        { type: "textMessage", text: "I hope this letter finds you well. I am writing regarding the troubling situation at the Grand Spectre Hotel." },
        { type: "textMessage", text: "Several spirits are trapped here, unable to move on to the afterlife." },
        { type: "textMessage", text: "I believe your unique skills as both a detective and a medium will be invaluable in resolving this matter." },
        { type: "textMessage", text: "Please come to the hotel garden as soon as possible. I will meet you there to explain the situation in detail." },
        {
          type: "textMessage",
          text: "Sincerely,\nThe Hotel Manager"
        },

        // --- Part 2: Inner Monologue ---
        { type: "stand", who: "hero", direction: "down", time: 500 },
        { type: "walk", who: "hero", direction: "down", time: 500 },
        { type: "walk", who: "hero", direction: "down", time: 500 },

        { type: "textMessage", text: '<i>The letter feels heavier than paper should.</i>' },
        { type: "textMessage", text: '<i>Three days ago, it arrived without a return address.</i>'},
        { type: "textMessage", text: '<i>"Help them move on," it said.</i>' },
        { type: "textMessage", text: `<i>"They need someone who can see." </i>` },
        { type: "textMessage", text: '<i>I\'ve handled strange cases before, but something about this one... it feels like the pen strokes are reaching into me.</i>'},
      ])

      
        // --- Part 3: Add the center text display ---
        .then(() => {
          // Check if the method exists before calling
          if (window.overworld && typeof window.overworld.showCenterText === 'function') {
              window.overworld.showCenterText("Enter the Hotel", 4000);
          }
        })
        .catch(err => {
        });
      } 
    } 

  // Add click event to the letter icon
  if (letterIcon) {
    letterIcon.addEventListener("click", handleLetterClick);
  }
});