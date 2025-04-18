// OpeningScreen.js - Fixed version with original styling

class OpeningScreen {
  constructor() {
    this.element = null;
    this.startCallback = null;
    console.log("OpeningScreen constructor initialized");
  }

  createElement() {
    console.log("Creating opening screen element with original styling");
    this.element = document.createElement("div");
    this.element.classList.add("opening-screen");
    
    // Create a vignette overlay for gothic feel
    const vignette = document.createElement("div");
    vignette.classList.add("vignette-overlay");
    this.element.appendChild(vignette);
    
    const content = `
      <div class="title-container">
        <h1 class="game-title">THE GRAND THORNFIELD HOTEL</h1>
        <h2 class="game-subtitle">A Detective Mystery</h2>
      </div>
      <div class="description">
        <p>Trapped spirits. Forgotten memories. Unfinished business.</p>
        <p>Only you can help them move on.</p>
        <div class="ghost-decorations">
          <div class="ghost ghost-left"></div>
          <div class="ghost ghost-right"></div>
        </div>
      </div>
      <button class="start-button">BEGIN INVESTIGATION</button>
    `;
    
    const wrapper = document.createElement("div");
wrapper.innerHTML = content;
this.element.appendChild(wrapper);

    
    // Add animation to start button
    const startButton = this.element.querySelector(".start-button");
    startButton.addEventListener("mouseover", () => {
      startButton.classList.add("button-pulse");
    });
    startButton.addEventListener("mouseout", () => {
      startButton.classList.remove("button-pulse");
    });
    
    startButton.addEventListener("click", () => {
      console.log("Start button clicked!");
      this.element.classList.add("fade-out");
      setTimeout(() => {
        this.close(this.startCallback); // ✅ Call the game-start callback after closing
      }, 1000); // Match fade-out duration
    });
    

    // Ensure the opening screen appears on top of everything
    this.element.style.zIndex = "9999";

    return this.element;
  }
  
  mount(container) {
    console.log("Mounting opening screen to container");
    // Hide any existing game canvas to avoid conflicts
    const gameCanvas = container.querySelector(".game-canvas");
    if (gameCanvas) {
      console.log("Temporarily hiding game canvas");
      this.originalCanvasDisplay = gameCanvas.style.display;
      gameCanvas.style.display = "none";
    }
    
    container.appendChild(this.createElement());
    console.log("Opening screen mounted successfully");
  }
  
  onStart(callback) {
    console.log("Setting start callback");
    this.startCallback = callback;
  }
  
  close(callback) {
    console.log("Closing opening screen");
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
  
    // Restore the game canvas
    const container = document.querySelector(".game-container");
    if (container) {
      const gameCanvas = container.querySelector(".game-canvas");
      if (gameCanvas) {
        console.log("Restoring game canvas visibility");
        gameCanvas.style.display = this.originalCanvasDisplay || "block";
      }
    }
  
    // 🔁 Call the callback after closing
    if (callback) {
      callback();
    }
  }  
}

// Add CSS to document to ensure the opening screen styles are applied
document.addEventListener("DOMContentLoaded", function() {
  // Only add styles if they don't already exist
  if (!document.getElementById("opening-screen-styles")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "opening-screen-styles";
    styleSheet.innerHTML = `
      /* Opening screen styles that match the game theme */
      .opening-screen {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #1a1a1a;
        background-image: url('/images/maps/hotelbackground.png'); /* You'll need to add this image */
        background-size: cover;
        background-position: center;
        background-blend-mode: overlay;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        padding: 2rem;
        box-sizing: border-box;
        z-index: 9999;
        color: #fff;
        text-align: center;
        image-rendering: pixelated;
        border: 2px solid var(--border-color);
      }

      .title-container {
        margin-top: 15%;
      }

      .game-title {
        font-size: 16px; /* Keeping with pixel art aesthetic */
        margin-bottom: 8px;
        text-shadow: 0 0 5px #ffffff, 0 0 10px #ffffff, 0 0 15px #ffffff;
        font-family: 'alagard', serif;
        letter-spacing: 1px;
        color: white;
      }

      .game-subtitle {
        font-size: 10px;
        margin-top: 0;
        font-family: 'alagard', serif;
        opacity: 0.8;
        color: #FFF3B4;
      }

      .description {
        font-size: 8px;
        max-width: 300px;
        line-height: 1.6;
        margin: 12px auto;
        font-family: 'alagard', serif;
        color: #FFE8D2;
      }

      .start-button {
        background-color: var(--border-color);
        color: #FFE8D2;
        border: 2px solid var(--menu-border-color);
        padding: 6px 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-bottom: 4%;
        font-size: 12px;
        font-family: 'alagard', serif;
        letter-spacing: 1px;
        image-rendering: pixelated;
      }
      
      .start-button:hover {
        background-color: var(--menu-selected-background);
        transform: scale(1.05);
        color: var(--menu-font-color);
      }

      /* Ghost flicker animation */
      @keyframes ghostFlicker {
        0% { opacity: 0.7; }
        25% { opacity: 0.9; }
        50% { opacity: 0.7; }
        75% { opacity: 0.8; }
        100% { opacity: 0.7; }
      }

      /* Custom fade-in for opening screen to match your existing animation */
      @keyframes screenFadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }

      .opening-screen {
        animation: screenFadeIn 2s ease-in-out forwards;
      }

      /* Add flickering candle effect to the title */
      @keyframes candleFlicker {
        0% { text-shadow: 0 0 5px #ffffff, 0 0 10px #ffffff; }
        50% { text-shadow: 0 0 5px #ffffff, 0 0 8px #FFF3B4, 0 0 12px #FFE8D2; }
        100% { text-shadow: 0 0 5px #ffffff, 0 0 10px #ffffff; }
      }

      .game-title {
        animation: candleFlicker 2s ease-in-out infinite;
      }

      /* Add spectral effect to subtitle */
      @keyframes spectralFloat {
        0% { transform: translateY(0); opacity: 0.8; }
        50% { transform: translateY(-3px); opacity: 1; }
        100% { transform: translateY(0); opacity: 0.8; }
      }

      .game-subtitle {
        animation: spectralFloat 4s ease-in-out infinite;
      }

      /* Vignette overlay for gothic feel */
      .vignette-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        box-shadow: inset 0 0 50px 30px rgba(0, 0, 0, 0.8);
        pointer-events: none;
        z-index: 1;
      }

      .ghost {
        position: absolute;
        width: 16px;
        height: 16px;
        /* Use existing ghost NPC images instead */
        background-size: contain;
        background-repeat: no-repeat;
        animation: ghostFlicker 3s infinite;
        opacity: 0.7;
      }

      /* Button pulse animation */
      @keyframes buttonPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.08); }
        100% { transform: scale(1); }
      }

      .button-pulse {
        animation: buttonPulse 1s infinite;
      }

      /* Fade out animation for screen transition */
      .opening-screen.fade-out {
        animation: screenFadeOut 1s forwards;
      }

      @keyframes screenFadeOut {
        0% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(styleSheet);
  }
});

console.log("OpeningScreen.js loaded successfully");