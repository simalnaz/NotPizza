class GhostName extends Ghost {
    constructor(config) {
      super(config);
      
      // Ghost name properties
      this.rememberedDetail = config.rememberedDetail || "";
      this.realName = config.realName || null;
      this.guessAttempts = 0;
      this.maxGuessAttempts = 3;
      this.hasBeenIdentified = false;
      
      // If real name isn't explicitly provided, look it up from the guest book
      if (!this.realName && this.rememberedDetail) {
        this.realName = window.guestBook.getNameByDescription(this.rememberedDetail);
      }
      
      // Set up dialogue based on remembered detail
      this.updateTalking();
    }
    
    updateTalking() {
      // Base dialogue - changes based on ghost state
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
      } else {
        this.talking = [{
          events: [
            { type: "textMessage", text: "I... I can't remember my name...", faceHero: this.id },
            { type: "textMessage", text: `All I remember is that I ${this.rememberedDetail}...` },
            { type: "textMessage", text: "Can you help me? I need to know who I was." },
            { type: "nameGuess", ghostId: this.id }
          ]
        }];
      }
    }
    
    checkNameGuess(guessedName) {
      this.guessAttempts++;
      
      if (guessedName === this.realName) {
        // Correct guess
        this.hasBeenIdentified = true;
        window.guestBook.markAsDisappeared(this.realName);
        this.updateTalking();
        
        return {
          success: true,
          message: `Yes! I remember now. I am ${this.realName}!`,
          remainingGhosts: window.guestBook.getRemainingGhostsCount()
        };
      } else {
        // Wrong guess
        const attemptsLeft = this.maxGuessAttempts - this.guessAttempts;
        
        if (attemptsLeft <= 0) {
          return {
            success: false,
            message: `I don't think that's right... Maybe check the guest book again. I remember I ${this.rememberedDetail}.`,
            attemptsLeft: 0
          };
        }
        
        return {
          success: false,
          message: `No, that doesn't sound familiar... I ${this.rememberedDetail}. Please try again.`,
          attemptsLeft: attemptsLeft
        };
      }
    }
  }
