class GhostName extends Ghost {
    constructor(config) {
        super(config);

        // Ghost name properties
        this.rememberedDetail = config.rememberedDetail || "";
        this.realName = config.realName || null;
        this.guessAttempts = 0;
        this.maxGuessAttempts = 3;
        this.hasBeenIdentified = false;

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
    
        this.updateTalking(); // Make sure dialogue updates after realName is set
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
        } else if (this.guessAttempts >= this.maxGuessAttempts) {
            this.talking = [{
                events: [
                    { type: "textMessage", text: "I'm sorry, I can't remember my name...", faceHero: this.id },
                    { type: "textMessage", text: `All I remember is that I ${this.rememberedDetail}...` },
                    { type: "textMessage", text: "I guess I'll be stuck here forever..." },
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
          return {
            success: true,
            message: `Yes! I remember now. I am ${this.realName}!`,
          };
        } else {
          return {
            success: false,
            message: "No... that doesn't sound right.",
          };      

        }
    }    
}
