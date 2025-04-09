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
  custom(resolve) {
    this.event.callback();
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

  init() {
    return new Promise(resolve => {
      this[this.event.type](resolve)      
    });
  }
}