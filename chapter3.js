class Chapter3 {
    constructor(game) {
      this.game = game;
      this.letterStack = []; // Stack to store letters
      this.lettersDelivered = 0;
      this.totalLetters = 5;
    }
  
    start() {
      this.game.showMap("Street"); // Reuse map as Mailroom
      this.game.setDialogue("npc7", [
        "I was the mail clerk... I couldn’t deliver these letters before I died.",
        "They were written by the guests... now lost to time.",
        "Please, help me deliver them... in the order they were written... backwards."
      ]);
      this.setupLetters();
      this.placeDoors();
      this.game.onPlayerNear("npc7", () => this.startLetterDelivery());
    }
  
    setupLetters() {
      // Push letters in order they were written
      this.letterStack.push({ room: "105", text: "Dearest sister, forgive me for leaving so soon." });
      this.letterStack.push({ room: "104", text: "Tell mother I danced in the ballroom one last time." });
      this.letterStack.push({ room: "103", text: "The view from the window still haunts me." });
      this.letterStack.push({ room: "102", text: "I wished to say goodbye... but time ran out." });
      this.letterStack.push({ room: "101", text: "This place held my last breath, keep it safe." });
    }
  
    placeDoors() {
      for (let i = 101; i <= 105; i++) {
        this.game.placeInteractive(`door_${i}`, `Door to Room ${i}`, () => this.tryDeliverLetter(i));
      }
    }
  
    startLetterDelivery() {
      this.game.setObjective("Deliver all letters using the mail clerk’s instructions.");
    }
  
    tryDeliverLetter(roomNumber) {
      if (this.letterStack.length === 0) {
        this.game.setDialogue("npc7", [
          "You’ve done it... All the letters have been delivered...",
          "Their voices can rest now. And so can I...",
          "Thank you..." 
        ]);
        this.game.fadeOut(() => {
          this.game.removeNPC("npc7");
          this.game.completeChapter();
        });
        return;
      }
  
      const currentLetter = this.letterStack[this.letterStack.length - 1];
  
      if (parseInt(currentLetter.room) === roomNumber) {
        this.letterStack.pop();
        this.lettersDelivered++;
  
        this.game.playCutscene(() => {
          this.game.animate("slide_letter", `door_${roomNumber}`);
          this.game.showText(currentLetter.text);
          this.game.fadeIn(() => {
            if (this.letterStack.length === 0) {
              this.tryDeliverLetter(roomNumber); // Trigger ending after last letter
            }
          });
        });
      } else {
        this.game.showMessage("That’s not the right room. Think carefully.");
      }
    }
  }
  
  export default Chapter3;
  