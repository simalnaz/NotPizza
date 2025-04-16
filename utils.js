const utils = {
  withGrid(n) {
    return n * 16;
  },
  asGridCoord(x, y) {
    return `${x * 16},${y * 16}`;
  },
  nextPosition(initialX, initialY, direction) {
    let x = initialX;
    let y = initialY;
    const size = 16;
    if (direction === "left") {
      x -= size;
    } else if (direction === "right") {
      x += size;
    } else if (direction === "up") {
      y -= size;
    } else if (direction === "down") {
      y += size;
    }
    return { x, y };
  },
  oppositeDirection(direction) {
    if (direction === "left") { return "right"; }
    if (direction === "right") { return "left"; }
    if (direction === "up") { return "down"; }
    return "up";
  },

  emitEvent(name, detail) {
    const event = new CustomEvent(name, {
      detail
    });
    document.dispatchEvent(event);
  },

  keyCollection: {
    keysFound: [],
    totalKeys: 3,
  
    addKey: function(keyId) {
      if (!this.keysFound.includes(keyId)) {
        this.keysFound.push(keyId);
        return true;
      }
      return false;
    },
    
    hasAllKeys: function() {
      return this.keysFound.length >= this.totalKeys;
    },
  
    reset: function() {
      this.keysFound = [];
    }
  },  

  // Get game object by ID from any map (updated from GhostName.js)
  getGameObjectByIdFromAnyMap: function(id) {
    for (const mapKey in window.OverworldMaps) {
      const map = window.OverworldMaps[mapKey];
      if (map.gameObjects && map.gameObjects[id]) {
        return map.gameObjects[id];
      }
    }
    return null;
  },
  // Get game object by ID from the current map (from GhostName.js)
  //getGameObjectByIdFromCurrentMap: function(id) {
    //if (window.overworld && window.overworld.map && window.overworld.map.gameObjects && window.overworld.map.gameObjects[id]) {
      //return window.overworld.map.gameObjects[id];
    //}
    //return null;
  //}
  gameProgress: {
    chapter1Completed: false,
    chapter2Completed: false,
    chapter3Completed: false,
  }
};

// cutsceneUtils.js

utils.startInnerMonologueCutscene = function ({
  text,
  flag = "innerMonologuePlayed",
  onComplete = null
}) {
  if (window[flag]) return;
  window[flag] = true;

  const events = [
    {
      type: "textMessage",
      text: `<i>${text}</i>`
    }
  ];

  // Start the cutscene
  window.overworld.map.startCutscene(events).then(() => {
    if (typeof onComplete === "function") {
      onComplete();
    }
  });
};

utils.identifyGhost = function(nameOrDetail) {
  // First check if it's a name
  if (window.guestBook.entries[nameOrDetail]) {
    // It's a name
    window.guestBook.markAsDisappeared(nameOrDetail);
    
    // Emit an event that can be used for animations or sound effects
    utils.emitEvent("ghost-identified", {
      name: nameOrDetail
    });
    
    // Optional: Update any UI elements
    const notebookIcon = document.getElementById("notebook-icon");
    if (notebookIcon) {
      // Make the notebook icon glow or animate briefly
      notebookIcon.classList.add("notebook-updated");
      setTimeout(() => {
        notebookIcon.classList.remove("notebook-updated");
      }, 3000);
    }
    
    return true;
  } 
  // Then check if it's a remembered detail
  else {
    const name = window.guestBook.getNameByDescription(nameOrDetail);
    if (name) {
      // Found the ghost by their remembered detail
      window.guestBook.markAsDisappeared(name);
      
      // Emit an event
      utils.emitEvent("ghost-identified", {
        name: name
      });
      
      // Optional: Update UI
      const notebookIcon = document.getElementById("notebook-icon");
      if (notebookIcon) {
        notebookIcon.classList.add("notebook-updated");
        setTimeout(() => {
          notebookIcon.classList.remove("notebook-updated");
        }, 3000);
      }
      
      return true;
    }
  }
  
  return false;
};
