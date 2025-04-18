class Ghost extends Person {
  constructor(config) {
    super(config);
    this.movingProgressRemaining = 0;
    this.isStanding = false;
    
    // Ghost-specific properties
    //this.isTransparent = config.isTransparent || false;
   // this.memories = config.memories || [];
    //this.discoveredMemories = [];
   //this.hasCompletedPuzzle = false;
  }

  startBehavior(state, behavior) {
    // Set character direction to whatever behavior has
    this.direction = behavior.direction;
    
    //if (behavior.type === "float") {
      // Check if space is free
      //if (state.map.isSpaceTaken(this.x, this.y, this.direction)) {
        //return;
      //}
      
      // Ready to float!
    //  this.movingProgressRemaining = 16;
    //}

    if (behavior.type === "stand") {
      this.isStanding = true;
      setTimeout(() => {
        utils.emitEvent("GhostStandComplete", {
          whoId: this.id
        })
        this.isStanding = false;
      }, behavior.time)
    }
  }

  updatePosition() {
    const [property, change] = this.directionUpdate[this.direction];
    this[property] += change;
    this.movingProgressRemaining -= 1;

    //if (this.movingProgressRemaining === 0) {
      // We finished the floating!
    //  utils.emitEvent("GhostFloatComplete", {
      //  whoId: this.id
      //})
    //}
  }

  // Memory-related methods
 // addMemory(memory) {
   // if (!this.memories.includes(memory)) {
     // this.memories.push(memory);
    //}
  //}
  
  //discoverMemory(memory) {
    //if (this.memories.includes(memory) && !this.discoveredMemories.includes(memory)) {
      //this.discoveredMemories.push(memory);
      //return true;
    //}
   //return false;
  //}
  
  //hasDiscoveredAllMemories() {
    //return this.memories.length === this.discoveredMemories.length;
  //}
}