
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
      src: "/images/characters/people/npc1.png",
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
  ];

  // Initialize the Overworld
  const overworld = new Overworld({
    element: document.querySelector(".game-container"),
  });

  window.overworld = overworld; // Make it global

  // Check if window.OverworldMaps and Lobby exist
  if (window.OverworldMaps && window.OverworldMaps.Lobby) {
    // Initialize the Overworld (which now handles starting the map internally and waits)
    overworld.init(); // This is now async, but we don't necessarily need to await it here
                      // unless something else depends on init() completing.
  } else {
    console.error("Error: window.OverworldMaps.Lobby is not defined. Cannot start game.");
    // Display an error message to the user on the page
    document.querySelector(".game-container").innerHTML =
      '<p style="color: red; padding: 20px;">Error: Failed to load map configuration. Check console.</p>';
  }

  // REMOVED the redundant overworld.startMap call here

  // Initialize NotebookMenu (This is fine here)
  const notebookMenu = new NotebookMenu();
  notebookMenu.init(document.querySelector(".game-container"));

  document.getElementById("notebook-icon").addEventListener("click", () => {
    notebookMenu.toggle();
  });

})();