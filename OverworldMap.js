class OverworldMap {
  constructor(config) {
    this.overworld = null;
    this.gameObjects = config.gameObjects;
    this.cutsceneSpaces = config.cutsceneSpaces || {};
    this.walls = config.walls || {};

    this.lowerImage = new Image();
    this.lowerImage.src = config.lowerSrc;

    this.upperImage = new Image();
    this.upperImage.src = config.upperSrc;

    this.isCutscenePlaying = false;

    this.isLoaded = false;
  }

  // NEW: Method that returns a Promise which resolves when images are loaded
  waitForLoad() {
    return new Promise(resolve => {
      // Check if already loaded (e.g., if switching maps)
      if (this.lowerImage.complete && this.upperImage.complete) {
         this.isLoaded = true;
         resolve();
         return;
      }

      let lowerLoaded = false;
      let upperLoaded = false;

      const checkBothLoaded = () => {
        if (lowerLoaded && upperLoaded) {
          this.isLoaded = true;
          console.log(`Map images loaded for: ${this.lowerImage.src}`); // Debug log
          resolve();
        }
      };

      this.lowerImage.onload = () => {
        lowerLoaded = true;
        checkBothLoaded();
      };
      this.lowerImage.onerror = () => {
         console.error(`Failed to load lower image: ${this.lowerImage.src}`);
         lowerLoaded = true; // Still count as "done" loading, even if failed
         checkBothLoaded();
      }

      this.upperImage.onload = () => {
        upperLoaded = true;
        checkBothLoaded();
      };
       this.upperImage.onerror = () => {
         console.error(`Failed to load upper image: ${this.upperImage.src}`);
         upperLoaded = true; // Still count as "done" loading, even if failed
         checkBothLoaded();
      }

      // Handle cases where images might already be cached/complete before onload attaches
      if (this.lowerImage.complete) {
         lowerLoaded = true;
         checkBothLoaded();
      }
      if (this.upperImage.complete) {
         upperLoaded = true;
         checkBothLoaded();
      }

    });
  }

  drawLowerImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.lowerImage,
      utils.withGrid(10.5) - cameraPerson.x,
      utils.withGrid(6) - cameraPerson.y
    );
  }
  
  drawUpperImage(ctx, cameraPerson) {
    // Only draw if the image is actually loaded
    if (this.isLoaded) { // Or check this.upperImage.complete
      ctx.drawImage(
        this.upperImage,
        utils.withGrid(10.5) - cameraPerson.x,
        utils.withGrid(6) - cameraPerson.y
      );
    } else {
       // Optional: Draw a placeholder or log if trying to draw unloaded upper image
       // console.warn("Attempted to draw unloaded upper map image.");
    }
  }

  isSpaceTaken(currentX, currentY, direction) {
    const {x,y} = utils.nextPosition(currentX, currentY, direction);
    return this.walls[`${x},${y}`] || false;
  }

  mountObjects() {
    Object.keys(this.gameObjects).forEach(key => {

      let object = this.gameObjects[key];
      object.mapId = key;        // ✅ use this for logic like teleports
      object.id = object.id || key; // ✅ use this only if .id wasn't already defined


      //TODO: determine if this object should actually mount
      object.mount(this);

    })
  }

  async startCutscene(events) {
    this.isCutscenePlaying = true;

    for (let i=0; i<events.length; i++) {
      const eventHandler = new OverworldEvent({
        event: events[i],
        map: this,
      })
      await eventHandler.init();
    }

    this.isCutscenePlaying = false;

    //Reset NPCs to do their idle behavior
    Object.values(this.gameObjects).forEach(object => object.doBehaviorEvent(this))
  }

  checkForActionCutscene() {
    const hero = this.gameObjects["hero"];
    const nextCoords = utils.nextPosition(hero.x, hero.y, hero.direction);
    const match = Object.values(this.gameObjects).find(object => {
      return `${object.x},${object.y}` === `${nextCoords.x},${nextCoords.y}`
    });

    // Early return if no match found or cutscene already playing
    if (!match || this.isCutscenePlaying) {
      return;
    }

    // --- Key Collection Logic ---
    if (match instanceof Key && !match.isCollected) {
      const keyId = match.collect(); // This correctly gets the key name like "Gold Safe Key"
      const wasAdded = utils.keyCollection.addKey(keyId);
    
      if (wasAdded) {
        window.playerInventory.addItem({
          id: keyId, // Use the descriptive name as the unique item ID
          name: keyId, // Display name
          description: `A ${keyId.split(' ')[0].toLowerCase()} key. Looks important.`, // Simple description
          icon: match.sprite.image.src, // Use the key's image source as the icon
          stackable: false, // Keys usually aren't stackable
          quantity: 1
        });
        console.log(`[Inventory] Added "${keyId}" to inventory.`);
        
        const foundText = `You found the ${keyId}!`;
        const keysRemaining = utils.keyCollection.totalKeys - utils.keyCollection.keysFound.length;
        const remainingText = keysRemaining > 0
          ? `${keysRemaining} more key${keysRemaining > 1 ? 's' : ''} to find.`
          : "You've found all the keys!";
    
        this.startCutscene([
          { type: "textMessage", text: foundText },
          { type: "textMessage", text: remainingText }
        ]);
    
        // Find the object key so we can delete it
        const objectKey = Object.keys(this.gameObjects).find(k => this.gameObjects[k] === match);
        if (objectKey) {
          delete this.gameObjects[objectKey];
        }
        this.removeWall(match.x, match.y);
    
        if (utils.keyCollection.hasAllKeys()) {
          window.elliotShouldFade = true;
          utils.gameProgress.chapter1Completed = true;
        }
      }
    
      return;
    }

    if (window.elliotShouldFade && this.gameObjects["npcA"]) {
      window.elliotShouldFade = false;
    
      this.startCutscene([
        { type: "textMessage", text: "You found all my keys!", faceHero: "npcA" },
        { type: "textMessage", text: "Now I can finally pass on to the afterlife..." },
        { type: "textMessage", text: "Thank you for your help!" },
        { who: "npcA", type: "walk", direction: "up" },
        { who: "npcA", type: "stand", direction: "up", time: 500 },
        { type: "textMessage", text: "Elliot's ghost fades away peacefully..." },
        { type: "removeObject", objectId: "npcA" },
        { type: "textMessage", text: "You feel a warm breeze... the ghost has moved on." }
      ]);
    
      return; // prevent other NPC logic from running
    } 

    // --- GhostName Interaction Logic ---
    if (match instanceof GhostName) {
      match.updateTalking();
      if (match.hasBeenIdentified) {
         // Optional: Show message for identified ghost
         // this.startCutscene([{ type: "textMessage", text: `${match.realName} seems at peace.` }]);
         return; // Do nothing or show simple message
      }
      // If not identified, start the guessing process (uses static events from updateTalking)
      if (match.talking && match.talking.length > 0) {
           this.startCutscene(match.talking[0].events);
      }
      return; // Exit after handling GhostName
    }

    // --- General NPC Interaction Logic (Handles npcB, npcC, potentially others) ---
    if (match.talking && match.talking.length > 0) {
      let eventsToRun = match.talking[0].events;

      // Check if the events are defined by a function (like npcC)
      if (typeof eventsToRun[0] === 'function') {

        // Execute the function, passing 'this' (the map) and a config object with 'who'
        eventsToRun = eventsToRun[0](this, { who: match.id || match.mapId }); // <-- CORRECT


      }

      // Ensure we have a valid array of events before starting the cutscene
      if (Array.isArray(eventsToRun) && eventsToRun.length > 0) {
        this.startCutscene(eventsToRun);
      } else {
         // Optional: Log if the function didn't return events or config was bad
         // Check if the original config was a function but didn't return a valid array
         if (typeof match.talking[0].events[0] === 'function') {
             console.warn(`Function-based talking config for ${match.id || match.mapId} did not return a valid event array.`);
         } else if (!Array.isArray(eventsToRun) || eventsToRun.length === 0) {
             console.warn(`No valid events found for ${match.id || match.mapId} after processing talking config.`);
         }
      }
      // No return needed here if it's the last interaction type checked
    }
  }
  
  checkForFootstepCutscene() {
    const hero = this.gameObjects["hero"];
    const coord = `${hero.x},${hero.y}`; // Store coordinate string
    const match = this.cutsceneSpaces[coord];

    // Check if not playing, match exists, and match has at least one cutscene config
    if (!this.isCutscenePlaying && match && match.length > 0) {

      let eventsToRun = match[0].events; // Get the potential events array or function array

      // Check if the first element is a function (indicating conditional logic)
      if (typeof eventsToRun[0] === 'function') {
        // Execute the function, passing 'this' (the map instance)
        eventsToRun = eventsToRun[0](this); // <-- CORRECT

      }

      // Ensure we actually got an array of events back before starting
      // (The function might return null or an empty array in some cases)
      if (Array.isArray(eventsToRun) && eventsToRun.length > 0) {
           this.startCutscene(eventsToRun);
      } else if (typeof eventsToRun[0] !== 'function') {
           // If it wasn't a function initially, and it's not a valid array now, log a warning.
           // This handles cases where the config might be malformed but wasn't a function.
           console.warn(`Cutscene configuration at ${coord} is not a function and did not resolve to a valid event array.`);
      }
      // If it was a function but returned an empty array or null, we just don't start a cutscene, which is fine.
    }
  }

  addWall(x,y) {
    this.walls[`${x},${y}`] = true;
  }
  removeWall(x,y) {
    delete this.walls[`${x},${y}`]
  }
  moveWall(wasX, wasY, direction) {
    this.removeWall(wasX, wasY);
    const {x,y} = utils.nextPosition(wasX, wasY, direction);
    this.addWall(x,y);
  }
}

