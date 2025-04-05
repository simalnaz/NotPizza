class NameGuessingMenu {
    constructor({ ghostId, onComplete }) {
      this.ghostId = ghostId;
      this.onComplete = onComplete;
      this.element = null;
      this.nameInput = null;
      this.guestBookElement = null;
      this.isGuestBookOpen = false;
      this.overlay = null;
      this.selectedEntryIndex = -1;
    }
  
    createElement() {
      // Create overlay
      this.overlay = document.createElement("div");
      this.overlay.classList.add("menu-overlay");
      
      // Create main container
      this.element = document.createElement("div");
      this.element.classList.add("NameGuessingMenu");
  
      this.element.innerHTML = (`
        <h2 class="NameGuessingMenu_title">Guess the Ghost's Name</h2>
        <div class="NameGuessingMenu_content">
          <input type="text" placeholder="Enter the ghost's name..." class="NameGuessingMenu_input">
          <div class="NameGuessingMenu_buttons">
            <button class="NameGuessingMenu_button NameGuessingMenu_button--guess">Guess</button>
            <button class="NameGuessingMenu_button NameGuessingMenu_button--guest-book">Guest Book</button>
            <button class="NameGuessingMenu_button NameGuessingMenu_button--cancel">Cancel</button>
          </div>
        </div>
        <p class="NameGuessingMenu_hint">
          Tip: Check the Guest Book for clues. Look for a guest who matches the ghost's memory.
        </p>
      `);
  
      // Store references to important elements
      this.nameInput = this.element.querySelector(".NameGuessingMenu_input");
      
      // Add event listeners
      this.element.querySelector(".NameGuessingMenu_button--guess").addEventListener("click", () => {
        this.makeGuess();
      });
      
      this.element.querySelector(".NameGuessingMenu_button--guest-book").addEventListener("click", () => {
        this.toggleGuestBook();
      });
      
      this.element.querySelector(".NameGuessingMenu_button--cancel").addEventListener("click", () => {
        this.close();
      });
      
      // Create guest book element but don't add it to DOM yet
      this.createGuestBookElement();
      
      // Add keyboard event listener for Enter key and other keyboard navigation
      this.nameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          this.makeGuess();
        }
      });
    }
    
    createGuestBookElement() {
        this.guestBookElement = document.createElement("div");
        this.guestBookElement.classList.add("GuestBook");
        
        // Get active entries
        const activeEntries = window.guestBook.getAllActiveEntries();
        
        // Create the guest book HTML with puzzle-like aesthetic
        let guestBookHTML = `
          <div class="GuestBook_header">
            <h3>• Lost Souls Registry •</h3>
            <button class="GuestBook_close">×</button>
          </div>
          <div class="GuestBook_entries">
            <table>
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Room</th>
                  <th>Memory</th>
                  <th>Year</th>
                </tr>
              </thead>
              <tbody>
        `;
        
        // Add each entry
        Object.keys(activeEntries).forEach(name => {
          const entry = activeEntries[name];
          guestBookHTML += `
            <tr class="GuestBook_entry">
              <td>${name}</td>
              <td>${entry.room}</td>
              <td>${entry.description}</td>
              <td>${entry.yearVisited}</td>
            </tr>
          `;
        });
        
        guestBookHTML += `
              </tbody>
            </table>
          </div>
          <div class="GuestBook_footer">
            <p>« Select a name to solve the mystery »</p>
          </div>
        `;
        
        this.guestBookElement.innerHTML = guestBookHTML;
        
        // Add event listeners
        this.guestBookElement.querySelector(".GuestBook_close").addEventListener("click", () => {
          this.toggleGuestBook();
        });
        
        // Add click listeners to all entries with subtle fade effect
        this.guestBookElement.querySelectorAll(".GuestBook_entry").forEach(entry => {
          entry.addEventListener("click", () => {
            // Add a subtle highlight effect when clicking
            entry.style.transition = "background-color 0.3s";
            entry.style.backgroundColor = "#3e3e4a";
            
            setTimeout(() => {
              const name = entry.querySelector("td").textContent;
              this.nameInput.value = name;
              this.toggleGuestBook();
            }, 200);
          });
        });
      }
      
      toggleGuestBook() {
        if (this.isGuestBookOpen) {
          // Add a fade-out effect
          this.guestBookElement.style.transition = "opacity 0.3s";
          this.guestBookElement.style.opacity = "0";
          
          setTimeout(() => {
            this.guestBookElement.remove();
            this.isGuestBookOpen = false;
          }, 300);
        } else {
          // Recreate with fresh data
          this.createGuestBookElement();
          
          // Add to the DOM with fade-in effect
          this.guestBookElement.style.opacity = "0";
          document.body.appendChild(this.guestBookElement);
          
          // Force reflow to ensure the transition works
          this.guestBookElement.offsetHeight;
          
          this.guestBookElement.style.transition = "opacity 0.3s";
          this.guestBookElement.style.opacity = "1";
          this.isGuestBookOpen = true;
        }
      }
    setupGuestBookKeyboardNavigation() {
      // Add keyboard handler for the guest book
      this.guestBookElement.tabIndex = 0; // Make it focusable
      
      this.guestBookElement.addEventListener("keydown", (e) => {
        const entries = Array.from(this.guestBookElement.querySelectorAll(".GuestBook_entry"));
        
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            this.updateSelectedEntry(Math.min(this.selectedEntryIndex + 1, entries.length - 1));
            this.scrollToSelectedEntry();
            break;
            
          case "ArrowUp":
            e.preventDefault();
            this.updateSelectedEntry(Math.max(this.selectedEntryIndex - 1, 0));
            this.scrollToSelectedEntry();
            break;
            
          case "Enter":
            e.preventDefault();
            if (this.selectedEntryIndex >= 0 && this.selectedEntryIndex < entries.length) {
              const selectedEntry = entries[this.selectedEntryIndex];
              const name = selectedEntry.getAttribute("data-name");
              this.nameInput.value = name;
              this.toggleGuestBook();
            }
            break;
            
          case "Escape":
            e.preventDefault();
            this.toggleGuestBook();
            break;
        }
      });
    }
    
    updateSelectedEntry(index) {
      const entries = this.guestBookElement.querySelectorAll(".GuestBook_entry");
      
      // Remove previous selection
      entries.forEach(entry => entry.classList.remove("selected"));
      
      if (index >= 0 && index < entries.length) {
        entries[index].classList.add("selected");
        this.selectedEntryIndex = index;
      }
    }
    
    scrollToSelectedEntry() {
      const entriesContainer = this.guestBookElement.querySelector(".GuestBook_entries");
      const selectedEntry = this.guestBookElement.querySelector(".GuestBook_entry.selected");
      
      if (entriesContainer && selectedEntry) {
        const containerRect = entriesContainer.getBoundingClientRect();
        const selectedRect = selectedEntry.getBoundingClientRect();
        
        // Check if element is not fully visible
        if (selectedRect.top < containerRect.top || selectedRect.bottom > containerRect.bottom) {
          // Calculate scroll position
          if (selectedRect.top < containerRect.top) {
            // Scroll up to show the element
            entriesContainer.scrollTop -= (containerRect.top - selectedRect.top + 10);
          } else {
            // Scroll down to show the element
            entriesContainer.scrollTop += (selectedRect.bottom - containerRect.bottom + 10);
          }
        }
      }
    }
    
    toggleGuestBook() {
      if (this.isGuestBookOpen) {
        this.guestBookElement.remove();
        this.isGuestBookOpen = false;
      } else {
        // Recreate with fresh data (in case ghosts have disappeared)
        this.createGuestBookElement();
        document.querySelector(".game-container").appendChild(this.guestBookElement);
        this.isGuestBookOpen = true;
        
        // Set initial selection to first entry
        setTimeout(() => {
          const entries = this.guestBookElement.querySelectorAll(".GuestBook_entry");
          if (entries.length > 0) {
            this.updateSelectedEntry(0);
          }
          // Focus the guest book for keyboard navigation
          this.guestBookElement.focus();
        }, 100);
      }
    }
    
    makeGuess() {
      const guessedName = this.nameInput.value.trim();
      
      if (!guessedName) {
        // Display error if no name entered
        this.showMessage("Please enter a name.");
        return;
      }
      
      // Get the ghost object
      const ghost = utils.getGameObjectByIdFromAnyMap(this.ghostId);
      
      if (!ghost || typeof ghost.checkNameGuess !== "function") {
        this.showMessage("Something went wrong with this ghost.");
        setTimeout(() => {
          this.close();
        }, 2000);
        return;
      }
      
      // Process the guess
      const result = ghost.checkNameGuess(guessedName);
      
      // Show result message with appropriate styling
      this.showMessage(result.message, result.success ? "success" : "error");
      
      // If successful, close after a delay
      if (result.success) {
        setTimeout(() => {
          this.close();
        }, 2000);
      }
    }
    
    showMessage(text, type = "info") {
      // Remove any existing message
      const existingMessage = this.element.querySelector(".NameGuessingMenu_message");
      if (existingMessage) {
        existingMessage.remove();
      }
      
      // Create and add new message
      const message = document.createElement("p");
      message.classList.add("NameGuessingMenu_message");
      
      // Add type-based class for different styling
      if (type === "success") {
        message.classList.add("NameGuessingMenu_message--success");
      } else if (type === "error") {
        message.classList.add("NameGuessingMenu_message--error");
      }
      
      message.textContent = text;
      
      this.element.querySelector(".NameGuessingMenu_content").appendChild(message);
      
      // Add subtle animation
      message.style.opacity = "0";
      setTimeout(() => {
        message.style.transition = "opacity 0.3s ease-in";
        message.style.opacity = "1";
      }, 10);
    }
    
    close() {
      // Remove guest book if it's open
      if (this.isGuestBookOpen && this.guestBookElement) {
        this.guestBookElement.remove();
      }
      
      // Remove overlay and the menu with a fade effect
      this.element.style.opacity = "0";
      this.overlay.style.opacity = "0";
      
      setTimeout(() => {
        this.element.remove();
        this.overlay.remove();
        
        // Call the onComplete callback
        this.onComplete();
      }, 300);
    }
  
    init(container) {
      this.createElement();
      
      // Add overlay first
      container.appendChild(this.overlay);
      
      // Then add menu
      container.appendChild(this.element);
      
      // Apply transition for fade-in effect
      this.element.style.opacity = "0";
      this.overlay.style.opacity = "0";
      
      // Focus the name input with a slight delay
      setTimeout(() => {
        this.element.style.transition = "opacity 0.3s ease-in";
        this.overlay.style.transition = "opacity 0.3s ease-in";
        this.element.style.opacity = "1";
        this.overlay.style.opacity = "1";
        this.nameInput.focus();
      }, 10);
    }
  }