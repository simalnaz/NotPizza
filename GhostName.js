class GhostName extends Ghost {
    constructor(config) {
        super(config);

        // Ghost name properties
        this.rememberedDetail = config.rememberedDetail || "";
        this.realName = config.realName || null;
        this.guessAttempts = 0;
        this.maxGuessAttempts = 3;
        this.hasBeenIdentified = false;
        this.lockoutEndTime = null; // NEW: Timestamp for when lockout ends

                // --- NEW: Initial Dialogue Handling ---
                this.initialTalking = config.initialTalking || null; // Store initial dialogue sequence
                this.initialDialogueDone = false; // Flag to track if initial talk happened
                // --- END NEW ---

        // Set up dialogue based on remembered detail
        this.updateTalking();
    }

    mount(map) {
        super.mount(map);

        console.log(`[GhostName] Mounting ghost: ${this.id}`);
        console.log(`Remembered detail: ${this.rememberedDetail}`);
        console.log(`Current realName: ${this.realName}`);

        if (!this.realName && this.rememberedDetail) {
            this.realName = window.guestBook.getNameByDescription(this.rememberedDetail);
            console.log(`→ Loaded real name from guest book: ${this.realName}`);
        }

        // Ensure lockout state is checked on mount too
        this.updateTalking();
    }

    updateTalking() {
        const now = Date.now();
    
        if (this.hasBeenIdentified) {
            // --- NEW ENDING SEQUENCE ---
            this.talking = [{
                events: [
                    // Initial "Thank you" is handled by the NameGuessingMenu success message now.
                    // Start directly with the peace message.
                    { type: "textMessage", text: "Ah... yes. That's it. Thank you.", faceHero: this.id }, // Optional slightly different phrasing
                    { type: "textMessage", text: "Now I can finally rest..." },
                    // Message indicating the ghost is fading
                    { type: "textMessage", text: `${this.realName}'s form shimmers and fades away peacefully...` },
                    // Remove the object from the map
                    { type: "removeObject", objectId: this.id },
                    // Optional: Add a concluding message like Elliot's
                    { type: "textMessage", text: "You feel a sense of calm wash over the room..." }
                ]
            }];

        // 2. Check if currently locked out
        } else if (this.lockoutEndTime && now < this.lockoutEndTime) {
            const remainingMs = this.lockoutEndTime - now;
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            const remainingMinutes = Math.floor(remainingSeconds / 60);
            const displaySeconds = remainingSeconds % 60;
            const timeString = `${remainingMinutes}m ${displaySeconds}s`;
    
            this.talking = [{
                events: [
                    { type: "textMessage", text: "The ghost seems weary from your guesses...", faceHero: this.id },
                    { type: "textMessage", text: `It needs time to recover its spectral form. Try again in about ${timeString}.` }
                ]
            }];
            console.log(`[GhostName] UpdateTalking: Lockout active for ${this.id}. Remaining: ${timeString}`);
    
        // --- NEW: 3. Check if initial dialogue needs to be played ---
        } else if (!this.initialDialogueDone && this.initialTalking) {
            // Clone the initial events array to avoid modifying the original config
            let initialEvents = [...this.initialTalking[0].events];
    
            // Add a callback event at the end to mark initial dialogue as done
            // and immediately update talking again to switch to guessing mode
            initialEvents.push({
                type: "callback",
                callback: () => {
                    console.log(`[GhostName] Initial dialogue finished for ${this.id}. Setting initialDialogueDone = true.`);
                    this.initialDialogueDone = true;
                    this.updateTalking(); // Re-run updateTalking to set the guessing dialogue
                }
            });
    
            // Set the current talking sequence to the initial events + callback
            this.talking = [{ events: initialEvents }];
            console.log(`[GhostName] UpdateTalking: Setting initial dialogue for ${this.id}.`);
        // --- END NEW ---
    
        // 4. Not identified, not locked out, initial dialogue done (or no initial dialogue) -> Default guessing dialogue
        } else {
            // If lockout just expired, clear the timestamp
            if (this.lockoutEndTime && now >= this.lockoutEndTime) { // Check if lockout actually expired
                console.log(`[GhostName] UpdateTalking: Lockout expired for ${this.id}.`);
                this.lockoutEndTime = null;
                this.guessAttempts = 0; // Reset attempts when lockout expires
            }
    
            this.talking = [{
                events: [
                    { type: "textMessage", text: "<g>Can you help me? I need to know who I was.<g>" },
                    { type: "nameGuess", ghostId: this.id } // Triggers the NameGuessingMenu
                ]
            }];
             console.log(`[GhostName] UpdateTalking: Setting guessing dialogue for ${this.id}.`);
        }
    }

    checkNameGuess(name) {
        if (!this.realName) {
          return {
            success: false,
            message: "Hmm... I don’t seem to remember my name just yet.",
          };
        }

        const normalizedGuess = name.trim().toLowerCase();
        const normalizedRealName = this.realName.trim().toLowerCase();

        if (normalizedGuess === normalizedRealName) {
          // Correct Guess
          return {
            success: true,
            message: `Yes! I remember now. I am ${this.realName}!`,
          };
        } else {
          // Incorrect Guess
          this.guessAttempts += 1;
          let message = "No... that doesn't sound right."; // Default failure message

          // Check if max attempts reached
          if (this.guessAttempts >= this.maxGuessAttempts) {
              const lockoutDurationMinutes = 2; // Set lockout duration
              this.lockoutEndTime = Date.now() + (lockoutDurationMinutes * 60 * 1000);
              this.guessAttempts = 0; // Reset attempts for the *next* try after lockout
              message = `Too many wrong guesses! The ghost fades slightly, needing time to recover. Try again in ${lockoutDurationMinutes} minutes.`;
              console.log(`[GhostName] Lockout started for ${this.id}. Ends at: ${new Date(this.lockoutEndTime)}`);
          }

          // IMPORTANT: Update talking immediately after changing state (attempts or lockout)
          this.updateTalking();

          return {
            success: false,
            message: message, // Return the potentially modified message
          };
        }
    }
}
