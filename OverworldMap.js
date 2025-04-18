// /Users/simal/Desktop/Detective/OverworldMap.js
// REMOVED: this.walls = config.walls || {}; from constructor
// REMOVED: addWall, removeWall, moveWall methods entirely
// REMOVED: this.removeWall(...) from checkForActionCutscene
// REMOVED: walls: { ... } blocks from all map definitions in window.OverworldMaps

class OverworldMap {
  constructor(config) {
    this.overworld = null;
    this.gameObjects = config.gameObjects;
    this.cutsceneSpaces = config.cutsceneSpaces || {};
    // this.walls = config.walls || {}; // <-- REMOVED: Collision mask handles this now
    this.walls = {}; // Initialize as empty, will be populated by loadCollisionMask

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
                  this.walls[key] = true; // <-- KEPT: Populates walls from mask
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

  // KEPT: This method now checks against the walls populated by loadCollisionMask
  isSpaceTaken(currentX, currentY, direction) {
    const { x, y } = utils.nextPosition(currentX, currentY, direction);
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

    for (let i = 0; i < events.length; i++) {
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
    if (!hero) return;
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

        if (window.keyArrayDisplay) {
          window.keyArrayDisplay.show();
          window.keyArrayDisplay.refresh();
        }

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

    if (window.elliotShouldFade && this.gameObjects["Elliot"]) {
      window.elliotShouldFade = false;

      if (window.keyArrayDisplay) {
        window.keyArrayDisplay.hide();
      }

      this.startCutscene([
        { type: "textMessage", text: "You found all my keys!", faceHero: "Elliot" },
        { type: "textMessage", text: "Now I can finally pass on to the afterlife..." },
        { type: "textMessage", text: "Thank you for your help!" },
        { who: "Elliot", type: "walk", direction: "down", time: 500 },
        { who: "Elliot", type: "walk", direction: "down", time: 500 },
        { type: "textMessage", text: "Elliot's ghost fades away peacefully..." },
        { type: "removeObject", objectId: "Elliot" },
        { type: "textMessage", text: "You feel a warm breeze... the ghost has moved on." }
      ]);

      return;
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
        eventsToRun = eventsToRun[0](this, { who: match.id || match.mapId }); // <-- CORREC
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
    // --- ADDED: Book Deletion Logic ---
    // If the interacted object was the guest book, remove it after interaction
    if (match instanceof Book && match.id === "guestBook") {
      console.log(`[OverworldMap] Interacted with guestBook (${match.id}). Removing it.`);
      // Find the object key so we can delete it
      const objectKey = Object.keys(this.gameObjects).find(k => this.gameObjects[k] === match);
      if (objectKey) {
        delete this.gameObjects[objectKey];
        console.log(`[OverworldMap] Successfully removed ${objectKey} from gameObjects.`);
      } else {
        console.warn(`[OverworldMap] Could not find object key for guestBook (${match.id}) to remove it.`);
      }
      // No need to remove wall as wall logic is separate now
    }
    // --- END: Book Deletion Logic ---
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

  addWall(x, y) {
    this.walls[`${x},${y}`] = true;
  }
  removeWall(x, y) {
    delete this.walls[`${x},${y}`]
  }
  moveWall(wasX, wasY, direction) {
    this.removeWall(wasX, wasY);
    const { x, y } = utils.nextPosition(wasX, wasY, direction);
    this.addWall(x, y);
  }
}

window.OverworldMaps = {

  Garden: {
    id: "Garden",
    lowerSrc: "/images/maps/HotelGardenLower.png",
    upperSrc: "/images/maps/HotelGardenUpper.png",
    collisionMaskSrc: "/images/maps/HotelGardenCollisionMask.png",
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
      [utils.asGridCoord(26, 24)]: [
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
                  }];
              }
            }
          ]
        }
      ],
      [utils.asGridCoord(26, 26)]: [{
        events: [
          {
            type: "textMessage",
            text: `<i>Thornfield Hotel. Been abandoned for what, twenty years? Yet someone's keeping those roses alive.</i>`
          }
        ]
      }],
      [utils.asGridCoord(25, 31)]: [
        {
          events: [
            {
              type: "callback",
              callback: function () {
                const realMap = window.overworld.map;
              
                console.log("🎯 Entered callback in Garden");
                console.log("chapter1Completed:", utils.gameProgress.chapter1Completed);
                console.log("chapter2Completed:", utils.gameProgress.chapter2Completed);
                console.log("chapter3Completed:", utils.gameProgress.chapter3Completed);
                console.log("npc1 already exists?", !!realMap.gameObjects["npc1"]);
              
                if (
                  utils.gameProgress.chapter1Completed &&
                  utils.gameProgress.chapter2Completed &&
                  utils.gameProgress.chapter3Completed &&
                  !realMap.gameObjects["npc1"]
                ) {
                  console.log("✅ Spawning npc1 for endgame");
              
                  realMap.gameObjects["npc1"] = new Person({
                      id: "npc1",
                      x: utils.withGrid(25), // maybe one tile to the right of hero
                      y: utils.withGrid(30),
                      src: "/images/characters/people/npc1.png",
                      behaviorLoop: [
                        { type: "stand", direction: "left", time: 800 },
                        { type: "stand", direction: "right", time: 800 }
                      ],
                      talking: [
                        {
                          events:[
                            { type: "textMessage", text: "<g>entire sentence here</g>"},
                          { type: "textMessage", text: "<i>The letter promised I could help them. It never promised I would survive the process.</i>" },
                          { type: "textMessage", text: "<g>Beautiful, aren't they? I've tended them for fifty years. Before and after.</g>", faceHero: "npc1" },
                          { type: "textMessage", text: "I can't leave." },
                          { type: "textMessage", text: "<g>No. Not yet. Not until you've given everything. Then you'll join us.</g>", faceHero: "npc1" },
                          { type: "textMessage", text: "And if I refuse to give any more?" },
                          { type: "textMessage", text: "<g>Then you'll remain as you are. Half here, half there. Never whole in either world.</g>", faceHero: "npc1" },
                          { type: "textMessage", text: "<i>The case I couldn't solve. The price I couldn't anticipate. Every ghost I help takes another piece. Until there's nothing left but...</i>" },
             
                          { type: "textMessage", text: "...but an echo of what remains." },
                        
                          { type: "textMessage", text: "<g>Are you ready to finish this? To give the final piece?</g>", faceHero: "npc1" },
                          { type: "textMessage", text: "What's left to give?" },
                          { type: "textMessage", text: "<g>Your identity. Your name. The essence of who you are.</g>", faceHero: "npc1" },
                          { type: "textMessage", text: "<i>The ultimate sacrifice. To be forgotten. To forget oneself.</i>" },
                          { type: "textMessage", text: "I give you my name. My self. Take it and be free." },
             
                          { type: "textMessage", text: "<g>Thank you. We can all move on now.</g>", faceHero: "npc1" },
               
                          { type: "textMessage", text: "<i>A warmth leaves your chest... and something you once were, no longer is. You've moved on.</i>" },
                          { type: "removeObject", objectId: "hero" },
{
  type: "callback",
  callback: () => {
    const endScreen = document.getElementById("game-end-screen");
    if (endScreen) {
      endScreen.style.opacity = "1";
    }
  }
}

                        ]
                      }
                    ]
                  });
                  realMap.gameObjects["npc1"].mount(realMap);
      
                  //map.addWall(utils.withGrid(26), utils.withGrid(31)); // Optional
                }
              }
            },
          ]
        }
      ]
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
        talking: [
          {
            events: [
              (map, eventConfig) => {
                const npcId = eventConfig.who;

                return [
                  { type: "textMessage", text: "<g>You... you can see me? Really see me?</g>", faceHero: npcId },
                  { type: "textMessage", text: "<i>His voice echoes like it's traveling through water.</i>" },
                  { type: "textMessage", text: "I can. Are you the one who sent the letter?" },
                  { type: "textMessage", text: "<g>No... but I've been waiting. So long. The keys... I need my keys. Three of them. I was the keeper of all doors, but now I'm... locked out.</g>", faceHero: npcId },
                  { type: "textMessage", text: "What happens if I find them for you?" },
                  { type: "textMessage", text: "<g>I can finish my final rounds. Check on the other guests. Move on. They scattered when it happened. Brass keys. My responsibility.</g>", faceHero: npcId },
                  { type: "textMessage", text: "<i>His eyes hold a hunger I recognise. The desperate need for completion. For an end.</i>" },
                  { type: "textMessage", text: "I'll find them. What's your name?" },
                  { type: "textMessage", text: "<g>Elliot. I was the concierge. I am the concierge. The keys are still in the hotel. They must be. Please.</g>", faceHero: npcId },
                  {
                    type: "callback",
                    callback: () => {
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
                ];
              }
            ]
          }
        ]
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
      [utils.asGridCoord(26, 56)]: [
        {
          events: [
            { type: "textMessage", text: "It's not time to leave yet!" }
          ]
        }
      ],
      [utils.asGridCoord(59, 38)]: [
        {
          events: [
            { type: "changeMap", map: "Hallway" }
          ]
        }
      ],

    },
    // walls: { ... } // <-- REMOVED
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
        [utils.asGridCoord(10, 20)]: [
          {
            events: [
              { type: "textMessage", text: "<i>Something's pulling at me. A tugging behind my ribs with each step deeper into this place.<i>" },
              { type: "textMessage", text: "<i>I'm beginning to understand. This isn't just about finding lost items. This is about finding lost pieces of these people. These... remnants.<i>" }
            ]
          }
        ],

        [utils.asGridCoord(13, 15)]: [
          {
            events: [
              { type: "changeMap", map: "Room1" }
            ]
          }
        ],
        [utils.asGridCoord(28, 15)]: [
          {
            events: [
              { type: "changeMap", map: "Room2" }
            ]
          }
        ],
        [utils.asGridCoord(50, 20)]: [
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
        [utils.asGridCoord(1, 20)]: [
          {
            events: [
              (map) => {
                if (
                  utils.gameProgress.chapter1Completed &&
                  utils.gameProgress.chapter2Completed &&
                  utils.gameProgress.chapter3Completed
                ) {
                  return [
                    { type: "changeMap", map: "HauntedLobby" }
                  ];
                } else {
                  return [
                    { type: "changeMap", map: "Lobby" }
                  ];
                }
              }
            ]
          }
        ]
      }        
      // walls: { ... } // <-- REMOVED
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
          id: "Marilyn",
          x: utils.withGrid(30),
          y: utils.withGrid(40),
          src: "/images/characters/people/marilyn.png",
          talking: [
            {
              events: [
                function (map, eventConfig) {
                  const npcId = "Marilyn";
        
                  if (utils.gameProgress.chapter2Completed) {
                    if (utils.gameProgress.chapter3Completed) {
                      return [
                        { type: "textMessage", text: "<g>My story... it's clear now. Thank you again, darling.</g>", faceHero: npcId },
                      ];
                    } else {
                      return [
                        { type: "textMessage", text: "<g>Did you find me? In that book of yours?</g>", faceHero: npcId },
                        { type: "textMessage", text: "Marilyn Winters. July 1963. Room 118." },
                        { type: "textMessage", text: "<g>Yes! That's me. Marilyn Winters. I was filming a picture in town. 'Midnight Reverie.' Not my best work.</g>", faceHero: npcId },
                        { type: "textMessage", text: "I need to help you remember your story. From end to beginning." },
                        { type: "textMessage", text: "<g>It's all jumbled now. Pieces everywhere.</g>", faceHero: npcId },
                        { type: "textMessage", text: "Let's start with your last memory here." },
                        { type: "startReversePuzzle", who: npcId }
                      ];
                    }
                  } else {
                    return [
                      { type: "textMessage", text: "<g>You're not the usual one they send. The others couldn't see us. Just moved things around, made noise.</g>", faceHero: npcId },
                      { type: "textMessage", text: "<g>You're different. There's more to you.</g>", faceHero: npcId },
                      { type: "textMessage", text: "And what's keeping you here?" },
                      { type: "textMessage", text: "<g>My name. They've forgotten my name. All those years being somebody, and now... no one remembers who I was.</g>", faceHero: npcId },
                      { type: "textMessage", text: "<i>There's a guestbook nearby. Maybe I can find her there.</i>" },
                      { type: "textMessage", text: "I'll come back for you." },
                      { type: "textMessage", text: "<g>They all say that, darling.</g>", faceHero: npcId },
                      {
                        type: "callback",
                        callback: () => {
                          utils.identifyGhost("Marilyn");
                        }
                      },
              ];
                  }
                }
              ]
            }
          ]
        }),        
      }, // <-- gameObjects closing brace
      entryPoints: {
        "Hallway": utils.asGridCoord(30, 50) // Coming FROM Hallway, land here
      },
      cutsceneSpaces: {
        [utils.asGridCoord(30, 45)]: [
          {
            events: [
              { type: "textMessage", text: "<i>Room 118. The presidential suite according to the number plate. Someone important stayed here.<i>" },
            ]
          }
        ],
        [utils.asGridCoord(30, 50)]: [
          {
            events: [
              { type: "changeMap", map: "Hallway" }
            ]
          }
        ]
      },
      // walls: { ... } // <-- REMOVED comment is fine
    }, // <-- Room1 closing brace



    Room2: {
      id: "Room2",
      lowerSrc: "/images/maps/Room2Lower.png",
      upperSrc: "/images/maps/Room2Upper.png",
      collisionMaskSrc: "/images/maps/Room2CollisionMask.png",
      gameObjects: {
        hero: new Person({
          isPlayerControlled: true,
          x: utils.withGrid(22),
          y: utils.withGrid(29),
        }),
      },
      entryPoints: {
        "Hallway": utils.asGridCoord(22, 29),   // Coming FROM, land here
      },
      cutsceneSpaces: {
        [utils.asGridCoord(22, 27)]: [
          {
            events: [
              { type: "textMessage", text: "<i>Hmm nothing in here...<i>" },
            ]
          }
        ],

        [utils.asGridCoord(22, 29)]: [
          {
            events: [
              { type: "changeMap", map: "Hallway" }
            ]
          }
        ],
      },
      // walls: { ... } // <-- REMOVED
    },

    Bathroom: {
      id: "Bathroom",
      lowerSrc: "/images/maps/Bathroom2Lower.png",
      upperSrc: "/images/maps/Bathroom2Upper.png",
      collisionMaskSrc: "/images/maps/Bathroom2CollisionMask.png",
      gameObjects: {
        hero: new Person({
          isPlayerControlled: true,
          x: utils.withGrid(25),
          y: utils.withGrid(29),
        }),
        guestBook: new Book({
          id: "guestBook", // The requested ID
          x: utils.withGrid(32), // Position near the bathtub area
          y: utils.withGrid(25), // Position near the bathtub area
          src: "/images/characters/objects/GuestBook.png", // Make sure this image exists
          talking: [
            {
              events: [
                { type: "textMessage", text: "You found the Guest Book!" },
                {
                  type: "callback", // <<< ADDED: This event adds the item to inventory
                  callback: () => {
                    window.playerInventory.addItem({
                      id: "guestBook", // Unique ID for the inventory item
                      name: "Guest Book",
                      icon: "/images/characters/objects/GuestBook.png", // Use the same image
                      stackable: false,
                      quantity: 1,
                      // Optional: Add an onUse function if needed later
                      // onUse: () => { ... }
                    });
                    // Optional: Refresh inventory UI if you have one
                    // if (window.inventoryUI) window.inventoryUI.refresh();
                  }
                },
                { // <<< ADDED: Trigger Chapter 2 title
                  type: "callback",
                  callback: () => {
                    if (window.overworld && typeof window.overworld.showCenterText === 'function') {
                      window.overworld.showCenterText("Chapter 2: Hash Map Haunting", 4000);
                    }
                  }
                }
              ]
            }
          ]
        }),
      },
      entryPoints: {
        "Hallway": utils.asGridCoord(25, 29),   // Coming FROM, land here
      },
      cutsceneSpaces: {
        [utils.asGridCoord(25, 27)]: [
          {
            events: [
              { type: "textMessage", text: "<i>The cold doesn't bother them. But they recreate warmth out of habit, memory.<i>" },
              { type: "textMessage", text: "What's happening to me?" },
              { type: "textMessage", text: "*A whisper comes from the bathtub*" },
              { type: "textMessage", text: "<g>You give to receive. That's the exchange.<g>" },
              { type: "textMessage", text: "Who's there?" },
              { type: "textMessage", text: "<g>Don't look so frightened. It's a fair trade. Pieces of you for pieces of their peace.<g>" },
              { type: "textMessage", text: "Who are you?" },
              { type: "textMessage", text: "<g>The caretaker. Before. And after. I watched them all come and go. And now I watch them stay.<g>" },
              { type: "textMessage", text: "<i>Why he doesn't show himself...<i>" },
              { type: "textMessage", text: "I'm looking for the guest book. Do you have it?" },
              { type: "textMessage", text: "<g>In the water.<g>" },
              { type: "textMessage", text: "<g>Don't forget smart boy... When you help us cross, we take something with us. A toll. You were chosen because you have enough to spare. For now.<g>" },
              { type: "textMessage", text: "<i>I should leave. Walk out now. But the weight of that letter... and these souls. They've waited so long. I must help.<i>" }
            ]
          }
        ],


        [utils.asGridCoord(25, 29)]: [
          {
            events: [
              { type: "changeMap", map: "ChangedHallway" }
            ]
          }
        ],
      },
      // walls: { ... } // <-- REMOVED
    },

    ChangedHallway: {
      id: "ChangedHallway",
      lowerSrc: "/images/maps/ChangedHallwayLower.png",
      upperSrc: "/images/maps/ChangedHallwayUpper.png",
      collisionMaskSrc: "/images/maps/ChangedHallwayCollisionMask.png",
      gameObjects: { // <-- gameObjects starts here
        hero: new Person({
          isPlayerControlled: true,
          x: utils.withGrid(50),
          y: utils.withGrid(20),
        }),
      },
      // Define where player lands IN Hallway coming FROM other maps
      entryPoints: {
        "Room3": utils.asGridCoord(13, 16), // Coming FROM Room1, land here (Adjust Y if needed)
        "Room4": utils.asGridCoord(28, 16), // Coming FROM Room2, land here (Adjust Y if needed)
        "Lounge": utils.asGridCoord(50, 20) // Coming FROM Bathroom, land here (Adjust Y if needed)
      },
      cutsceneSpaces: {
        [utils.asGridCoord(28, 20)]: [
          {
            events: [
              { type: "textMessage", text: "<i>Huh? How did the room numbers changed?.<i>" },
            ]
          }
        ],

        [utils.asGridCoord(13, 15)]: [
          {
            events: [
              { type: "changeMap", map: "Room3" }
            ]
          }
        ],
        [utils.asGridCoord(28, 15)]: [
          {
            events: [
              { type: "changeMap", map: "Room4" }
            ]
          }
        ],
        [utils.asGridCoord(50, 20)]: [
          {
            events: [
              { type: "changeMap", map: "Lounge" }
            ]
          }
        ],

        [utils.asGridCoord(1, 20)]: [
          (map) => {
            if (utils.gameProgress.chapter2Completed) {
              return {
                events: [
                  { type: "changeMap", map: "Lobby" }
                ]
              };
            } else {
              return {
                events: [
                  { type: "textMessage", text: "The way forward seems blocked by lingering spectral energy..." },
                  { type: "textMessage", text: "(Maybe I should finish helping guests first?)" }
                ]
              };
            }
          }
        ]        
      },
    },
    Room3: {
      id: "Room3",
      lowerSrc: "/images/maps/Room3Lower.png",
      upperSrc: "/images/maps/Room3Upper.png",
      collisionMaskSrc: "/images/maps/Room3CollisionMask.png",
      gameObjects: {
        hero: new Person({
          isPlayerControlled: true,
          x: utils.withGrid(30),
          y: utils.withGrid(50),
        }),

        ghost4: new GhostName({ // Keeping this as requested
          id: "ghost4", // Keep ID consistent
          x: utils.withGrid(29), // Position where Thomas Person was
          y: utils.withGrid(42), // Position where Thomas Person was
          src: "/images/characters/people/thomas.png",
          rememberedDetail: "49th of anniversary with his wife",
          initialTalking: [ // <-- ADD THIS
            {
              events: [
                { type: "textMessage", text: "<g>Have you come to make us leave?</g>", faceHero: "ghost4" }, // Use ghost4 ID
                { type: "textMessage", text: "<g>It's our anniversary. Fifty years we planned to celebrate here. We only made it to forty-nine.</g>", faceHero: "ghost4" },
                { type: "textMessage", text: "I'm trying to help the guests find peace." },
                { type: "textMessage", text: "<g>Peace? There's no peace in forgetting. In being forgotten.</g>", faceHero: "ghost4" },
                { type: "textMessage", text: "The guest book. I can find your names." },
                { type: "textMessage", text: "<g>What good is a name without the story behind it?</g>", faceHero: "ghost4" },
                { type: "textMessage", text: "<i>The hash map puzzle. Match memories to names. But they want more than identification. They want to be remembered.</i>" },
                { type: "textMessage", text: "Tell me your story. I'll remember for you." },
                { type: "textMessage", text: "<g>Room 301. June 17th, 1972. I proposed on the balcony.</g>", faceHero: "ghost4" },
                // The callback to set initialDialogueDone = true will be added automatically by GhostName.js
              ]
            }
          ]
        }), // <-- ADDED COMMA

        ghost5: new GhostName({ // Keeping this as requested
          id: "ghost5", // Keep ID consistent
          x: utils.withGrid(33), // Position where Eleanor Person was
          y: utils.withGrid(42), // Position where Eleanor Person was
          src: "/images/characters/people/eleanor.png",
          rememberedDetail: "dedicated her life to love",
          initialTalking: [ // <-- ADD THIS
            {
              events: [
                { type: "textMessage", text: "<g>I love my husband very much...</g>", faceHero: "ghost5" }, // Use ghost5 ID
                // The callback to set initialDialogueDone = true will be added automatically by GhostName.js
              ]
            }
          ]
        }), // <-- ADDED COMMA


      }, // <-- gameObjects closing brace
      entryPoints: {
        "ChangedHallway": utils.asGridCoord(30, 50) // Coming FROM Hallway, land here
      },
      cutsceneSpaces: {
        [utils.asGridCoord(30, 50)]: [
          {
            events: [
              { type: "changeMap", map: "ChangedHallway" }
            ]
          }
        ]
      },
    }, // <-- Room3 closing brace

    Room4: {
      id: "Room4",
      lowerSrc: "/images/maps/Room4Lower.png",
      upperSrc: "/images/maps/Room4Upper.png",
      collisionMaskSrc: "/images/maps/Room4CollisionMask.png",
      gameObjects: {
        hero: new Person({
          isPlayerControlled: true,
          x: utils.withGrid(11),
          y: utils.withGrid(31),
        }),

        ghost6: new GhostName({
          id: "ghost6", // Keep ID consistent
          x: utils.withGrid(11), // Position where Thomas Person was
          y: utils.withGrid(27), // Position where Thomas Person was
          src: "/images/characters/people/reginald.png",
          rememberedDetail: "complains, every day, every second",
          initialTalking: [ // <-- ADD THIS
            {
              events: [
                { type: "textMessage", text: "<g>GET OUT! This is MY ROOM!</g>", faceHero: "ghost6" },
                { type: "textMessage", text: "<i>Violent death leaves violent energy.</i>" },
                { type: "textMessage", text: "I'm trying to help you move on." },
                { type: "textMessage", text: "<g>Move on to what? More nothing? I'm not finished here!</g>", faceHero: "ghost6" },
                { type: "textMessage", text: "What's your name? Let me find you in the book." },
                { type: "textMessage", text: "<g>Name? What does it matter now? I was somebody. Then I was nobody. Then I was gone.</g>", faceHero: "ghost6" },
                { type: "textMessage", text: "Tell me something about your stay. A detail. Anything." },
                { type: "textMessage", text: "<g>Room service. I threw a tray at the wall. Complained about the temperature. The steak was raw.</g>", faceHero: "ghost6" },
              ]
            }
          ]
        }),

      }, entryPoints: {
        "ChangedHallway": utils.asGridCoord(11, 31) // Coming FROM Hallway, land here
      },
      cutsceneSpaces: {

        [utils.asGridCoord(11, 31)]: [
          {
            events: [
              { type: "changeMap", map: "ChangedHallway" }
            ]
          }
        ]
      },
      [utils.asGridCoord(11, 30)]: [
        {
          events: [
            (map) => {
              if (utils.gameProgress.chapter2Completed) {
                return [
                  { type: "textMessage", text: "<i>I should go and help Marilyn now...</i>" }
                ];
              } else {
                return [];
              }
            }
          ]
        }
      ]
    },

    Lounge: {
      id: "Lounge",
      lowerSrc: "/images/maps/LoungeLower.png",
      upperSrc: "/images/maps/LoungeUpper.png",
      collisionMaskSrc: "/images/maps/LoungeCollisionMask.png",
    
      gameObjects: {
        hero: new Person({
          isPlayerControlled: true,
          x: utils.withGrid(1),
          y: utils.withGrid(4),
        }),
        npc1: new Person({
          x: utils.withGrid(11),
          y: utils.withGrid(4),
          src: "/images/characters/people/npc1.png",
          talking: [
            {
              events: [
                { who: "npc1", type: "stand", direction: "left", time: 300 },
                { who: "npc1", type: "stand", direction: "left", time: 300 },
                { who: "npc1", type: "stand", direction: "left", time: 300 },
                { who: "npc1", type: "stand", direction: "left", time: 300 },
                { type: "textMessage", text: "<i>The anger sits in me now. Foster's contribution. It simmers just below the surface, looking for release.</i>" },
                { type: "textMessage", text: "<i>How is this hotel changing every time? Or am I losing my mind..?</i>" },
                { type: "textMessage", text: "<g>You're changing. I can see it. The others' essences mixing with yours.</g>", faceHero: "npc1" },
                { type: "textMessage", text: "I'm helping them move on." },
                { type: "textMessage", text: "<g>At what cost? How much of yourself will remain when you're done?</g>", faceHero: "npc1" },
                { type: "textMessage", text: "Enough. There will be enough." },
                { type: "textMessage", text: "<g>I've watched the others try. They came with their equipment, their cameras. They couldn't see us, so we couldn't take from them. But you... You're perfect.</g>", faceHero: "npc1" },
                { type: "textMessage", text: "I'm looking for Marilyn Winters. The actress." },
                { type: "textMessage", text: "<g>Room 118. She comes to the lounge sometimes, when she remembers who she is. Her story's in fragments now. Backwards and forwards. Time doesn't move right for us here.</g>", faceHero: "npc1" },
                { type: "textMessage", text: "<i>The linked list puzzle. Reconstructing a life story in reverse.</i>" },
                { type: "textMessage", text: "How do I help her?" },
                { type: "textMessage", text: "<g>Find the fragments. Connect them. Beginning to end. Or in her case, end to beginning. She needs to remember her story in the right order to let it go.</g>", faceHero: "npc1" },
                { // <<< ADDED: Trigger Chapter 3 title
                  type: "callback",
                  callback: () => {
                    if (window.overworld && typeof window.overworld.showCenterText === 'function') {
                      window.overworld.showCenterText("Chapter 3:  The Backward Tale", 4000);
                    }
                  }
                }
              ]
            }
          ]
        }),
      }, // ✅ CLOSE gameObjects here
    
      entryPoints: {
        "ChangedHallway": utils.asGridCoord(1, 4),
      },
    
      cutsceneSpaces: {
        [utils.asGridCoord(1, 4)]: [
          {
            events: [
              { type: "textMessage", text: "<i>Can't go back now...<i>" },
            ]
          }
        ],
        [utils.asGridCoord(56, 4)]: [
          {
            events: [
              { type: "changeMap", map: "Hallway" }
            ]
          }
        ]
      }
    },
    HauntedLobby: {
      id: "HauntedLobby",
      lowerSrc: "/images/maps/HauntedLobbyLower.png",
      upperSrc: "/images/maps/HauntedLobbyUpper.png",
      collisionMaskSrc: "/images/maps/HauntedLobbyCollisionMask.png",
    
      gameObjects: {
        hero: new Person({
          isPlayerControlled: true,
          x: utils.withGrid(50),
          y: utils.withGrid(15),
        }),
        Charlie: new Person({
          x: utils.withGrid(25),
          y: utils.withGrid(17),
          src: "/images/characters/people/charlie.png",
          talking: [
            {
              events: [
                { type: "textMessage", text: "<i>I feel hollow. Pieces gone. Duty. Ambition. What remains?</i>" },
                { type: "textMessage", text: "<g>You've done well. Three of them gone. Peaceful now.</g>", faceHero: "Charlie" },
                { type: "textMessage", text: "What's happening to me?" },
                { type: "textMessage", text: "<g>The exchange. Your essence for their freedom. They needed parts of the living to complete themselves for the journey.</g>", faceHero: "Charlie" },
                { type: "textMessage", text: "And what do I get in return?" },
                { type: "textMessage", text: "<g>Understanding. The privilege of knowing what lies between.</g>", faceHero: "Charlie" },
                { type: "textMessage", text: "That's not enough." },
                { type: "textMessage", text: "<g>It was never about what you would receive. Only what you would give.</g>", faceHero: "Charlie" },
                { type: "textMessage", text: "<g>You can leave now. Take what remains of yourself and go.</g>", faceHero: "Charlie" },
                { type: "textMessage", text: "<i>I should feel angry. Foster's rage should be boiling over. But I feel... nothing. Empty spaces where emotions should be.</i>" },
                { type: "textMessage", text: "I'm becoming like them." },
                { type: "textMessage", text: "<g>Yes. The more you give, the less remains. Another ghost for the Thornfield Hotel.</g>", faceHero: "Charlie" },
                { type: "textMessage", text: "<i>Too late. Too many pieces gone.</i>" }
              ]
            }
          ]
        }),
      },
    
      entryPoints: {
        "ChangedHallway": utils.asGridCoord(50, 15),
      },
    
      cutsceneSpaces: {
        [utils.asGridCoord(50, 15)]: [
          {
            events: [
              { type: "textMessage", text: "<i>Can't go back now...<i>" },
            ]
          }
        ],
        [utils.asGridCoord(25, 38)]: [
          {
            events: [
              { type: "changeMap", map: "Garden" }
            ]
          }
        ]
      }
    } 
  }