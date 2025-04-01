class SceneTransition {
    constructor() {
      this.element = null;
    }
    
    createElement() {
      this.element = document.createElement("div");
      this.element.classList.add("SceneTransition");
    }
    
    fadeOut() {
      this.element.classList.add("fade-out");
      
      return new Promise(resolve => {
        this.element.addEventListener("animationend", () => {
          resolve();
        }, { once: true });
      });
    }
    
    fadeIn() {
      this.element.classList.add("fade-in");
      
      return new Promise(resolve => {
        this.element.addEventListener("animationend", () => {
          this.element.remove();
          resolve();
        }, { once: true });
      });
    }
    
    async init(container, callback) {
      this.createElement();
      container.appendChild(this.element);
      
      await this.fadeOut();
      
      // Execute whatever should happen during the transition
      if (callback) {
        callback();
      }
      
      await this.fadeIn();
    }
  }