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
  }

  drawLowerImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.lowerImage, 
      utils.withGrid(10.5) - cameraPerson.x, 
      utils.withGrid(6) - cameraPerson.y
      )
  }

  drawUpperImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.upperImage, 
      utils.withGrid(10.5) - cameraPerson.x, 
      utils.withGrid(6) - cameraPerson.y
    )
  } 

  isSpaceTaken(currentX, currentY, direction) {
    const {x,y} = utils.nextPosition(currentX, currentY, direction);
    return this.walls[`${x},${y}`] || false;
  }

  mountObjects() {
    Object.keys(this.gameObjects).forEach(key => {

      let object = this.gameObjects[key];
      object.id = key;

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
    
    // Check if the object is a key
    if (!this.isCutscenePlaying && match) {
      if (match instanceof Key && !match.isCollected) {
        const keyId = match.collect();
        const wasAdded = utils.keyCollection.addKey(keyId);
        
        // Create a custom event for key collection
        if (wasAdded) {
          const foundText = `You found ${keyId}!`;
          const keysRemaining = utils.keyCollection.totalKeys - utils.keyCollection.keysFound.length;
          const remainingText = keysRemaining > 0 ? 
            `${keysRemaining} more key${keysRemaining > 1 ? 's' : ''} to find.` : 
            "You've found all the keys!";
          
          this.startCutscene([
            { type: "textMessage", text: foundText },
            { type: "textMessage", text: remainingText }
          ]);
          
          // Make the key invisible or remove it from the map
          delete this.gameObjects[keyId];
          this.removeWall(match.x, match.y);
          
          // If all keys collected, update ghost dialogue
          if (utils.keyCollection.hasAllKeys() && this.gameObjects["npcA"]) {
            this.gameObjects["npcA"].talking = [{
              events: [
                { type: "textMessage", text: "You found all my keys!", faceHero: "npcA" },
                { type: "textMessage", text: "Now I can finally pass on to the afterlife..." },
                { type: "textMessage", text: "Thank you for your help!" },
                { who: "npcA", type: "stand", direction: "up", time: 1000 },
                { type: "textMessage", text: "Elliot's ghost fades away peacefully..." },
                // Remove the ghost after the conversation
                { 
                  type: "removeObject", 
                  objectId: "npcA"
                }
              ]
            }];
          }
          return;
        }
      }
      
      // Normal NPC talking behavior
      if (match.talking && match.talking.length) {
        this.startCutscene(match.talking[0].events)
      }
    }
  }

  checkForFootstepCutscene() {
    const hero = this.gameObjects["hero"];
    const match = this.cutsceneSpaces[ `${hero.x},${hero.y}` ];
    if (!this.isCutscenePlaying && match) {
      this.startCutscene( match[0].events )
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
  DemoRoom: {
    lowerSrc: "/images/maps/DemoLower.png",
    upperSrc: "/images/maps/DemoUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(6),
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
        src: "/images/characters/objects/key.png", // You'll need to create this image
        id: "Master Key"
      }),
      key2: new Key({
        x: utils.withGrid(10), 
        y: utils.withGrid(2),
        src: "/images/characters/objects/key.png",
        id: "Room Key"
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
      [utils.asGridCoord(5,10)]: [
        {
          events: [
            { type: "changeMap", map: "Kitchen" }
          ]
        }
      ]
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
        id: "Safe Key"
      }),
    },
    walls: {
      // Add walls for the key
      [utils.asGridCoord(2,7)] : true,
    },
    cutsceneSpaces: {
      [utils.asGridCoord(5,10)]: [
        {
          events: [
            { type: "textMessage", text: "Back to the main hall?" },
            { type: "changeMap", map: "DemoRoom" }
          ]
        }
      ]
    }
  },
}