class InventoryMenu {
    constructor({
      onComplete,
      onUse,
      maxItemsPerPage = 6
    }) {
      this.onComplete = onComplete || function() {};
      this.onUse = onUse || function() {};
      this.maxItemsPerPage = maxItemsPerPage;
      this.currentPage = 0;
      this.element = null;
      this.inventoryListElement = null;
      this.descriptionElement = null;
      this.imageElement = null;
      this.selectedIndex = 0;
    }
  
    getOptions() {
      return window.playerInventory.getItems();
    }
  
    createElement() {
      this.element = document.createElement("div");
      this.element.classList.add("InventoryMenu");
  
      // Create inventory title
      const titleContainer = document.createElement("div");
      titleContainer.classList.add("InventoryMenu_title");
      titleContainer.innerText = "Inventory";
      this.element.appendChild(titleContainer);
  
      // Create items container
      const itemsContainer = document.createElement("div");
      itemsContainer.classList.add("InventoryMenu_items-container");
      this.element.appendChild(itemsContainer);
  
      // Create inventory list
      this.inventoryListElement = document.createElement("div");
      this.inventoryListElement.classList.add("InventoryMenu_list");
      itemsContainer.appendChild(this.inventoryListElement);
  
      // Create item details panel
      const detailsPanel = document.createElement("div");
      detailsPanel.classList.add("InventoryMenu_details");
      itemsContainer.appendChild(detailsPanel);
  
      // Create item image container
      const imageContainer = document.createElement("div");
      imageContainer.classList.add("InventoryMenu_image-container");
      this.imageElement = document.createElement("div");
      this.imageElement.classList.add("InventoryMenu_image");
      imageContainer.appendChild(this.imageElement);
      detailsPanel.appendChild(imageContainer);
  
      // Create item description
      this.descriptionElement = document.createElement("div");
      this.descriptionElement.classList.add("InventoryMenu_description");
      detailsPanel.appendChild(this.descriptionElement);
  
      // Create instructions text
      const instructions = document.createElement("div");
      instructions.classList.add("InventoryMenu_instructions");
      instructions.innerHTML = "<p>Arrow Keys: Navigate | Enter: Use | Esc: Close</p>";
      this.element.appendChild(instructions);
    }
  
    updateInventoryList() {
      this.inventoryListElement.innerHTML = "";
      const items = this.getOptions();
      const startIndex = this.currentPage * this.maxItemsPerPage;
      const endIndex = Math.min(startIndex + this.maxItemsPerPage, items.length);
  
      // Create pagination indicator if we have more than one page
      if (items.length > this.maxItemsPerPage) {
        const paginationElement = document.createElement("div");
        paginationElement.classList.add("InventoryMenu_pagination");
        paginationElement.innerText = `Page ${this.currentPage + 1}/${Math.ceil(items.length / this.maxItemsPerPage)}`;
        this.inventoryListElement.appendChild(paginationElement);
      }
  
      // Add empty message if no items
      if (items.length === 0) {
        const emptyElement = document.createElement("div");
        emptyElement.classList.add("InventoryMenu_empty");
        emptyElement.innerText = "Inventory is empty";
        this.inventoryListElement.appendChild(emptyElement);
        return;
      }
  
      // Create list items
      for (let i = startIndex; i < endIndex; i++) {
        const item = items[i];
        const itemElement = document.createElement("div");
        itemElement.classList.add("InventoryMenu_item");
        
        if (i === this.selectedIndex) {
          itemElement.classList.add("selected");
        }
        
        // Create icon element
        const iconElement = document.createElement("div");
        iconElement.classList.add("InventoryMenu_icon");
        
        // Add item-specific styling if needed
        if (item.icon) {
          iconElement.style.backgroundImage = `url(${item.icon})`;
        } else {
          // Default icon based on item type
          iconElement.classList.add(`icon-${item.type || 'default'}`);
        }
        
        itemElement.appendChild(iconElement);
        
        // Create label element
        const labelElement = document.createElement("span");
        labelElement.innerText = item.name || item.id;
        itemElement.appendChild(labelElement);
        
        // Add quantity indicator if more than 1
        if (item.quantity > 1) {
          const quantityElement = document.createElement("span");
          quantityElement.classList.add("InventoryMenu_quantity");
          quantityElement.innerText = `x${item.quantity}`;
          itemElement.appendChild(quantityElement);
        }
        
        this.inventoryListElement.appendChild(itemElement);
      }
  
      // Update details panel
      this.updateItemDetails();
    }
  
    updateItemDetails() {
      const items = this.getOptions();
      
      if (items.length === 0 || this.selectedIndex >= items.length) {
        this.descriptionElement.innerText = "";
        this.imageElement.style.backgroundImage = "";
        return;
      }
      
      const selectedItem = items[this.selectedIndex];
      
      // Update description
      this.descriptionElement.innerHTML = `
        <h3>${selectedItem.name || selectedItem.id}</h3>
        <p>${selectedItem.description || ""}</p>
      `;
      
      // Update image
      if (selectedItem.icon) {
        this.imageElement.style.backgroundImage = `url(${selectedItem.icon})`;
      } else {
        // Default image based on item type
        this.imageElement.style.backgroundImage = "";
        this.imageElement.classList.add(`icon-${selectedItem.type || 'default'}`);
      }
    }
  
    handleKeyDown(event) {
      const items = this.getOptions();
      const itemsPerPage = this.maxItemsPerPage;
      const totalPages = Math.ceil(items.length / itemsPerPage);
      
      switch (event.key) {
        case "ArrowUp":
          this.selectedIndex--;
          if (this.selectedIndex < 0) {
            this.selectedIndex = items.length - 1;
            this.currentPage = totalPages - 1;
          } else if (this.selectedIndex < this.currentPage * itemsPerPage) {
            this.currentPage--;
          }
          this.updateInventoryList();
          event.preventDefault();
          break;
          
        case "ArrowDown":
          this.selectedIndex++;
          if (this.selectedIndex >= items.length) {
            this.selectedIndex = 0;
            this.currentPage = 0;
          } else if (this.selectedIndex >= (this.currentPage + 1) * itemsPerPage) {
            this.currentPage++;
          }
          this.updateInventoryList();
          event.preventDefault();
          break;
          
        case "ArrowLeft":
          if (totalPages > 1) {
            this.currentPage = (this.currentPage - 1 + totalPages) % totalPages;
            this.selectedIndex = this.currentPage * itemsPerPage;
            this.updateInventoryList();
            event.preventDefault();
          }
          break;
          
        case "ArrowRight":
          if (totalPages > 1) {
            this.currentPage = (this.currentPage + 1) % totalPages;
            this.selectedIndex = this.currentPage * itemsPerPage;
            this.updateInventoryList();
            event.preventDefault();
          }
          break;
          
        case "Enter":
          if (items.length > 0) {
            const selectedItem = items[this.selectedIndex];
            this.onUse(selectedItem);
          }
          event.preventDefault();
          break;
          
        case "Escape":
          this.close();
          event.preventDefault();
          break;
      }
    }
  
    close() {
      if (this.keyDownHandler) {
        document.removeEventListener("keydown", this.keyDownHandler);
      }
      if (this.element && this.element.parentElement) {
        this.element.parentElement.removeChild(this.element);
      }
      this.onComplete();
    }
  
    init(container) {
      this.createElement();
      container.appendChild(this.element);
      this.updateInventoryList();
  
      // Setup keyboard controls
      this.keyDownHandler = this.handleKeyDown.bind(this);
      document.addEventListener("keydown", this.keyDownHandler);
    }
  }