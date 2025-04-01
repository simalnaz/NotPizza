class PuzzleMenu {
    constructor({ title, description, onComplete, puzzleType, puzzleData }) {
      this.title = title;
      this.description = description;
      this.onComplete = onComplete;
      this.element = null;
      this.puzzleType = puzzleType;
      this.puzzleData = puzzleData;
      this.isComplete = false;
    }
  
    createElement() {
      this.element = document.createElement("div");
      this.element.classList.add("PuzzleMenu");
  
      this.element.innerHTML = (`
        <h2 class="PuzzleMenu_title">${this.title}</h2>
        <p class="PuzzleMenu_description">${this.description}</p>
        <div class="PuzzleMenu_content"></div>
        <button class="PuzzleMenu_close">Close</button>
      `);
  
      const content = this.element.querySelector(".PuzzleMenu_content");
      
      // Create different puzzle interfaces based on type
      if (this.puzzleType === "sort") {
        this.createSortPuzzle(content);
      } else if (this.puzzleType === "find") {
        this.createFindPuzzle(content);
      } else if (this.puzzleType === "filter") {
        this.createFilterPuzzle(content);
      }
  
      this.element.querySelector(".PuzzleMenu_close").addEventListener("click", () => {
        if (this.isComplete) {
          this.done();
        } else {
          const confirmClose = confirm("The puzzle is not complete. Are you sure you want to close?");
          if (confirmClose) {
            this.close();
          }
        }
      });
    }
  
    createSortPuzzle(container) {
      // Create description about sorting
      const infoBox = document.createElement("div");
      infoBox.classList.add("PuzzleMenu_infoBox");
      infoBox.innerHTML = `
        <p>Arrays can be sorted to arrange elements in a specific order.</p>
        <p>Drag and drop the names to arrange them in chronological order.</p>
      `;
      container.appendChild(infoBox);
  
      // Create the names to sort
      const namesContainer = document.createElement("div");
      namesContainer.classList.add("PuzzleMenu_namesContainer");
      
      // Shuffle the names
      const shuffledNames = [...this.puzzleData.names];
      for (let i = shuffledNames.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledNames[i], shuffledNames[j]] = [shuffledNames[j], shuffledNames[i]];
      }
      
      // Create draggable elements
      shuffledNames.forEach(name => {
        const nameElement = document.createElement("div");
        nameElement.classList.add("PuzzleMenu_draggableItem");
        nameElement.textContent = name;
        nameElement.setAttribute("draggable", true);
        
        nameElement.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/plain", name);
          nameElement.classList.add("dragging");
        });
        
        nameElement.addEventListener("dragend", () => {
          nameElement.classList.remove("dragging");
        });
        
        namesContainer.appendChild(nameElement);
      });
      
      container.appendChild(namesContainer);
      
      // Create drop area
      const dropArea = document.createElement("div");
      dropArea.classList.add("PuzzleMenu_dropArea");
      
      const dropBoxes = [];
      for (let i = 0; i < this.puzzleData.names.length; i++) {
        const dropBox = document.createElement("div");
        dropBox.classList.add("PuzzleMenu_dropBox");
        dropBox.setAttribute("data-position", i);
        
        dropBox.addEventListener("dragover", (e) => {
          e.preventDefault();
          dropBox.classList.add("hover");
        });
        
        dropBox.addEventListener("dragleave", () => {
          dropBox.classList.remove("hover");
        });
        
        dropBox.addEventListener("drop", (e) => {
          e.preventDefault();
          dropBox.classList.remove("hover");
          
          const name = e.dataTransfer.getData("text/plain");
          if (!dropBox.hasChildNodes()) {
            // Find and remove the original element
            const nameElements = namesContainer.querySelectorAll(".PuzzleMenu_draggableItem");
            nameElements.forEach(el => {
              if (el.textContent === name) {
                el.remove();
              }
            });
            
            // Create a new element in the drop box
            const placedName = document.createElement("div");
            placedName.classList.add("PuzzleMenu_placedItem");
            placedName.textContent = name;
            dropBox.appendChild(placedName);
            
            // Check if complete
            this.checkSortCompletion();
          }
        });
        
        dropBoxes.push(dropBox);
        dropArea.appendChild(dropBox);
      }
      
      container.appendChild(dropArea);
      
      // Add a check button
      const checkButton = document.createElement("button");
      checkButton.classList.add("PuzzleMenu_checkButton");
      checkButton.textContent = "Check Order";
      checkButton.addEventListener("click", () => {
        this.checkSortCompletion(true);
      });
      
      container.appendChild(checkButton);
    }
  
    checkSortCompletion(showFeedback = false) {
      const dropBoxes = this.element.querySelectorAll(".PuzzleMenu_dropBox");
      
      // Check if all boxes are filled
      let allFilled = true;
      for (const box of dropBoxes) {
        if (!box.hasChildNodes()) {
          allFilled = false;
          break;
        }
      }
      
      if (!allFilled) {
        if (showFeedback) {
          alert("Please place all names in order first.");
        }
        return;
      }
      
      // Check if order is correct
      let isCorrect = true;
      const correctOrder = this.puzzleData.names;
      
      dropBoxes.forEach((box, index) => {
        const name = box.querySelector(".PuzzleMenu_placedItem").textContent;
        if (name !== correctOrder[index]) {
          isCorrect = false;
        }
      });
      
      if (isCorrect) {
        this.isComplete = true;
        
        // Create success message
        const successMessage = document.createElement("div");
        successMessage.classList.add("PuzzleMenu_success");
        successMessage.textContent = "Correct! Elias's memories are becoming clearer...";
        
        const content = this.element.querySelector(".PuzzleMenu_content");
        content.innerHTML = '';
        content.appendChild(successMessage);
        
        // Change close button to continue
        const closeButton = this.element.querySelector(".PuzzleMenu_close");
        closeButton.textContent = "Continue";
      } else if (showFeedback) {
        alert("That's not quite right. Try rearranging the names.");
      }
    }
  
    createFindPuzzle(container) {
      // Create description about finding elements
      const infoBox = document.createElement("div");
      infoBox.classList.add("PuzzleMenu_infoBox");
      infoBox.innerHTML = `
        <p>Arrays let us search for specific elements using methods like indexOf().</p>
        <p>Compare Elias's memory with the café security footage to find who's missing.</p>
      `;
      container.appendChild(infoBox);
      
      // Create two columns
      const columnsContainer = document.createElement("div");
      columnsContainer.classList.add("PuzzleMenu_columns");
      
      // Elias's memory column
      const memoryColumn = document.createElement("div");
      memoryColumn.classList.add("PuzzleMenu_column");
      memoryColumn.innerHTML = `
        <h3>Elias's Memory</h3>
        <div class="PuzzleMenu_list memory-list"></div>
      `;
      
      // Security footage column
      const securityColumn = document.createElement("div");
      securityColumn.classList.add("PuzzleMenu_column");
      securityColumn.innerHTML = `
        <h3>Café Security Footage</h3>
        <div class="PuzzleMenu_list security-list"></div>
      `;
      
      columnsContainer.appendChild(memoryColumn);
      columnsContainer.appendChild(securityColumn);
      container.appendChild(columnsContainer);
      
      // Populate Elias's memory list
      const memoryList = memoryColumn.querySelector(".memory-list");
      this.puzzleData.eliasMemory.forEach(name => {
        const nameElement = document.createElement("div");
        nameElement.classList.add("PuzzleMenu_listItem");
        nameElement.textContent = name;
        nameElement.addEventListener("click", () => this.highlightItem(nameElement));
        memoryList.appendChild(nameElement);
      });
      
      // Populate security footage list
      const securityList = securityColumn.querySelector(".security-list");
      this.puzzleData.securityFootage.forEach(name => {
        const nameElement = document.createElement("div");
        nameElement.classList.add("PuzzleMenu_listItem");
        nameElement.textContent = name;
        nameElement.addEventListener("click", () => this.highlightItem(nameElement));
        securityList.appendChild(nameElement);
      });
      
      // Create answer section
      const answerSection = document.createElement("div");
      answerSection.classList.add("PuzzleMenu_answerSection");
      answerSection.innerHTML = `
        <p>Who is missing from the security footage?</p>
        <input type="text" class="PuzzleMenu_answerInput" placeholder="Enter name...">
        <button class="PuzzleMenu_submitButton">Submit Answer</button>
      `;
      
      const submitButton = answerSection.querySelector(".PuzzleMenu_submitButton");
      submitButton.addEventListener("click", () => {
        const answer = answerSection.querySelector(".PuzzleMenu_answerInput").value.trim();
        this.checkFindAnswer(answer);
      });
      
      container.appendChild(answerSection);
    }
    
    highlightItem(element) {
      // Clear previous highlights
      const allItems = this.element.querySelectorAll(".PuzzleMenu_listItem");
      allItems.forEach(item => item.classList.remove("highlighted"));
      
      // Add highlight to this item
      element.classList.add("highlighted");
    }
    
    checkFindAnswer(answer) {
      // Find the missing person
      const missingPerson = this.puzzleData.eliasMemory.find(name => 
        !this.puzzleData.securityFootage.includes(name)
      );
      
      if (answer.toLowerCase() === missingPerson.toLowerCase()) {
        this.isComplete = true;
        
        // Create success message
        const successMessage = document.createElement("div");
        successMessage.classList.add("PuzzleMenu_success");
        successMessage.textContent = `Correct! ${missingPerson} is missing from the security footage. This must be significant...`;
        
        const content = this.element.querySelector(".PuzzleMenu_content");
        content.innerHTML = '';
        content.appendChild(successMessage);
        
        // Add code explanation
        const codeExplanation = document.createElement("div");
        codeExplanation.classList.add("PuzzleMenu_codeExplanation");
        codeExplanation.innerHTML = `
          <h3>Array Finding Methods</h3>
          <pre>
  // The .find() method returns the first element that satisfies the condition
  const missingPerson = eliasMemory.find(name => !securityFootage.includes(name));
  
  // We can also use .filter() to get all missing people
  const missingPeople = eliasMemory.filter(name => !securityFootage.includes(name));
  
  // The .indexOf() method returns the position of an element or -1 if not found
  if (securityFootage.indexOf(suspectName) === -1) {
    console.log(suspectName + " is not in the security footage!");
  }
          </pre>
        `;
        content.appendChild(codeExplanation);
        
        // Change close button to continue
        const closeButton = this.element.querySelector(".PuzzleMenu_close");
        closeButton.textContent = "Continue";
      } else {
        alert("That's not correct. Look carefully at both lists.");
      }
    }
  
    createFilterPuzzle(container) {
      // Create description about filtering arrays
      const infoBox = document.createElement("div");
      infoBox.classList.add("PuzzleMenu_infoBox");
      infoBox.innerHTML = `
        <p>Arrays can be filtered to remove unwanted elements.</p>
        <p>Help Elias identify which memories are false by clicking on them.</p>
      `;
      container.appendChild(infoBox);
      
      // Create the memories container
      const memoriesContainer = document.createElement("div");
      memoriesContainer.classList.add("PuzzleMenu_memoriesContainer");
      
      // Add all memories (true and false)
      const allMemories = [...this.puzzleData.trueMemories, ...this.puzzleData.falseMemories];
      
      // Shuffle memories
      for (let i = allMemories.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allMemories[i], allMemories[j]] = [allMemories[j], allMemories[i]];
      }
      
      allMemories.forEach(memory => {
        const memoryElement = document.createElement("div");
        memoryElement.classList.add("PuzzleMenu_memoryItem");
        memoryElement.textContent = memory;
        
        memoryElement.addEventListener("click", () => {
          // Toggle selection
          memoryElement.classList.toggle("selected");
        });
        
        memoriesContainer.appendChild(memoryElement);
      });
      
      container.appendChild(memoriesContainer);
      
      // Add instructions
      const instructions = document.createElement("div");
      instructions.classList.add("PuzzleMenu_instructions");
      instructions.textContent = "Click on the FALSE memories and then press 'Filter Memories'";
      container.appendChild(instructions);
      
      // Add a filter button
      const filterButton = document.createElement("button");
      filterButton.classList.add("PuzzleMenu_filterButton");
      filterButton.textContent = "Filter Memories";
      filterButton.addEventListener("click", () => {
        this.checkFilterCompletion();
      });
      
      container.appendChild(filterButton);
    }
    
    checkFilterCompletion() {
      const selectedElements = this.element.querySelectorAll(".PuzzleMenu_memoryItem.selected");
      const selectedMemories = Array.from(selectedElements).map(el => el.textContent);
      
      // Check if all false memories are selected
      const allFalseSelected = this.puzzleData.falseMemories.every(memory => 
        selectedMemories.includes(memory)
      );
      
      // Check if no true memories are selected
      const noTrueSelected = this.puzzleData.trueMemories.every(memory => 
        !selectedMemories.includes(memory)
      );
      
      if (allFalseSelected && noTrueSelected) {
        this.isComplete = true;
        
        // Create success message
        const successMessage = document.createElement("div");
        successMessage.classList.add("PuzzleMenu_success");
        successMessage.textContent = "Correct! You've successfully filtered out the false memories.";
        
        const content = this.element.querySelector(".PuzzleMenu_content");
        content.innerHTML = '';
        content.appendChild(successMessage);
        
        // Add code explanation
        const codeExplanation = document.createElement("div");
        codeExplanation.classList.add("PuzzleMenu_codeExplanation");
        codeExplanation.innerHTML = `
          <h3>Array Filtering</h3>
          <pre>
  // The .filter() method creates a new array with elements that pass the test
  const trueMemories = allMemories.filter(memory => !falseMemories.includes(memory));
  
  // We can use complex conditions in our filter
  const relevantMemories = allMemories.filter(memory => {
    return memory.includes("café") && !memory.includes("false");
  });
  
  // Filtering can be combined with other array methods
  const importantNames = people
    .filter(person => person.isImportant)
    .map(person => person.name);
          </pre>
        `;
        content.appendChild(codeExplanation);
        
        // Change close button to continue
        const closeButton = this.element.querySelector(".PuzzleMenu_close");
        closeButton.textContent = "Continue";
      } else {
        // Give hint about what's wrong
        if (!allFalseSelected) {
          alert("You missed some false memories. Look again!");
        } else {
          alert("You've selected some true memories as false. Double-check your selection.");
        }
      }
    }
  
    done() {
      this.element.remove();
      this.onComplete();
    }
    
    close() {
      this.element.remove();
    }
  
    init(container) {
      this.createElement();
      container.appendChild(this.element);
    }
  }