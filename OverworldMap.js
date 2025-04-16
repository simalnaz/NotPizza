class OverworldMap {
  constructor(config) {
    this.overworld = null;
    this.gameObjects = config.gameObjects;
    this.cutsceneSpaces = config.cutsceneSpaces || {};
    this.walls = config.walls || {};

    this.config = config;

    this.lowerImage = new Image();
    this.lowerImage.src = config.lowerSrc;

    this.upperImage = new Image();
    this.upperImage.src = config.upperSrc;

    this.isCutscenePlaying = false;

    this.isLoaded = false;
  }

  loadCollisionMask() {
    // Return a promise for consistency with waitForLoad
    return new Promise(resolve => {
      // If no mask source, resolve immediately
      if (!this.config.collisionMaskSrc) {
        console.log("No collision mask specified, skipping load.");
        resolve();
        return;
      }

      console.log(`Loading collision mask: ${this.config.collisionMaskSrc}`);
      const image = new Image();
      image.src = this.config.collisionMaskSrc;

      image.onload = () => {
        console.log(`Collision mask loaded: ${this.config.collisionMaskSrc}`);
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true }); // Optimization hint
        ctx.drawImage(image, 0, 0);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          let wallCount = 0;

          let collisionOffsetX = 0; // Always 0 now
          let collisionOffsetY = 0; // Default to 0

          // Check if this is the Lobby map based on its collision mask source
          // Make sure this path exactly matches the one in window.OverworldMaps.Lobby
          if (this.config.collisionMaskSrc === "/images/maps/LobbyLowerCollisionMask.png") {
            console.log("Applying Lobby-specific DOWNWARD collision offset.");
            // Apply ONLY the downward offset for the Lobby map
            // collisionOffsetX remains 0
            collisionOffsetX = 3;
            collisionOffsetY = -10; // Shift collision 1 grid unit (16px) DOWN
          }

          if (this.config.collisionMaskSrc === "/images/maps/Lobby2CollisionMask.png") {
            console.log("Applying Lobby-specific DOWNWARD collision offset.");
            // Apply ONLY the downward offset for the Lobby map
            // collisionOffsetX remains 0
            collisionOffsetX = 1;
            collisionOffsetY = 1; // Shift collision 1 grid unit (16px) DOWN
          }

          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {

              // Calculate grid coordinates where the wall will be placed, applying offsets
              // collisionOffsetX will be 0 for all maps
              // collisionOffsetY will be 1 for Lobby, 0 otherwise
              const gridX = utils.withGrid(x + collisionOffsetX);
              const gridY = utils.withGrid(y + collisionOffsetY);

              // Sample the center of the grid cell in the mask image
              const maskPixelX = x * 16 + 8; // Sample center X (Keep sampling based on original x)
              const maskPixelY = y * 16 + 8; // Sample center Y (Keep sampling based on original y)

              // Ensure sample coordinates are within image bounds
              if (maskPixelX < image.width && maskPixelY < image.height) {
                const i = (Math.floor(maskPixelY) * image.width + Math.floor(maskPixelX)) * 4;
                const r = imageData.data[i];
                const g = imageData.data[i + 1];
                const b = imageData.data[i + 2];
            
                // Red pixel (allow some tolerance for anti-aliasing/compression)
                if (r > 200 && g < 50 && b < 50) {
                  // Place the wall at the OFFSET grid coordinate
                  const key = `${gridX},${gridY}`; // <-- USES OFFSET gridX
                  this.walls[key] = true;
                  wallCount++;
              }
              }
            }
          }
          console.log(`Added ${wallCount} walls from collision mask.`);
        } catch (e) {
           console.error("Error processing collision mask:", e);
           // Potentially handle CORS issues if loading from different origin
           if (e.name === 'SecurityError') {
              console.error("Could not read pixel data. Ensure the collision mask image is served from the same origin or has appropriate CORS headers.");
           }
        }
        resolve(); // Resolve the promise once done
      };

      image.onerror = () => {
        console.error(`Failed to load collision mask image: ${this.config.collisionMaskSrc}`);
        resolve(); // Resolve even on error so loading doesn't hang
      };
    });
  }
  // --- END OF NEW METHOD ---

  // MODIFIED waitForLoad to include collision mask loading
  waitForLoad() {
    const lowerPromise = new Promise(resolve => {
      if (this.lowerImage.complete) { resolve(); return; }
      this.lowerImage.onload = resolve;
      this.lowerImage.onerror = () => {
        console.error(`Failed to load lower image: ${this.lowerImage.src}`);
        resolve(); // Resolve on error
      };
    });

    const upperPromise = new Promise(resolve => {
      if (this.upperImage.complete) { resolve(); return; }
      this.upperImage.onload = resolve;
      this.upperImage.onerror = () => {
        console.error(`Failed to load upper image: ${this.upperImage.src}`);
        resolve(); // Resolve on error
      };
    });

    // Add the collision mask loading promise
    const collisionMaskPromise = this.loadCollisionMask(); // <-- CALL THE NEW METHOD

    // Wait for ALL promises (lower, upper, collision mask) to resolve
    return Promise.all([lowerPromise, upperPromise, collisionMaskPromise]).then(() => {
      this.isLoaded = true; // Mark as loaded only after everything is done
      console.log(`Map assets fully loaded for: ${this.config.lowerSrc}`);
      // No need to resolve explicitly here, Promise.all handles it.
    }).catch(error => {
       console.error("Error during map asset loading:", error);
       // Still might want to mark as loaded or handle error state
       this.isLoaded = true; // Or false depending on desired behavior on error
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

    //if (event.type === "centerText") {
      //const centerText = new CenterTextDisplay({
        //text: event.text,
        //duration: event.duration || 3000
      //});
      //centerText.init(resolve);
    //}

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
          console.log("Chapter 1 Completed flag SET to true!", utils.gameProgress.chapter1Completed);
        }
      }
    
      return;
    }

    if (window.elliotShouldFade && this.gameObjects["Elliot"]) {
      window.elliotShouldFade = false;
    
      this.startCutscene([
        { type: "textMessage", text: "You found all my keys!", faceHero: "Elliot" },
        { type: "textMessage", text: "Now I can finally pass on to the afterlife..." },
        { type: "textMessage", text: "Thank you for your help!" },
        { who: "Elliot", type: "walk", direction: "up" },
        { who: "Elliot", type: "stand", direction: "up", time: 500 },
        { type: "textMessage", text: "Elliot's ghost fades away peacefully..." },
        { type: "removeObject", objectId: "Elliot" },
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
      console.log(`  ✅ Match found and not playing for ${coord}. Starting cutscene...`);

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

  Garden: {
    id: "Garden",
    lowerSrc: "/images/maps/HotelGardenLower.png",
    upperSrc: "/images/maps/HotelGardenUpper.png",
    collisionMaskSrc:"/images/maps/HotelGardenCollisionMask.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(25),
        y: utils.withGrid(56),
  }),
},
    // Define where player lands IN Garden coming FROM other maps
    entryPoints: {
      "Lobby": utils.asGridCoord(26, 24), // Coming FROM Lobby, land here
      // Add other maps if needed, e.g., "SecretPassage": utils.asGridCoord(x, y)
    },
  cutsceneSpaces: {
    [utils.asGridCoord(26,24)]: [ 
      { 
        events: [ 
          (map) => { 
            if (window.letterRead) {
              return [
                { type: "changeMap", map: "Lobby" }
              ]; 
            } else {
              return [
                {
                  type: "textMessage",
                  text: "I should read the letter first before leaving the garden."
                } ];
            }
          } 
        ] 
      } 
    ], 
    [utils.asGridCoord(26,26)]: [{
      events: [
        {
          type: "textMessage",
          text: `<i>Thornfield Hotel. Been abandoned for what, twenty years? Yet someone's keeping those roses alive.</i>`
        }
      ]
    }]
  },
},

  Lobby: {
    id: "Lobby",
    lowerSrc: "/images/maps/LobbyLower2.png",
    upperSrc: "/images/maps/LobbyUpper2.png",
    collisionMaskSrc: "/images/maps/Lobby2CollisionMask.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(26),
        y: utils.withGrid(58),
      }),
      Elliot: new Person({
        x: utils.withGrid(26),
        y: utils.withGrid(42),
        src: "/images/characters/people/elliot.png",
        //behaviorLoop: [
          //{ type: "stand",  direction: "left", time: 800 },
          //{ type: "stand",  direction: "up", time: 800 },
          //{ type: "stand",  direction: "right", time: 1200 },
          //{ type: "stand",  direction: "up", time: 300 },
        //],
        talking: [
          {
            // Use a function as the first (and only) event in the array
            events: [
              (map, eventConfig) => { // The function receives the map and event config
                const npcId = eventConfig.who; // Get the ID ("Elliot")
                
                return [ // Start of the array returned by the IF block
                    // --- Initial Dialogue ---
                    { type: "textMessage", text: "<g>You... you can see me? Really see me?</g>", faceHero: npcId},
                    { type: "textMessage", text: "<i>His voice echoes like it's traveling through water.<i>" },
                    { type: "textMessage", text: "I can. Are you the one who sent the letter?" },
                    { type: "textMessage", text: "<g>No... but I've been waiting. So long. The keys... I need my keys. Three of them. I was the keeper of all doors, but now I'm... locked out.</g>", faceHero: npcId},
                    { type: "textMessage", text: "What happens if I find them for you?" },
                    { type: "textMessage", text: "<g>I can finish my final rounds. Check on the other guests. Move on. They scattered when it happened. Brass keys. My responsibility.</g>", faceHero: npcId},
                    { type: "textMessage", text: "<i>His eyes hold a hunger I recognise. The desperate need for completion. For an end.<i>" },
                    { type: "textMessage", text: "I'll find them. What's your name?" },
                    { type: "textMessage", text: "<g>Elliot. I was the concierge. I am the concierge. The keys are still in the hotel. They must be. Please.</g>", faceHero: npcId },
                    {
                      type: "callback",
                      callback: () => {
                        // Identify Elliot immediately after the conversation
                        utils.identifyGhost("Elliot");
                      }
                    },
                    {
                      type: "callback",
                      callback: () => {
                        if (window.overworld && typeof window.overworld.showCenterText === 'function') {
                          window.overworld.showCenterText("Chapter 1: Key Quest", 4000);
                        } 
                      }
                    }
                  ]
                },
              ]
          }
        ],
      }),

      // Hidden keys around the map
      key1: new Key({
        x: utils.withGrid(40),
        y: utils.withGrid(41),
        src: "/images/characters/objects/IronKey.png", 
        id: "Iron Master Key"
      }),
      key2: new Key({
        x: utils.withGrid(47), 
        y: utils.withGrid(33),
        src: "/images/characters/objects/SilverKey.png",
        id: "Silver Room Key"
      }),      

