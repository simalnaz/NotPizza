// ✅ Put this OUTSIDE the Overworld class, at the top or bottom of the file
const DiaryPages = {
  page1: {
    id: "page1",
    text: "Day 1: I checked into the hotel alone...",
    next: "page2"
  },
  page2: {
    id: "page2",
    text: "Day 2: I heard whispering behind the mirror...",
    next: "page3"
  },
  page3: {
    id: "page3",
    text: "Day 3: I left a letter I never sent. It’s in the garden...",
    next: null
  }
};

class Overworld {
  constructor(config) {
    this.element = config.element;
    this.canvas = this.element.querySelector(".game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.map = null;
  }
 
   startGameLoop() {
     const step = () => {
       //Clear off the canvas
       this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
 
       //Establish the camera person
       const cameraPerson = this.map.gameObjects.hero;
 
       //Update all objects
       Object.values(this.map.gameObjects).forEach(object => {
         object.update({
           arrow: this.directionInput.direction,
           map: this.map,
         })
       })
 
       //Draw Lower layer
       this.map.drawLowerImage(this.ctx, cameraPerson);
 
       //Draw Game Objects
       Object.values(this.map.gameObjects).sort((a,b) => {
         return a.y - b.y;
       }).forEach(object => {
         object.sprite.draw(this.ctx, cameraPerson);
       })
 
       //Draw Upper layer
       this.map.drawUpperImage(this.ctx, cameraPerson);
       
       requestAnimationFrame(() => {
         step();   
       })
     }
     step();
  }
 
  bindActionInput() {
    new KeyPressListener("Enter", () => {
      //Is there a person here to talk to?
      this.map.checkForActionCutscene()
    })
  }
 
  bindHeroPositionCheck() {
    document.addEventListener("PersonWalkingComplete", e => {
      if (e.detail.whoId === "hero") {
        //Hero's position has changed
        this.map.checkForFootstepCutscene()
      }
    })
  }
 
  startMap(mapConfig) {
   this.map = new OverworldMap(mapConfig);
   this.map.overworld = this;
   this.map.mountObjects();
  }
 
  init() {
   this.startMap(window.OverworldMaps.DemoRoom);
 
 
   this.bindActionInput();
   this.bindHeroPositionCheck();
 
   this.directionInput = new DirectionInput();
   this.directionInput.init();
 
   this.startGameLoop();
 
 
   // this.map.startCutscene([
   //   { who: "hero", type: "walk",  direction: "down" },
   //   { who: "hero", type: "walk",  direction: "down" },
   //   { who: "npcA", type: "walk",  direction: "up" },
   //   { who: "npcA", type: "walk",  direction: "left" },
   //   { who: "hero", type: "stand",  direction: "right", time: 200 },
   //   { type: "textMessage", text: "WHY HELLO THERE!"}
   //   // { who: "npcA", type: "walk",  direction: "left" },
   //   // { who: "npcA", type: "walk",  direction: "left" },
   //   // { who: "npcA", type: "stand",  direction: "up", time: 800 },
   // ])
  
  }
  // ✅ Add these OUTSIDE of init() but INSIDE the class
  readDiaryChain() {
    let currentPageId = "page1";
    const events = [];
  
    while (currentPageId) {
      const page = DiaryPages[currentPageId];
      events.push({ type: "textMessage", text: page.text });
      currentPageId = page.next;
    }
  
    // After showing all pages, trigger Elara's farewell cutscene
    events.push(
      { type: "textMessage", text: "Elara: You followed my story... every last word." },
      { type: "textMessage", text: "Elara: Thank you. I can rest now." },
      { who: "npcA", type: "walk", direction: "up" },
      { type: "removeObject", objectId: "npcA" } // optional fade-out
    );
  
    this.map.startCutscene(events);
  }  

  startReverseHaunting() {
    const story = {
      node1: { id: "node1", text: "She never came. I buried the locket beneath the old oak.", next: "node2" },
      node2: { id: "node2", text: "I waited at the lake for hours, the ring in my hand.", next: "node3" },
      node3: { id: "node3", text: "She smiled when I promised her the world.", next: "node4" },
      node4: { id: "node4", text: "We met on a stormy night, lost and laughing in the rain.", next: null },
    };
  
    const menu = new ReverseMenu({
      nodes: story,
      onComplete: () => {
        this.map.startCutscene([
          { type: "textMessage", text: "Ghost: My story... it makes sense now." },
          { type: "textMessage", text: "Ghost: Thank you, detective." },
          { who: "npcC", type: "walk", direction: "up" },
          { type: "removeObject", objectId: "npcC" },
          { type: "textMessage", text: "You feel a warm breeze... the ghost has moved on." }
        ]);
      }
    });
  
    menu.init(document.querySelector(".game-container")); // ✅ CORRECT
  }
  
  
 }