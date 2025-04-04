(function () {
  // Initialize the GuestBook
  const guestBook = new GuestBook();

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

  // Check if window.OverworldMaps is defined before accessing Street
  if (window.OverworldMaps && window.OverworldMaps.DemoRoom) {
    // Start the game with the DemoRoom map
    overworld.startMap(window.OverworldMaps.DemoRoom);
  } else {
    console.error("Error: window.OverworldMaps.DemoRoom is not defined.");
  }

  // Initialize the Overworld
  overworld.init();
})();
