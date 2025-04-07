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

  // Key tracking functionality
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
  getGameObjectByIdFromCurrentMap: function(id) {
    if (window.overworld && window.overworld.map && window.overworld.map.gameObjects && window.overworld.map.gameObjects[id]) {
      return window.overworld.map.gameObjects[id];
    }
    return null;
  }
};
