class Key extends GameObject {
    constructor(config) {
      super(config);
      this.id = config.id || "key";
      this.isCollected = false;
      
      // Override the default sprite behavior for keys
      this.sprite = new Sprite({
        gameObject: this,
        src: config.src || "/images/characters/objects/key.png",
        animations: {
          "idle-down": [[0, 0]],
          "idle-right": [[0, 0]],
          "idle-up": [[0, 0]],
          "idle-left": [[0, 0]]
        }
      });
    }
  
    update() {
      // No movement or complex animation needed for keys
    }
  
    collect() {
      this.isCollected = true;
      return this.id; // Make sure this is the descriptive name
    }    
  }