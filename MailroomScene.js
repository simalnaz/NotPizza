class MailroomScene {
    constructor(game) {
      this.game = game;
      this.hero = game.hero;
      this.letterStack = []; // Stack to store letters (LIFO)
      this.lettersDelivered = 0;
      this.totalLetters = 5;
      this.npcId = "npc7";
      this.isQuestActive = false;
    }
  
    start() {
      // Reuse the street map as the mailroom
      this.game.showMap("Street");
      
      // Create the ghost mail clerk NPC
      this.createMailClerk();
      
      // Set up the letters that will be found
      this.setupLetters();
      
      // Place hotel room doors on the map
      this.placeHotelDoors();
      
      // Set up the trigger for when hero approaches the mail clerk
      this.game.onPlayerNear(this.npcId, () => this.initiateMailQuest());
    }
  
    createMailClerk() {
      // Create the ghost mail clerk at a specific position
      this.game.createNPC({
        id: this.npcId,
        x: utils.withGrid(10),
        y: utils.withGrid(10),
        src: "/images/characters/people/npc7.png",
        direction: "down",
        talking: [
          { text: "I was the mail clerk here before... before the incident." },
          { text: "These letters... I failed to deliver them... the guests' final words." },
          { text: "I'm bound to this mailroom until they reach their destinations." },
          { text: "Please help me... deliver them in reverse order of when I received them." }
        ]
      });
      
      // Make the NPC slightly transparent and add a ghostly effect
      const npc = utils.getGameObjectByIdFromAnyMap(this.npcId);
      if (npc) {
        npc.sprite.setOpacity(0.8);
        this.game.addEffect("ghostly_glow", npc);
      }
    }
  
    setupLetters() {
      // Push letters in the order they were written (will be delivered in reverse)
      this.letterStack.push({
        id: "letter1",
        room: "101",
        text: "I leave this hotel knowing I'll never return. What peace I found here.",
        sender: "Arthur Holcomb"
      });
      
      this.letterStack.push({
        id: "letter2",
        room: "203",
        text: "My dearest, I'm sorry I couldn't say goodbye in person. Wait for me.",
        sender: "Clara M."
      });
      
      this.letterStack.push({
        id: "letter3",
        room: "312",
        text: "The manuscript is hidden behind the painting. Tell no one.",
        sender: "Unknown"
      });
      
      this.letterStack.push({
        id: "letter4",
        room: "418",
        text: "I forgive you for everything. I hope you can forgive yourself.",
        sender: "Your Brother"
      });
      
      this.letterStack.push({
        id: "letter5",
        room: "520",
        text: "The key you seek is in the basement safe. The combination is our anniversary.",
        sender: "E."
      });
    }
  
    placeHotelDoors() {
      // Create interactive doors for each room that needs a letter
      const rooms = ["101", "203", "312", "418", "520"];
      
      rooms.forEach(roomNum => {
        // Calculate positions (these would normally come from your map data)
        const position = this.getDoorPosition(roomNum);
        
        this.game.placeInteractive({
          id: `door_${roomNum}`,
          x: position.x,
          y: position.y,
          sprite: "door_closed",
          name: `Room ${roomNum}`,
          onInteract: () => this.tryDeliverLetter(roomNum)
        });
      });
    }
    
    getDoorPosition(roomNum) {
      // This function would normally use your map's layout
      // For now, we'll place doors in some arbitrary positions
      const positions = {
        "101": { x: utils.withGrid(3), y: utils.withGrid(2) },
        "203": { x: utils.withGrid(7), y: utils.withGrid(2) },
        "312": { x: utils.withGrid(11), y: utils.withGrid(2) },
        "418": { x: utils.withGrid(15), y: utils.withGrid(2) },
        "520": { x: utils.withGrid(19), y: utils.withGrid(2) }
      };
      
      return positions[roomNum];
    }
  
    initiateMailQuest() {
      if (!this.isQuestActive) {
        this.isQuestActive = true;
        
        // Show a dialogue explaining the quest
        this.game.showDialogue([
          { character: this.npcId, text: "Those letters on the desk... they're the final messages from departed guests." },
          { character: this.npcId, text: "I was meant to deliver them... but then the fire..." },
          { character: this.npcId, text: "Please help me... take the letters to their rooms." },
          { character: this.npcId, text: "But remember - deliver the most recent one first. The one on top of the stack." },
          { character: this.npcId, text: "I'll be free once they've all reached their destinations." }
        ]);
        
        // Set player objective
        this.game.setObjective("Deliver the guests' final letters in reverse order of writing.");
        
        // Visually show the letters for the player to collect
        this.revealLetters();
      }
    }
    
    revealLetters() {
      // Create a visual of stacked letters for the player to interact with
      this.game.placeInteractive({
        id: "letter_stack",
        x: utils.withGrid(10),
        y: utils.withGrid(6),
        sprite: "letter_stack",
        name: "Stack of Undelivered Letters",
        onInteract: () => this.collectLetters()
      });
    }
    
    collectLetters() {
      // Animation of hero picking up the letters
      this.game.animateCharacter(this.hero.id, "pickup");
      
      this.game.showMessage("You collected the stack of undelivered letters.");
      
      // Remove the letter stack object from the map
      this.game.removeInteractive("letter_stack");
      
      // Add letters to inventory (visual indicator)
      this.game.addInventoryItem("letters", "Undelivered Letters", "A stack of 5 letters that were never delivered.");
      
      // Hint to the player about delivery order
      setTimeout(() => {
        this.game.showMessage("Remember to deliver the most recent letter (top of stack) first.");
      }, 2000);
    }
  
    tryDeliverLetter(roomNumber) {
      // If quest not active or letters not collected
      if (!this.isQuestActive || !this.game.hasInventoryItem("letters")) {
        this.game.showMessage("This door is locked.");
        return;
      }
      
      // If the stack is empty, all letters have been delivered
      if (this.letterStack.length === 0) {
        this.game.showMessage("You've delivered all the letters.");
        return;
      }
      
      // Get the letter from the top of the stack (most recent)
      const currentLetter = this.letterStack[this.letterStack.length - 1];
      
      // Check if this is the correct room for the current letter
      if (currentLetter.room === roomNumber) {
        // Pop the letter from the stack (LIFO)
        const deliveredLetter = this.letterStack.pop();
        this.lettersDelivered++;
        
        // Play the delivery cutscene
        this.playDeliveryCutscene(deliveredLetter, roomNumber);
      } else {
        // Wrong room for this letter
        this.game.showMessage("This doesn't seem like the right room for the next letter.");
      }
    }
    
    playDeliveryCutscene(letter, roomNumber) {
      // Begin the cutscene sequence
      this.game.startCutscene();
      
      // Walk the hero to the door
      const doorPosition = this.getDoorPosition(roomNumber);
      this.game.moveCharacterTo(this.hero.id, doorPosition.x, doorPosition.y);
      
      // Animation of sliding letter under door
      this.game.wait(500)
        .then(() => {
          this.game.animateCharacter(this.hero.id, "kneel");
          return this.game.wait(300);
        })
        .then(() => {
          this.game.playSound("paper_slide");
          this.game.showEffect("letter_slide", doorPosition.x, doorPosition.y);
          return this.game.wait(700);
        })
        .then(() => {
          // Show the letter content to the player
          this.game.showLetter({
            content: letter.text,
            sender: letter.sender,
            recipient: `Room ${roomNumber}`
          });
          return this.game.wait(3000);
        })
        .then(() => {
          this.game.hideLetter();
          this.game.animateCharacter(this.hero.id, "stand");
          
          // Update quest status
          this.game.showMessage(`Letter delivered to Room ${roomNumber}. ${this.letterStack.length} remaining.`);
          
          // End the cutscene
          this.game.endCutscene();
          
          // Check if all letters are delivered
          if (this.letterStack.length === 0) {
            this.completeMission();
          }
        });
    }
    
    completeMission() {
      // Start the completion cutscene
      this.game.wait(1000)
        .then(() => {
          // Move player back to the mail clerk
          const npc = utils.getGameObjectByIdFromAnyMap(this.npcId);
          if (npc) {
            this.game.moveCharacterTo(this.hero.id, npc.x - utils.withGrid(1), npc.y);
          }
          return this.game.wait(1000);
        })
        .then(() => {
          // Final dialogue from the ghost
          return this.game.showDialogue([
            { character: this.npcId, text: "You did it... all the letters have been delivered." },
            { character: this.npcId, text: "Their final words will reach their intended ears at last." },
            { character: this.npcId, text: "I can finally rest... thank you..." }
          ]);
        })
        .then(() => {
          // Ghost fading away animation
          const npc = utils.getGameObjectByIdFromAnyMap(this.npcId);
          if (npc) {
            this.game.addEffect("fade_away", npc);
            this.game.playSound("ghost_release");
          }
          return this.game.wait(3000);
        })
        .then(() => {
          // Remove NPC from the scene
          this.game.removeNPC(this.npcId);
          
          // Complete quest objective
          this.game.completeObjective("Deliver the guests' final letters in reverse order of writing.");
          
          // Reward the player
          this.game.addInventoryItem("spectral_key", "Spectral Key", "A ghostly key that appears solid only in moonlight.");
          this.game.showMessage("You found a Spectral Key where the mail clerk was standing.");
          
          // Remove letters from inventory
          this.game.removeInventoryItem("letters");
        });
    }
  }