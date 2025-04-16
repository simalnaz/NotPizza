class Overworld {
  constructor(config) {
    this.element = config.element;
    this.canvas = this.element.querySelector(".game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.map = null;
    // Add update functions array for custom update logic
    this.updateFunctions = [];
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
      
      // Run any custom update functions
      this.updateFunctions.forEach(fn => fn());
 
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
 
  async startMap(mapConfig, sourceMapId = null) {
    if (!mapConfig) {
      console.error(`startMap called with invalid mapConfig (maybe map name "${this.event?.map}" doesn't exist in window.OverworldMaps?)`);
      // Potentially stop the process or load a default map
      return;
  }
    this.map = new OverworldMap(mapConfig);
    this.map.overworld = this;
    if (sourceMapId && this.map.config.entryPoints && this.map.config.entryPoints[sourceMapId]) {
      const entryCoordsString = this.map.config.entryPoints[sourceMapId];
      try {
        const [x, y] = entryCoordsString.split(",").map(Number); // Parse "x,y" string

        // Find the hero object and update its position
        const hero = this.map.gameObjects.hero;
        if (hero) {
          hero.x = x;
          hero.y = y;
          console.log(`[Overworld] Using entry point from ${sourceMapId}: placing hero at ${x},${y} in ${mapConfig.id}`);
        } else {
          console.warn(`[Overworld] Map ${mapConfig.id} has entry point but no hero object defined!`);
        }
      } catch (e) {
         console.error(`[Overworld] Error parsing entry point coordinates "${entryCoordsString}" for source ${sourceMapId} in map ${mapConfig.id}`, e);
         // Fallback to default hero position might happen implicitly
      }

    } else {
       // Optional: Log if no specific entry point was used
       if (sourceMapId) {
         console.log(`[Overworld] No specific entry point found for source ${sourceMapId} in map ${mapConfig.id}. Using default hero position.`);
       } else {
         // console.log(`[Overworld] No source map ID provided. Using default hero position for map ${mapConfig.id}.`);
       }
    }
    this.map.mountObjects();
  
    await this.map.waitForLoad(); // ✔️ RESİMLER YÜKLENSİN
  }
  


  showCenterText(text, duration = 3000, callback = null) {
    // Create the elements
    const container = document.createElement("div");
    container.classList.add("center-text-container");
    
    const textElement = document.createElement("div");
    textElement.classList.add("semi-transparent-text");
    textElement.innerText = text;
    
    container.appendChild(textElement);
    this.element.appendChild(container);
    
    // Start fade out animation before end
    setTimeout(() => {
      textElement.classList.add("fade-out");
    }, duration - 500);
    
    // Remove the element after full duration
    setTimeout(() => {
      container.remove();
      if (callback) callback();
    }, duration);
  }
  
  /**
   * Add a custom update function to the game loop
   * @param {Function} fn - The function to call each frame
   */
  addUpdateFunction(fn) {
    this.updateFunctions.push(fn);
  }
  
  /**
   * Remove a custom update function from the game loop
   * @param {Function} fn - The function to remove
   */
  removeUpdateFunction(fn) {
    this.updateFunctions = this.updateFunctions.filter(f => f !== fn);
  }
 
  async init() {
    await this.startMap(window.OverworldMaps.Garden); // ✔️ Harita yüklenmeden devam etme
  
    this.bindActionInput();
    this.bindHeroPositionCheck();
  
    this.directionInput = new DirectionInput();
    this.directionInput.init();
  
    this.startGameLoop(); // Artık doğru şekilde başlar
    
    // Add the CenterTextDisplay class to the game for cutscene support
    this.initCutsceneActions();
  }
  
  /**
   * Initialize custom cutscene actions
   */
  initCutsceneActions() {
    // Create CenterTextDisplay class if it doesn't exist yet
    if (!window.CenterTextDisplay) {
      window.CenterTextDisplay = class CenterTextDisplay {
        constructor({ text, duration = 3000 }) {
          this.text = text;
          this.duration = duration;
        }

        createElement() {
          this.element = document.createElement("div");
          this.element.classList.add("center-text-container");
          
          this.textElement = document.createElement("div");
          this.textElement.classList.add("semi-transparent-text");
          this.textElement.innerText = this.text;
          
          this.element.appendChild(this.textElement);
          document.querySelector(".game-container").appendChild(this.element);
        }

        init(resolve) {
          this.createElement();
          
          // Start fade out animation after duration - 500ms (to allow for 0.5s fade)
          setTimeout(() => {
            this.textElement.classList.add("fade-out");
          }, this.duration - 500);
          
          // Remove the element after full duration
          setTimeout(() => {
            this.element.remove();
            resolve();
          }, this.duration);
        }
      };
    }
  }
}