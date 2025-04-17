// OpeningScreen.js - Add this as a new file

class OpeningScreen {
    constructor() {
      this.element = null;
      this.startCallback = null;
    }
  
    createElement() {
      this.element = document.createElement("div");
      this.element.classList.add("opening-screen");
      
      const content = `
        <div class="title-container">
          <h1 class="game-title">The Grand Thornfield Hotel</h1>
          <h2 class="game-subtitle">A Detective Mystery</h2>
        </div>
        <div class="description">
          <p>Trapped spirits. Forgotten memories. Unfinished business.</p>
          <p>Only you can help them move on.</p>
        </div>
        <button class="start-button">Begin Investigation</button>
      `;
      
      this.element.innerHTML = content;
      
      // Add event listener to the start button
      this.element.querySelector(".start-button").addEventListener("click", () => {
        this.close();
        if (this.startCallback) {
          this.startCallback();
        }
      });
  
      return this.element;
    }
    
    mount(container) {
      container.appendChild(this.createElement());
    }
    
    onStart(callback) {
      this.startCallback = callback;
    }
    
    close() {
      if (this.element && this.element.parentElement) {
        this.element.parentElement.removeChild(this.element);
      }
    }
  }
  