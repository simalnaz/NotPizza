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

        // 1. Check if identified
        if (this.hasBeenIdentified) {
            this.talking = [{
                events: [
                    { type: "textMessage", text: `Thank you for helping me remember! My name is ${this.realName}.`, faceHero: this.id },
                    { type: "textMessage", text: "Now I can finally rest in peace..." },
                    { who: this.id, type: "stand", direction: "up", time: 1000 },
                    { type: "textMessage", text: `${this.realName}'s ghost fades away peacefully...` },
                    { type: "removeObject", objectId: this.id }
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
        // 3. Not identified, not locked out -> Default guessing dialogue
        } else {
            // If lockout just expired, clear the timestamp
            if (this.lockoutEndTime) {
                console.log(`[GhostName] UpdateTalking: Lockout expired for ${this.id}.`);
                this.lockoutEndTime = null;
            }
            // Reset guess attempts if lockout expired (or never started)
            // this.guessAttempts = 0; // Resetting here might be too aggressive, let checkNameGuess handle it.

            this.talking = [{
                events: [
                    { type: "textMessage", text: "I... I can't remember my name...", faceHero: this.id },
                    { type: "textMessage", text: `All I remember is that I ${this.rememberedDetail}...` },
                    { type: "textMessage", text: "Can you help me? I need to know who I was." },
                    { type: "nameGuess", ghostId: this.id } // Triggers the NameGuessingMenu
                ]
            }];
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