window.OverworldMaps = {
  Lobby: {
    lowerSrc: "/images/maps/LobbyLower.png",
    upperSrc: "/images/maps/LobbyUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(24),
        y: utils.withGrid(40),
      }),
      npcA: new Person({
        x: utils.withGrid(7),
        y: utils.withGrid(9),
        src: "/images/characters/people/npc1.png",
        behaviorLoop: [
          { type: "stand",  direction: "left", time: 800 },
          { type: "stand",  direction: "up", time: 800 },
          { type: "stand",  direction: "right", time: 1200 },
          { type: "stand",  direction: "up", time: 300 },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "I'm Elliot's ghost...", faceHero: "npcA" },
              { type: "textMessage", text: "I lost my special keyring before I died." },
              { type: "textMessage", text: "I need all my keys back to pass on to the afterlife." },
              { type: "textMessage", text: "Please help me find them around the hotel!" },
              { type: "textMessage", text: "There should be three keys in total." },
            ]
          }
        ]
      }),
      // Hidden keys around the map
      key1: new Key({
        x: utils.withGrid(3),
        y: utils.withGrid(4),
        src: "/images/characters/objects/key.png", 
        id: "Iron Master Key"
      }),
      key2: new Key({
        x: utils.withGrid(10), 
        y: utils.withGrid(2),
        src: "/images/characters/objects/key.png",
        id: "Brass Room Key"
      }),      
      // Keep the other NPC
      npcB: new Person({
        x: utils.withGrid(8),
        y: utils.withGrid(5),
        src: "/images/characters/people/npc2.png",
        talking: [
          {
            events: [
              { type: "textMessage", text: "Have you seen Elliot's ghost?", faceHero: "npcB" },
              { type: "textMessage", text: "They say he can't pass on until all his keys are found." },
              { type: "textMessage", text: "I think one of his keys might be hidden in the kitchen." },
              { type: "textMessage", text: "Poor Elliot, he was the hotel manager you know..." },
            ]
          }
        ]
      }),
      npcC: new Person({
        x: utils.withGrid(11),
        y: utils.withGrid(9),
        src: "/images/characters/people/npc8.png",
        behaviorLoop: [],

        talking: [
          {
            events: [
              (map, eventConfig) => { // Use a function here too
                const npcId = eventConfig.who; // Get the NPC ID if needed later
                if (utils.gameProgress.chapter2Completed) {
                  // Chapter 2 is done, allow puzzle start
                  return [
                    { type: "textMessage", text: "My memories are all backwards... I can't move on like this.", faceHero: npcId },
                    { type: "startReversePuzzle", who: npcId }
                  ];
                } else if (utils.gameProgress.chapter1Completed) {
                   // Chapter 1 done, but not 2
                   return [
                     { type: "textMessage", text: "I sense other spirits still need your help before I can ask for mine.", faceHero: npcId },
                     { type: "textMessage", text: "(Perhaps those ghosts who lost their names?)" }
                   ];
                } else {
                  // Neither Chapter 1 nor 2 is done
                  return [
                    { type: "textMessage", text: "...", faceHero: npcId }, // Ghost might be less coherent initially
                    { type: "textMessage", text: "(This spirit seems deeply troubled, but perhaps not ready to talk yet.)" }
                  ];
                }
              }
            ]
          }
        ]
      }),
    },
    walls: {
      [utils.asGridCoord(7,6)] : true,
      [utils.asGridCoord(8,6)] : true,
      [utils.asGridCoord(7,7)] : true,
      [utils.asGridCoord(8,7)] : true,
      // Add walls for the keys
      [utils.asGridCoord(3,4)] : true,
      [utils.asGridCoord(10,2)] : true,
    },
    cutsceneSpaces: {
      [utils.asGridCoord(7,4)]: [
        {
          events: [
            { who: "npcB", type: "walk",  direction: "left" },
            { who: "npcB", type: "stand",  direction: "up", time: 500 },
            { type: "textMessage", text:"I've heard there's a key hidden in the kitchen!"},
            { type: "textMessage", text:"Elliot used to carry all his keys with him everywhere."},
            { who: "npcB", type: "walk",  direction: "right" },
            { who: "hero", type: "walk",  direction: "down" },
            { who: "hero", type: "walk",  direction: "left" },
          ]
        }
      ],      
      [utils.asGridCoord(5,10)]: [ // Transition point at (5, 10)
        {
          events: [
            { type: "changeMap", map: "Kitchen" }
          ]
        }
      ],
    }
  },
  Kitchen: {
    lowerSrc: "/images/maps/KitchenLower.png",
    upperSrc: "/images/maps/KitchenUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(5),
      }),
      npcB: new Person({
        x: utils.withGrid(10),
        y: utils.withGrid(8),
        src: "/images/characters/people/npc3.png",
        talking: [
          {
            events: [
              { type: "textMessage", text: "I think I saw a key around here somewhere...", faceHero:"npcB" },
              { type: "textMessage", text: "Elliot always loved this kitchen." },
              { type: "textMessage", text: "He'd hide his spare keys in strange places." },
              { type: "textMessage", text: "Check the corners, maybe?" },
            ]
          }
        ]
      }),
      // Third key in the kitchen
      key3: new Key({
        x: utils.withGrid(2),
        y: utils.withGrid(7),
        src: "/images/characters/objects/key.png",
        id: "Gold Safe Key"
      }),      
    },
    walls: {
      // Add walls for the key
      [utils.asGridCoord(2,7)] : true,
    },
    cutsceneSpaces: {
      [utils.asGridCoord(5,10)]: [ // Transition point TO Street
        {
          // OLD: Direct map change
          // events: [
          //   { type: "changeMap", map: "Street" }
          // ]

          // NEW: Conditional map change
          events: [
            (map) => { // Use a function to add logic
              if (utils.gameProgress.chapter1Completed) {
                // Chapter 1 is done, allow entry to Street
                return [
                  { type: "changeMap", map: "Street" }
                ];
              } else {
                // Chapter 1 is NOT done, block entry
                return [
                  { type: "textMessage", text: "The way forward seems blocked by lingering spectral energy..." },
                  { type: "textMessage", text: "(Maybe I should finish helping Elliot first?)" }
                  // Optional: Move the hero back one step
                  // { who: "hero", type: "walk", direction: "up" }, // Assuming down was the direction to trigger
                ];
              }
            }
          ]
        }
      ],
      [utils.asGridCoord(5,4)]: [
        {
          events: [
            { type: "changeMap", map: "Lobby" }
          ]
        }
      ]      
    }
  },
  // Add this new map to your OverworldMaps object
  Street: { // Changed "Kitchen" to "Street"
    lowerSrc: "/images/maps/StreetNorthLower.png", // New lower image source
    upperSrc: "/images/maps/StreetNorthUpper.png", // New upper image source
    gameObjects: {
      // The player character
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(8),
        src: "/images/characters/people/hero2.png" // Create this asset
      }),
      
      // The hotel receptionist NPC to explain the mechanics
      receptionist: new Person({
        x: utils.withGrid(5),
        y: utils.withGrid(5),
        src: "/images/characters/people/npc3.png",
        talking: [
          {
            events: [
              { type: "textMessage", text: "Detective Lumen! Thank you for coming.", faceHero: "receptionist" },
              { type: "textMessage", text: "Our hotel has been haunted by ghosts who can't remember their names." },
              { type: "textMessage", text: "Each ghost remembers one detail about themselves." },
              { type: "textMessage", text: "You'll need to use the hotel's guest book to match these details to names." },
              { type: "textMessage", text: "It's like using a hash map - each detail is a key that maps to a specific name!" },
              { type: "textMessage", text: "When you find a ghost, they'll tell you what they remember." },
              { type: "textMessage", text: "Use that detail to look up their name in the guest book." },
              { type: "textMessage", text: "Good luck, Detective! If you help all our ghosts, this hotel can finally be at peace." }
            ]
          }
        ]
      }),
      
      // Ghost 1 - Eleanor Wright
      ghost1: new GhostName({
        x: utils.withGrid(10),
        y: utils.withGrid(7),
        src: "/images/characters/people/npc4.png", // Create ghost assets
        rememberedDetail: "bakes lemon cake",
        id: "ghost1"
      }),
      
      // Ghost 2 - Thomas Fleming
      ghost2: new GhostName({
        x: utils.withGrid(2),
        y: utils.withGrid(3),
        src: "/images/characters/people/npc1.png",
        rememberedDetail: "carries a golden pocket watch",
        id: "ghost2"
      }),
      
      // Ghost 3 - Josephine Hayes
      ghost3: new GhostName({
        x: utils.withGrid(12),
        y: utils.withGrid(10),
        src: "/images/characters/people/npc2.png",
        rememberedDetail: "plays the violin at midnight",
        id: "ghost3"
      })
    },
    walls: {
      // Add walls around the edges and for decorations
      // Left wall
      [utils.asGridCoord(0,1)]: true,
      [utils.asGridCoord(0,2)]: true,
      [utils.asGridCoord(0,3)]: true,
      [utils.asGridCoord(0,4)]: true,
      [utils.asGridCoord(0,5)]: true,
      [utils.asGridCoord(0,6)]: true,
      [utils.asGridCoord(0,7)]: true,
      [utils.asGridCoord(0,8)]: true,
      [utils.asGridCoord(0,9)]: true,
      [utils.asGridCoord(0,10)]: true,
      
      // Right wall
      [utils.asGridCoord(14,1)]: true,
      [utils.asGridCoord(14,2)]: true,
      [utils.asGridCoord(14,3)]: true,
      [utils.asGridCoord(14,4)]: true,
      [utils.asGridCoord(14,5)]: true,
      [utils.asGridCoord(14,6)]: true,
      [utils.asGridCoord(14,7)]: true,
      [utils.asGridCoord(14,8)]: true,
      [utils.asGridCoord(14,9)]: true,
      [utils.asGridCoord(14,10)]: true,
      
      // Top wall
      [utils.asGridCoord(1,0)]: true,
      [utils.asGridCoord(2,0)]: true,
      [utils.asGridCoord(3,0)]: true,
      [utils.asGridCoord(4,0)]: true,
      [utils.asGridCoord(5,0)]: true,
      [utils.asGridCoord(6,0)]: true,
      [utils.asGridCoord(7,0)]: true,
      [utils.asGridCoord(8,0)]: true,
      [utils.asGridCoord(9,0)]: true,
      [utils.asGridCoord(10,0)]: true,
      [utils.asGridCoord(11,0)]: true,
      [utils.asGridCoord(12,0)]: true,
      [utils.asGridCoord(13,0)]: true,
      
      // Bottom wall
      [utils.asGridCoord(1,12)]: true,
      [utils.asGridCoord(2,12)]: true,
      [utils.asGridCoord(3,12)]: true,
      [utils.asGridCoord(4,12)]: true,
      [utils.asGridCoord(6,12)]: true,
      [utils.asGridCoord(7,12)]: true,
      [utils.asGridCoord(8,12)]: true,
      [utils.asGridCoord(9,12)]: true,
      [utils.asGridCoord(10,12)]: true,
      [utils.asGridCoord(11,12)]: true,
      [utils.asGridCoord(12,12)]: true,
      [utils.asGridCoord(13,12)]: true,
      
      // Reception desk
      [utils.asGridCoord(5,4)]: true,
      [utils.asGridCoord(6,4)]: true,
      
      // Add walls for the ghosts
      [utils.asGridCoord(10,7)]: true,
      [utils.asGridCoord(2,3)]: true,
      [utils.asGridCoord(12,10)]: true,
    },
    cutsceneSpaces: {
      // Exit to main hall (when all ghosts are identified)
      [utils.asGridCoord(5,12)]: [
        {
          events: [
            (map) => {
              // Check if all ghosts have been identified
              const remainingGhosts = window.guestBook.getRemainingGhostsCount();
              if (remainingGhosts === 0) {
                return [
                  { type: "textMessage", text: "All ghosts have been identified! The hotel seems peaceful now." },
                  { type: "textMessage", text: "You've successfully demonstrated how using a hash map can efficiently look up values by key!" },
                  { type: "textMessage", text: "Congratulations on completing this chapter!" },
                  { type: "changeMap", map: "Lobby" }
                ];
              } else {
                return [
                  { type: "textMessage", text: `There are still ${remainingGhosts} ghosts who need your help.` },
                  { type: "textMessage", text: "Try to match each ghost with their name in the guest book." }
                ];
              }
            }
          ]
        }
      ],
      
      // Educational spot about hash maps
      [utils.asGridCoord(3,8)]: [
        {
          events: [
            { type: "textMessage", text: "Hash maps are data structures that store key-value pairs." },
            { type: "textMessage", text: "In JavaScript, objects work like hash maps - you can look up values using keys." },
            { type: "textMessage", text: "Our guest book works like a hash map: descriptions are keys, names are values." },
            { type: "textMessage", text: "This allows us to quickly find names without checking each entry one by one." }
          ]
        }
      ],
      
      // Educational spot about complexity
      [utils.asGridCoord(10,3)]: [
        {
          events: [
            { type: "textMessage", text: "Looking up values in a hash map is very efficient." },
            { type: "textMessage", text: "It's an O(1) operation - meaning it takes the same time regardless of size." },
            { type: "textMessage", text: "Think about how much faster it is to find a name using a detail..." },
            { type: "textMessage", text: "...compared to checking each guest entry one by one (which would be O(n))." }
          ]
        }
      ],
      [utils.asGridCoord(5,10)]: [
        {
          events: [
            { type: "changeMap", map: "Kitchen" }
          ]
        }
      ]      
    }
  },
}