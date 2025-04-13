class DirectionInput {
  constructor() {
    this.heldDirections = [];
    this.map = {
      "ArrowUp": "up",
      "KeyW": "up",
      "ArrowDown": "down",
      "KeyS": "down",
      "ArrowLeft": "left",
      "KeyA": "left",
      "ArrowRight": "right",
      "KeyD": "right",
    }
  }

  get direction() {
    return this.heldDirections[0];
  }

  init() {
    document.addEventListener("keydown", e => {
      const dir = this.map[e.code];
      if (dir && this.heldDirections.indexOf(dir) === -1) {
        this.heldDirections.unshift(dir);
      }
      
      // Open inventory when "I" key is pressed
      if (e.code === "KeyI" && !window.isMenuOpen) {
        window.isMenuOpen = true;
        window.overworld.map.isCutscenePlaying = true;
        
        // Create and initialize the inventory menu
        const inventoryMenu = new InventoryMenu({
          onComplete: () => {
            window.isMenuOpen = false;
            window.overworld.map.isCutscenePlaying = false;
          },
          onUse: (item) => {
            if (item.onUse) {
              const result = item.onUse();
              if (result && result.message) {
                // Close the inventory first
                inventoryMenu.close();
                
                // Show the result message
                const message = new TextMessage({
                  text: result.message,
                  onComplete: () => {
                    window.isMenuOpen = false;
                  }
                });
                message.init(document.querySelector(".game-container"));
              }
            }
          }
        });
        
        inventoryMenu.init(document.querySelector(".game-container"));
      }
    });

    document.addEventListener("keyup", e => {
      const dir = this.map[e.code];
      const index = this.heldDirections.indexOf(dir);
      if (index > -1) {
        this.heldDirections.splice(index, 1);
      }
    })
  }
}