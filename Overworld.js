class Overworld {
  constructor(config) {
    this.element = config.element;
    this.canvas = this.element.querySelector(".game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.map = null;
  }
 
   startGameLoop() {
        // Make sure map is loaded before starting the loop
        if (!this.map || !this.map.isLoaded) {
          console.warn("Attempted to start game loop before map was loaded.");
          // Optionally, wait a bit and retry, or rely on init() structure
          return;
       }

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
      if (this.map && this.map.isCutscenePlaying) {
        // console.log("Ignoring Enter press because cutscene is active."); // Optional: for debugging
        return;
      }
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
 
  async startMap(mapConfig) {
    this.map = new OverworldMap(mapConfig);
    this.map.overworld = this;
    this.map.mountObjects();
  
    await this.map.waitForLoad(); // ✔️ RESİMLER YÜKLENSİN
  }
  
 
  async init() {
    await this.startMap(window.OverworldMaps.Lobby); // ✔️ Harita yüklenmeden devam etme
  
    this.bindActionInput();
    this.bindHeroPositionCheck();
  
    this.directionInput = new DirectionInput();
    this.directionInput.init();
  
    this.startGameLoop(); // Artık doğru şekilde başlar
  }  
}