//MODIFY
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

    entryPoints: {
      "Garden": utils.asGridCoord(26, 58),  // Coming FROM Garden, land here
      "Hallway": utils.asGridCoord(58, 37) // Coming FROM Hallway, land here (Adjust Y if needed)
  },
    cutsceneSpaces: {

      [utils.asGridCoord(26, 55)]: [
        {
          events: [
            { type: "textMessage", text: "<i>The air is different here. Thicker. Like breathing through memories that aren't mine.<i>" }
          ]
        }
      ],
      [utils.asGridCoord(25, 54)]: [
        {
          events: [
            { type: "textMessage", text: "It's not time to leave yet!" }
          ]
        }
      ],

      [utils.asGridCoord(7,4)]: [
        {
          events: [
            { who: "npcB", type: "walk",  direction: "left" },
            { who: "npcB", type: "stand",  direction: "up", time: 500 },
            { type: "textMessage", text:"I've heard there's a key hidden in the Hallway!"},
            { type: "textMessage", text:"Elliot used to carry all his keys with him everywhere."},
            { who: "npcB", type: "walk",  direction: "right" },
            { who: "hero", type: "walk",  direction: "down" },
            { who: "hero", type: "walk",  direction: "left" },
          ]
        }
      ],      
      [utils.asGridCoord(58,38)]: [ 
        {
          events: [
            { type: "changeMap", map: "Hallway" }
          ]
        }
      ],
    }
  },

  Hallway: {
    id: "Hallway",
    lowerSrc: "/images/maps/HallwayLower.png",
    upperSrc: "/images/maps/HallwayUpper.png",
    collisionMaskSrc: "/images/maps/HallwayCollisionMask.png",
    gameObjects: { // <-- gameObjects starts here
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(1),
        y: utils.withGrid(20),
      }),
    },
        // Define where player lands IN Hallway coming FROM other maps
        entryPoints: {
          "Lobby": utils.asGridCoord(1, 20),   // Coming FROM Lobby, land here
          "Room1": utils.asGridCoord(13, 16), // Coming FROM Room1, land here (Adjust Y if needed)
          "Room2": utils.asGridCoord(28, 16), // Coming FROM Room2, land here (Adjust Y if needed)
          "Bathroom": utils.asGridCoord(50, 19) // Coming FROM Bathroom, land here (Adjust Y if needed)
          // Add "Street" if there's a transition from Street to Hallway
      },
    cutsceneSpaces: {
      [utils.asGridCoord(10,20)]: [
        {
          events: [
            { type: "textMessage", text: "<i>Something's pulling at me. A tugging behind my ribs with each step deeper into this place.<i>" },
            { type: "textMessage", text: "<i>I'm beginning to understand. This isn't just about finding lost items. This is about finding lost pieces of these people. These... remnants.<i>" }
          ]
        }
      ],
      
      [utils.asGridCoord(13,15)]: [ 
        {
          events: [
            { type: "changeMap", map: "Room1" }
          ]
        }
      ],
      [utils.asGridCoord(28,15)]: [ 
        {
          events: [
            { type: "changeMap", map: "Room2" }
          ]
        }
      ],
      [utils.asGridCoord(50,20)]: [
        {
          events: [
            (map) => { // Use a function to add logic
              if (utils.gameProgress.chapter1Completed) {
                // Chapter 1 is done, allow entry to Street
                return [
                  { type: "changeMap", map: "Bathroom" }
                ];
              } else {
                // Chapter 1 is NOT done, block entry
                return [
                  { type: "textMessage", text: "The way forward seems blocked by lingering spectral energy..." },
                  { type: "textMessage", text: "(Maybe I should finish helping Elliot first?)" }
                ];
              }
            }
          ]
        }
      ],
      [utils.asGridCoord(1,20)]: [
        {
          events: [
            { type: "changeMap", map: "Lobby" }
          ]
        }
      ]      
    }
  },

  Room1: {
    id: "Room1",
    lowerSrc: "/images/maps/Room1Lower.png",
    upperSrc: "/images/maps/Room1Upper.png",
    collisionMaskSrc: "/images/maps/Room1CollisionMask.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(30),
        y: utils.withGrid(50),
      }),

      key3: new Key({
        x: utils.withGrid(25),
        y: utils.withGrid(46),
        src: "/images/characters/objects/GoldenKey.png",
        id: "Gold Safe Key"
      }),      

      Marilyn: new Person({
        x: utils.withGrid(30),
        y: utils.withGrid(40),
        src: "/images/characters/people/marilyn.png",
        talking: [
          {
            events: [
              { type: "textMessage", text: "<g>You're not the usual one they send. The others couldn't see us. Just moved things around, made noise.<g>", faceHero: "Marilyn" },
              { type: "textMessage", text: "<g>You're different. There's more to you.<g>", faceHero: "Marilyn" },
              { type: "textMessage", text: "I'm looking for keys. For Elliot." },
              { type: "textMessage", text: "<g>Elliot. Poor boy. Always so dedicated. One of his keys is here, yes. I've kept it safe.<g>", faceHero: "Marilyn" },
              { type: "textMessage", text: "And what's keeping you here?" },
              { type: "textMessage", text: "<g>My name. They've forgotten my name. All those years being somebody, and now... no one remembers who I was.<g>", faceHero: "Marilyn" },
              { type: "textMessage", text: "<i>There's a guestbook in the lobby. Maybe I can find her there.<i>" },
              { type: "textMessage", text: "I'll come back for you." },
              { type: "textMessage", text: "<g>They all say that, darling.<g>", faceHero: "Marilyn" }
            ]
          }
        ]
      }),      
  },     entryPoints: {
    "Hallway": utils.asGridCoord(30, 50) // Coming FROM Hallway, land here
},
cutsceneSpaces:{
    [utils.asGridCoord(30,45)]: [
      {
        events: [
          { type: "textMessage", text: "<i>Room 118. The presidential suite according to the number plate. Someone important stayed here.<i>" },
        ]
      }
    ],
    [utils.asGridCoord(30,50)]: [
      {
        events: [
          { type: "changeMap", map: "Hallway" }
        ]
      }
    ]      
  },
},

  Street: { 
    lowerSrc: "/images/maps/StreetNorthLower.png", // New lower image source
    upperSrc: "/images/maps/StreetNorthUpper.png", // New upper image source
    gameObjects: {
      // The player character
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(8),
        src: "/images/characters/people/detective.png" // Create this asset
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
        src: "/images/characters/people/elliot.png",
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
            { type: "changeMap", map: "Hallway" }
          ]
        }
      ]      
    }
  }
  }