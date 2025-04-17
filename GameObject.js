// /Users/simal/Desktop/Detective/GameObject.js
// REMOVED: map.addWall(this.x, this.y); from mount method

class GameObject {
  constructor(config) {
    this.id = null;
    this.isMounted = false;
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.direction = config.direction || "down";
    this.sprite = new Sprite({
      gameObject: this,
      src: config.src || "/images/characters/people/detective.png",
      animations: config.animations || null,
    });

    this.behaviorLoop = config.behaviorLoop || [];
    this.behaviorLoopIndex = 0;

    this.talking = config.talking || [];

  }

  mount(map) {
    console.log("mounting!")
    this.isMounted = true;
    // map.addWall(this.x, this.y); // <-- REMOVED

    //If we have a behavior, kick off after a short delay
    setTimeout(() => {
      this.doBehaviorEvent(map);
    }, 10)
  }

  update(state) {
    this.updateSprite(state);
  }

  updateSprite() {
    if (this.movingProgressRemaining > 0) {
      this.sprite.setAnimation("walk-"+this.direction);
      return;
    }
    this.sprite.setAnimation("idle-"+this.direction);
  }

  async doBehaviorEvent(map) {
    // Ensure this object still exists on the map before trying to run behavior
    // Use mapId as it's guaranteed to be the key in gameObjects
    if (!map.gameObjects[this.mapId]) {
      // console.log(`Behavior loop aborted for removed object: ${this.mapId}`); // Optional log
      return;
    }

    //Don't do anything if there is a more important cutscene or I don't have config to do anything
    //anyway.
    if (map.isCutscenePlaying || this.behaviorLoop.length === 0 || this.isStanding) {
      return;
    }

    //Setting up our event with relevant info
    let eventConfig = this.behaviorLoop[this.behaviorLoopIndex];
    eventConfig.who = this.id;

    //Create an event instance out of our next event config
    const eventHandler = new OverworldEvent({ map, event: eventConfig });
    await eventHandler.init();

    //Setting the next event to fire
    this.behaviorLoopIndex += 1;
    if (this.behaviorLoopIndex === this.behaviorLoop.length) {
      this.behaviorLoopIndex = 0;
    }
    if (!this.isStanding && !map.isCutscenePlaying) {
      this.doBehaviorEvent(map);
    }

}
}

class Book extends GameObject {
  constructor(config) {
    super(config); // Call GameObject constructor first
    this.talking = config.talking || [];

    this.id = config.id || "book"; // Default ID if needed, matches config.id if provided

    // *** This is the crucial part ***
    // Override the default sprite behavior specifically for Book objects,
    // just like the Key class does.
    this.sprite = new Sprite({
      gameObject: this,
      src: config.src || "/images/characters/objects/default_book.png", // Use src from config, provide a fallback?
      animations: { // Force simple, single-frame animation using only the top-left frame [0,0]
        "idle-down":  [[0,0]],
        "idle-left":  [[0,0]],
        "idle-right": [[0,0]],
        "idle-up":    [[0,0]],
        // Include walk just in case, though Book shouldn't move
        "walk-down":  [[0,0]],
        "walk-left":  [[0,0]],
        "walk-right": [[0,0]],
        "walk-up":    [[0,0]],
      }
    });

    // Books are usually static, ensure no accidental behavior loop runs
    this.behaviorLoop = [];
  }

  // Books typically don't need complex updates like Persons
  update() {
    // We don't need position updates like Person.js
    // The sprite animation progress *might* update if needed, but for a static
    // single-frame object, even that isn't strictly necessary.
    // this.sprite.updateAnimationProgress(); // Likely safe to omit for static objects
  }

  // You could add specific book-related methods here if needed in the future,
  // but for now, the 'talking' config handles interaction.
}
