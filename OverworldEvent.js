class OverworldEvent {
  constructor({ map, event}) {
    this.map = map;
    this.event = event;
  }

  stand(resolve) {
    const who = this.map.gameObjects[ this.event.who ];
    who.startBehavior({
      map: this.map
    }, {
      type: "stand",
      direction: this.event.direction,
      time: this.event.time
    })
    
    //Set up a handler to complete when correct person is done walking, then resolve the event
    const completeHandler = e => {
      if (e.detail.whoId === this.event.who) {
        document.removeEventListener("PersonStandComplete", completeHandler);
        resolve();
      }
    }
    document.addEventListener("PersonStandComplete", completeHandler)
  }

  walk(resolve) {
    const who = this.map.gameObjects[ this.event.who ];
    who.startBehavior({
      map: this.map
    }, {
      type: "walk",
      direction: this.event.direction,
      retry: true
    })

    //Set up a handler to complete when correct person is done walking, then resolve the event
    const completeHandler = e => {
      if (e.detail.whoId === this.event.who) {
        document.removeEventListener("PersonWalkingComplete", completeHandler);
        resolve();
      }
    }
    document.addEventListener("PersonWalkingComplete", completeHandler)
  }

  textMessage(resolve) {
    if (this.event.faceHero) {
      const obj = this.map.gameObjects[this.event.faceHero];
      obj.direction = utils.oppositeDirection(this.map.gameObjects["hero"].direction);
    }

    const message = new TextMessage({
      text: this.event.text,
      onComplete: () => resolve()
    })
    message.init( document.querySelector(".game-container") )
  }

  changeMap(resolve) {
    this.map.overworld.startMap( window.OverworldMaps[this.event.map] );
    resolve();
  }
  
  // Add a new event type for removing objects
  removeObject(resolve) {
    const objectId = this.event.objectId;
    if (this.map.gameObjects[objectId]) {
      // Remove the object from walls
      this.map.removeWall(this.map.gameObjects[objectId].x, this.map.gameObjects[objectId].y);
      // Delete the object
      delete this.map.gameObjects[objectId];
    }
    resolve();
  }
  
  nameGuess(resolve) {
    const ghostId = this.event.ghostId;
    
    const nameGuessingMenu = new NameGuessingMenu({
      ghostId: ghostId,
      onComplete: () => {
        resolve();
      }
    });
    
    nameGuessingMenu.init(document.querySelector(".game-container"));
  }

  // New method for opening the inventory
  openInventory(resolve) {
    const inventoryMenu = new InventoryMenu({
      onComplete: () => {
        resolve();
      },
      onUse: (item) => {
        if (item.onUse) {
          const result = item.onUse();
          if (result.message) {
            // Close the inventory first
            inventoryMenu.close();
            
            // Show the result message
            const message = new TextMessage({
              text: result.message,
              onComplete: () => {
                // If the action was successful, resolve the event
                if (result.success) {
                  resolve();
                } else {
                  // Otherwise reopen the inventory
                  this.openInventory(resolve);
                }
              }
            });
            message.init(document.querySelector(".game-container"));
          }
        }
      }
    });
    
    inventoryMenu.init(document.querySelector(".game-container"));
  }

  startReversePuzzle(resolve) {
    // Define the story data (moved from Overworld.js)
    const story = {
      node1: { id: "node1", text: "She never came. I buried the locket beneath the old oak.", next: "node2" },
      node2: { id: "node2", text: "I waited at the lake for hours, the ring in my hand.", next: "node3" },
      node3: { id: "node3", text: "She smiled when I promised her the world.", next: "node4" },
      node4: { id: "node4", text: "We met on a stormy night, lost and laughing in the rain.", next: null },
    };

    // Create the ReverseMenu instance (moved from Overworld.js)
    const menu = new ReverseMenu({
      nodes: story,
      onComplete: () => {
        utils.gameProgress.chapter3Completed = true;
        // Run the post-puzzle cutscene using this.map (available in OverworldEvent)
        this.map.startCutscene([
          { type: "textMessage", text: "Ghost: My story... it makes sense now." },
          { type: "textMessage", text: "Ghost: Thank you, detective." },
          // Use this.event.who to get the correct NPC ID
          { who: this.event.who, type: "walk", direction: "up" },
          { type: "removeObject", objectId: this.event.who },
          { type: "textMessage", text: "You feel a warm breeze... the ghost has moved on." }
        ])
        // IMPORTANT: Resolve the event *after* the cutscene completes.
        .then(resolve);
      }
    });

    // Initialize the menu (moved from Overworld.js)
    menu.init(document.querySelector(".game-container"));

    // Note: We don't call resolve() here immediately.
    // The event only resolves when the menu's onComplete runs the cutscene,
    // and that cutscene's promise resolves, calling the resolve function passed here.
  }

  init() {
    return new Promise(resolve => {
      this[this.event.type](resolve)      
    });
  }
}