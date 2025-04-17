class NameGuessingMenu {
  constructor({ ghostId, onComplete }) {
    this.ghostId = ghostId;
    this.onComplete = onComplete; // This function now expects a result (ghost or null)
    this.element = null;
    this.nameInput = null;
    this.guestBookElement = null;
    this.isGuestBookOpen = false;
  }


  createElement() {
    // Create main container
    this.element = document.createElement("div");
    this.element.classList.add("NameGuessingMenu");

    this.element.innerHTML = (`
      <h2 class="NameGuessingMenu_title">Guess the Ghost's Name</h2>
      <div class="NameGuessingMenu_content">
        <input type="text" placeholder="Enter ghost's name..." class="NameGuessingMenu_input">
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
    
    // Add keyboard event listener for Enter key
    this.nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.makeGuess();
      }
    });
  }
  
  createGuestBookElement() {
    this.guestBookElement = document.createElement("div");
    this.guestBookElement.classList.add("GuestBook");
    
    // Add CSS to limit the size and make it scrollable
    this.guestBookElement.style.maxWidth = "300px"; // Adjust as needed
    this.guestBookElement.style.maxHeight = "200px"; // Adjust as needed
    this.guestBookElement.style.overflowY = "auto";
    this.guestBookElement.style.overflowX = "hidden";
    
    // Get active entries
    const activeEntries = window.guestBook.getAllActiveEntries();
    
    // Create the guest book HTML
    let guestBookHTML = `
      <div class="GuestBook_header">
        <h3>Grand Hotel Guest Book</h3>
        <button class="GuestBook_close">✕</button>
      </div>
      <div class="GuestBook_entries">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Room</th>
              <th>Notable Detail</th>
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
        <p>Click on a name to select it</p>
      </div>
    `;
    
    this.guestBookElement.innerHTML = guestBookHTML;
    
    // Add event listeners
    this.guestBookElement.querySelector(".GuestBook_close").addEventListener("click", () => {
      this.toggleGuestBook();
    });
    
    // Add click listeners to all entries
    this.guestBookElement.querySelectorAll(".GuestBook_entry").forEach(entry => {
      entry.addEventListener("click", () => {
        const name = entry.querySelector("td").textContent;
        this.nameInput.value = name;
        this.toggleGuestBook();
      });
    });
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
    }
  }
  makeGuess() {
    const guessedName = this.nameInput.value.trim();

    if (!guessedName) {
      this.showMessage("Please enter a name.");
      return;
    }

    const ghost = utils.getGameObjectByIdFromAnyMap(this.ghostId);

    if (!ghost || typeof ghost.checkNameGuess !== "function") {
      this.showMessage("Something went wrong with this ghost.");
      // Don't close automatically, let OverworldEvent handle it via onComplete(null)
      this.onComplete(null); // Signal failure/error
      return;
    }

    const result = ghost.checkNameGuess(guessedName);

    if (result.success) {
      // 1. Update ghost state
      ghost.hasBeenIdentified = true;

      // 2. Mark in guest book
      if (ghost.realName) {
          window.guestBook.markAsDisappeared(ghost.realName);
      }

      // 3. Check Chapter 2 completion (Keep this logic)
      const chapter2Ghosts = ["ghost1", "ghost2", "ghost3", "ghost4", "ghost5", "ghost6", "ghost7"];
      const allChapter2Identified = chapter2Ghosts.every(id => {
          const g = utils.getGameObjectByIdFromAnyMap(id);
          return !g || (g && g.hasBeenIdentified);
      });
      if (allChapter2Identified && !utils.gameProgress.chapter2Completed) {
          utils.gameProgress.chapter2Completed = true;
          console.log("Chapter 2 marked as completed!");
      }

      // 4. Update the ghost's talking array to the ending sequence
      ghost.updateTalking();

      // 5. Show success message (Still useful feedback)
      this.showMessage(result.message); // Show the "Yes! I remember..." message

      // 6. ***MODIFIED***: Call onComplete with the ghost object immediately
      //    Let the OverworldEvent handle closing the menu and starting the next sequence.
      this.onComplete(ghost); // Pass the identified ghost back
    } else {
      // --- Failure logic ---
      // 1. Update the ghost's state (attempts, potential lockout) and dialogue
      //    checkNameGuess already increments attempts and sets lockoutEndTime if needed.
      //    updateTalking will set the appropriate dialogue (lockout message or standard guess prompt)
      //    for the *next* interaction, but we don't need it for the current message.
      //    ghost.updateTalking(); // Calling this might prematurely show lockout message if attempts just hit max

      // 2. Show the failure message returned by checkNameGuess
      this.showMessage(result.message); // Shows "No... that doesn't sound right." OR the lockout message

      // 3. Clear the input field so the player can type a new guess
      this.nameInput.value = "";

      // 4. ***REMOVED***: Do NOT call onComplete here.
      //    The menu should stay open, displaying the message, until the player
      //    either guesses correctly or clicks Cancel.
      // this.onComplete(null); // <-- Line removed
    }
  }
  
  showMessage(text) {
    // Remove any existing message
    const existingMessage = this.element.querySelector(".NameGuessingMenu_message");
    if (existingMessage) {
      existingMessage.remove();
    }
    
    // Create and add new message
    const message = document.createElement("p");
    message.classList.add("NameGuessingMenu_message");
    message.textContent = text;
    
    this.element.querySelector(".NameGuessingMenu_content").appendChild(message);
  }
  
  close() {
    // Remove guest book if it's open
    if (this.isGuestBookOpen && this.guestBookElement) {
      this.guestBookElement.remove();
    }
    
    // Remove the menu
    this.element.remove();
    
    // Call the onComplete callback
    //this.onComplete();
  }

  init(container) {
    this.createElement();

    // ***MODIFIED***: Add listener for Cancel button to call onComplete(null)
    this.element.querySelector(".NameGuessingMenu_button--cancel").addEventListener("click", () => {
        this.onComplete(null); // Signal cancellation
    });

    container.appendChild(this.element);

    setTimeout(() => {
      this.nameInput.focus();
    }, 10);
  }
}