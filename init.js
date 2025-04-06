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
          realName: "Eleanor Wright"
      }),
      new GhostName({
          x: utils.withGrid(2),
          y: utils.withGrid(3),
          src: "/images/characters/people/npc1.png",
          rememberedDetail: "carries a golden pocket watch",
          id: "ghost2",
          realName: "Thomas Fleming"
      }),
      new GhostName({
          x: utils.withGrid(12),
          y: utils.withGrid(10),
          src: "/images/characters/people/npc2.png",
          rememberedDetail: "plays the violin at midnight",
          id: "ghost3",
          realName: "Josephine Hayes"
      }),
  ];
  
  // Initialize the Overworld
  const overworld = new Overworld({
      element: document.querySelector(".game-container"),
  });

  window.overworld = overworld;
  
  // Check if window.OverworldMaps is defined before accessing Street
  if (window.OverworldMaps && window.OverworldMaps.Street) {
      // Start the game with the Street map
      overworld.startMap(window.OverworldMaps.Street);
  } else {
      console.error("Error: window.OverworldMaps.Street is not defined.");
  }

  // Initialize the Overworld
  overworld.init();
})();
