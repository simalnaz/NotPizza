class Sprite {
  constructor(config) {

    //Set up the image
    this.image = new Image();
    this.image.src = config.src;
    this.image.onload = () => {
      this.isLoaded = true;
    }

    //Shadow
    this.shadow = new Image();
    this.useShadow = true; //config.useShadow || false
    if (this.useShadow) {
      this.shadow.src = "/images/characters/shadow.png";
    }
    this.shadow.onload = () => {
      this.isShadowLoaded = true;
    }

    //Configure Animation & Initial State
    this.animations = config.animations || {
      "idle-down" : [ [1,0] ], // Row 0, Column 1
      "idle-right": [ [1,1] ], // Row 1, Column 1
      "idle-up"   : [ [1,2] ], // Row 2, Column 1
      "idle-left" : [ [1,3] ], // Row 3, Column 1

      // Assuming a 3-frame walk cycle (0, 1, 2) repeating frame 1 for a 4-step animation
      "walk-down" : [ [0,0], [1,0], [2,0], [1,0] ], // Row 0
      "walk-right": [ [0,1], [1,1], [2,1], [1,1] ], // Row 1
      "walk-up"   : [ [0,2], [1,2], [2,2], [1,2] ], // Row 2
      "walk-left" : [ [0,3], [1,3], [2,3], [1,3] ], // Row 3
      "float-down" : [ [1,0],[0,0],[2,0],[0,0] ],
      "float-right": [ [1,1],[0,1],[2,1],[0,1] ],
      "float-up"   : [ [1,2],[0,2],[2,2],[0,2] ],
      "float-left" : [ [1,3],[0,3],[2,3],[0,3] ]
    }    
    this.currentAnimation = config.currentAnimation || "idle-down"; // config.currentAnimation || "idle-down";
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
    const frameIndex = this.currentAnimationFrame % currentAnim.length; // <-- Use modulo %
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
    // --- Calculate Destination Position (Centering Offset) ---
    // Original offsets were likely for a 32x32 sprite (-8, -18).
    // New sprite is 64x36. We need new offsets to center it.
    // Horizontal center: -(width / 2) => -(64 / 2) = -32
    // Vertical center (relative to feet): -(height) or similar. Let's try -(height / 2) => -(36 / 2) = -18
    // Or often, the y-position is the feet, so offset is just -height => -36
    // Let's try centering the sprite horizontally and aligning its bottom edge roughly where the old one was.
    // The old y offset was -18 for a 32px tall sprite. Let's try -36 for the new 36px tall sprite.
    const xOffset = -32; // New horizontal offset for 64px width
    const yOffset = -36; // New vertical offset for 36px height (align bottom)
  
    const x = this.gameObject.x + xOffset + utils.withGrid(10.5) - cameraPerson.x;
    const y = this.gameObject.y + yOffset + utils.withGrid(6) - cameraPerson.y;
  
    // --- Draw Shadow (No change needed here unless shadow size/position needs adjustment) ---
    this.isShadowLoaded && ctx.drawImage(this.shadow, x, y); // Shadow position might need tweaking relative to the larger sprite
  
    // --- Get Spritesheet Frame ---
    const [frameX, frameY] = this.frame; // This relies on the animation definitions being correct for the new sheet
  
    // --- Draw Sprite Image ---
    this.isLoaded && ctx.drawImage(
      this.image,
      // Source rectangle (from spritesheet)
      frameX * 64, // Assuming frames are laid out horizontally, each 64px wide
      frameY * 36, // Assuming frames are laid out vertically, each 36px high
      64,          // Source Width (width of one frame) <-- UPDATE
      36,          // Source Height (height of one frame) <-- UPDATE
  
      // Destination rectangle (on canvas)
      x,           // Calculated destination X
      y,           // Calculated destination Y
      64,          // Destination Width (draw at actual size) <-- UPDATE
      36           // Destination Height (draw at actual size) <-- UPDATE
    );
  
    this.updateAnimationProgress();
  }
}  