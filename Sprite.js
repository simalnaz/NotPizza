class Sprite {
  constructor(config) {

    //Set up the image
    this.image = new Image();
    this.image.src = config.src;
    this.image.onload = () => {
      this.isLoaded = true;
    }

    // Configure Animation & Initial State
    // Each character is 32x32 pixels in a 3x4 grid (3 frames, 4 directions)
    this.frameWidth = 48;   // Individual sprite width
    this.frameHeight = 48;  // Individual sprite height
    
    this.animations = config.animations || {
      "idle-down": [ [1, 0] ],
      "idle-left": [ [1, 1] ],
      "idle-right": [ [1, 2] ],
      "idle-up": [ [1, 3] ],
      "walk-down": [ [0, 0], [1, 0], [2, 0] ],
      "walk-left": [ [0, 1], [1, 1], [2, 1] ],
      "walk-right": [ [0, 2], [1, 2], [2, 2] ],
      "walk-up": [ [0, 3], [1, 3], [2, 3] ],
      
      "float-down" : [ [1,0], [0,0], [2,0], [0,0] ],
      "float-right": [ [1,1], [0,1], [2,1], [0,1] ],
      "float-up"   : [ [1,2], [0,2], [2,2], [0,2] ],
      "float-left" : [ [1,3], [0,3], [2,3], [0,3] ]
    }    
    this.currentAnimation = config.currentAnimation || "idle-down";
    this.currentAnimationFrame = 0;

    this.animationFrameLimit = config.animationFrameLimit || 8;
    this.animationFrameProgress = this.animationFrameLimit;
    
    //Reference the game object
    this.gameObject = config.gameObject;
  }

  get frame() {
    const currentAnim = this.animations[this.currentAnimation];
    if (!currentAnim || currentAnim.length === 0) {
      // Handle the case where the animation is not defined or empty
      console.warn(`Animation "${this.currentAnimation}" is not defined or empty for sprite: ${this.image.src}`);
      // Fallback to idle-down frame 0 if possible, otherwise default 0,0
      const fallbackAnim = this.animations["idle-down"];
      if (fallbackAnim && fallbackAnim.length > 0) {
         return fallbackAnim[0];
      }
      return [0, 0]; // Return a default frame [column, row]
    }
    // Ensure currentAnimationFrame is valid for the current animation length using modulo
    const frameIndex = this.currentAnimationFrame % currentAnim.length;
    return currentAnim[frameIndex];
  }

  setAnimation(key) {
    if (this.currentAnimation !== key) {
      this.currentAnimation = key;
      this.currentAnimationFrame = 0;
      this.animationFrameProgress = this.animationFrameLimit;
    }
  }

  updateAnimationProgress() {
    //Downtick frame progress
    if (this.animationFrameProgress > 0) {
      this.animationFrameProgress -= 1;
      return;
    }

    //Reset the counter
    this.animationFrameProgress = this.animationFrameLimit;
    this.currentAnimationFrame += 1;

    if (this.animations[this.currentAnimation] === undefined) {
      this.currentAnimationFrame = 0;
    } else if (this.currentAnimationFrame >= this.animations[this.currentAnimation].length) {
      this.currentAnimationFrame = 0;
    }
  }
  
  draw(ctx, cameraPerson) {
    // Calculate position with appropriate offsets for 32x32 sprites
    // For a 32x32 sprite, we center it horizontally (-16) and offset vertically to align feet (-32)
    const xOffset = -this.frameWidth / 2; // Center horizontally based on frame width
    const yOffset = -this.frameHeight;    // Align bottom of sprite with gameObject.y

    // Ensure cameraPerson exists before accessing its properties
    const camX = cameraPerson ? cameraPerson.x : utils.withGrid(10.5);
    const camY = cameraPerson ? cameraPerson.y : utils.withGrid(6);

    const x = this.gameObject.x + xOffset + utils.withGrid(10.5) - camX;
    const y = this.gameObject.y + yOffset + utils.withGrid(6) - camY;

    // Get current animation frame
    const frameData = this.frame;
    if (!frameData) {
        console.error(`Could not get frame data for animation: ${this.currentAnimation}`);
        return; // Don't draw if frame data is invalid
    }
    const [frameX, frameY] = frameData;

    // Draw sprite from sheet
    if (this.isLoaded) {
        ctx.drawImage(
          this.image,
          // Source rectangle (from spritesheet)
          frameX * this.frameWidth,  // Column position * frame width
          frameY * this.frameHeight, // Row position * frame height
          this.frameWidth,           // Source width
          this.frameHeight,          // Source height

          // Destination rectangle (on canvas)
          x,                         // Destination X
          y,                         // Destination Y
          this.frameWidth,           // Destination width (same as source)
          this.frameHeight           // Destination height (same as source)
        );
    } else {
        // Optional: Draw placeholder if image not loaded
        // ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        // ctx.fillRect(x, y, this.frameWidth, this.frameHeight);
    }

    this.updateAnimationProgress();
  }
}