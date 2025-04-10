class Inventory {
    constructor() {
      this.items = [];
      this.onUpdate = null;
    }
  
    addItem(item) {
      // Check if item already exists in inventory
      const existingItem = this.items.find(i => i.id === item.id);
      
      if (existingItem) {
        // If the item allows stacking, increase quantity
        if (item.stackable) {
          existingItem.quantity += item.quantity || 1;
        }
        // Otherwise ignore duplicate items
      } else {
        // Set default quantity if not provided
        if (!item.hasOwnProperty('quantity')) {
          item.quantity = 1;
        }
        this.items.push(item);
      }
  
      // Trigger update callback if defined
      if (this.onUpdate) {
        this.onUpdate();
      }
      
      return true;
    }
  
    removeItem(itemId) {
      const itemIndex = this.items.findIndex(item => item.id === itemId);
      
      if (itemIndex > -1) {
        this.items.splice(itemIndex, 1);
        
        // Trigger update callback if defined
        if (this.onUpdate) {
          this.onUpdate();
        }
        
        return true;
      }
      
      return false;
    }
  
    hasItem(itemId) {
      return this.items.some(item => item.id === itemId);
    }
  
    getItem(itemId) {
      return this.items.find(item => item.id === itemId);
    }
  
    getItems() {
      return this.items;
    }
  
    // Method to set callback when inventory changes
    setUpdateCallback(callback) {
      this.onUpdate = callback;
    }
  }
  
  // Create a global inventory instance
  window.playerInventory = new Inventory();