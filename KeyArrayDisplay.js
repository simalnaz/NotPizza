// KeyArrayDisplay.js
class KeyArrayDisplay {
    constructor(containerId = "key-array") {
      this.containerId = containerId;
      this.keyArray = utils.keyCollection.keysFound;
      this.maxSize = utils.keyCollection.totalKeys || 3;
    }

    show() {
        const container = document.getElementById(this.containerId);
        if (container) container.style.display = "flex";
      }
      
      hide() {
        const container = document.getElementById(this.containerId);
        if (container) container.style.display = "none";
      }
      
  
    createSlot(index, value) {
      const slot = document.createElement("div");
      slot.classList.add("key-slot");
  
      const indexLabel = document.createElement("div");
      indexLabel.classList.add("index-label");
      indexLabel.innerText = `[${index}]`;
      slot.appendChild(indexLabel);
  
      const content = document.createElement("div");
      content.classList.add("key-content");
      if (value) {
        // Look up the key's icon from inventory
        const item = window.playerInventory.items.find(i => i.id === value);
        if (item && item.icon) {
          const img = document.createElement("img");
          img.src = item.icon;
          img.alt = value;
          img.classList.add("key-icon");
          content.appendChild(img);
        } else {
          content.innerText = value;
        }
      } else {
        content.innerText = "Empty";
      }
            
      if (value) {
        slot.classList.add("occupied");
      } else {
        slot.classList.add("empty");
      }
      slot.appendChild(content);
  
      return slot;
    }
  
    render() {
      const container = document.getElementById(this.containerId);
      if (!container) return;
      container.innerHTML = "";
  
      for (let i = 0; i < this.maxSize; i++) {
        const value = this.keyArray[i] || null;
        const slot = this.createSlot(i, value);
        container.appendChild(slot);
      }
    }
  
    refresh() {
      this.keyArray = utils.keyCollection.keysFound;
      this.render();
    }
  
    init() {
        this.render();
      
        // Only show if chapter 1 is active
        if (utils.gameProgress.chapter1Started && !utils.gameProgress.chapter1Completed) {
          this.show();
        } else {
          this.hide();
        }
      }
      
  }
  
  window.keyArrayDisplay = new KeyArrayDisplay();
  