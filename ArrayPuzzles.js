class ArrayPuzzles {
    constructor() {
      this.puzzles = [
        {
          id: "sort",
          title: "Chronological Order",
          description: "Elias remembers meeting these people, but can't recall the order. Arrange them chronologically based on when Elias met them.",
          type: "sort",
          data: {
            names: ["Sarah (Barista)", "Detective Morgan", "Professor Adams", "Mr. Thompson", "Lily (Student)"]
          },
          completed: false
        },
        {
          id: "find",
          title: "The Missing Person",
          description: "Compare Elias's memory with the café's security footage. Someone is missing from the footage...",
          type: "find",
          data: {
            eliasMemory: ["Sarah (Barista)", "Detective Morgan", "Professor Adams", "Mr. Thompson", "Lily (Student)", "Dr. Reynolds"],
            securityFootage: ["Sarah (Barista)", "Detective Morgan", "Professor Adams", "Mr. Thompson", "Lily (Student)"]
          },
          completed: false
        },
        {
          id: "filter",
          title: "False Memories",
          description: "Some of Elias's memories are false. Help identify and filter out the fake ones.",
          type: "filter",
          data: {
            trueMemories: [
              "I ordered a cappuccino at 9:15 AM",
              "Sarah made my drink",
              "Professor Adams was grading papers",
              "Lily was studying for an exam",
              "Detective Morgan arrived at 9:30 AM"
            ],
            falseMemories: [
              "I ordered a sandwich",
              "The café was closed early",
              "I talked to the mayor",
              "The lights went out suddenly"
            ]
          },
          completed: false
        }
      ];
      
      this.currentPuzzleIndex = 0;
    }
    
    getCurrentPuzzle() {
      return this.puzzles[this.currentPuzzleIndex];
    }
    
    markCurrentPuzzleComplete() {
      this.puzzles[this.currentPuzzleIndex].completed = true;
      this.currentPuzzleIndex++;
    }
    
    areAllPuzzlesComplete() {
      return this.puzzles.every(puzzle => puzzle.completed);
    }
    
    reset() {
      this.puzzles.forEach(puzzle => {
        puzzle.completed = false;
      });
      this.currentPuzzleIndex = 0;
    }
  }