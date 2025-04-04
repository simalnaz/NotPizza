class PuzzleMenu {
  constructor({ sentences, solution, onComplete }) {
    this.sentences = sentences;
    this.originalOrder = [...Array(sentences.length).keys()]; 
    this.currentOrder = [...this.originalOrder]; // Start with random order (same as original shuffled)
    this.solution = solution;
    this.onComplete = onComplete;
    this.element = null;
    this.draggedItem = null;
    this.draggedIndex = null;
  }

  createElement() {
    this.element = document.createElement("div");
    this.element.classList.add("PuzzleMenu");
    
    this.element.innerHTML = (`
      <div class="PuzzleMenu_content">
        <h2>Elias's Letter</h2>
        <p>Arrange the fragments of Elias's letter in the correct order.</p>
        <div class="PuzzleMenu_sentences"></div>
        <button class="PuzzleMenu_button">Check Order</button>
      </div>
    `);
    
    // Create and add sentence elements
    const sentencesContainer = this.element.querySelector(".PuzzleMenu_sentences");
    this.currentOrder.forEach((originalIndex, displayIndex) => {
      const sentenceElement = document.createElement("div");
      sentenceElement.classList.add("PuzzleMenu_sentence");
      sentenceElement.setAttribute("data-index", originalIndex);
      sentenceElement.textContent = this.sentences[originalIndex];
      sentenceElement.draggable = true;
      
      // Add drag event listeners
      sentenceElement.addEventListener("dragstart", (e) => this.handleDragStart(e, originalIndex));
      sentenceElement.addEventListener("dragover", (e) => this.handleDragOver(e));
      sentenceElement.addEventListener("drop", (e) => this.handleDrop(e, displayIndex));
      sentenceElement.addEventListener("dragend", () => this.handleDragEnd());
      
      sentencesContainer.appendChild(sentenceElement);
    });
    
    // Add check button event
    this.element.querySelector(".PuzzleMenu_button").addEventListener("click", () => {
      this.checkSolution();
    });
  }
  
  handleDragStart(e, index) {
    this.draggedItem = e.target;
    this.draggedIndex = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index);
    e.target.classList.add("dragging");
  }
  
  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }
  
  handleDrop(e, targetIndex) {
    e.preventDefault();
    
    // Update current order
    const tempOrder = [...this.currentOrder];
    const sourceIndex = this.currentOrder.indexOf(this.draggedIndex);
    const currentElement = tempOrder[sourceIndex];
    
    // Remove from source position
    tempOrder.splice(sourceIndex, 1);
    
    // Insert at target position
    const dropIndex = this.currentOrder.indexOf(parseInt(e.target.getAttribute("data-index")));
    tempOrder.splice(dropIndex, 0, currentElement);
    
    this.currentOrder = tempOrder;
    
    // Redraw the sentences
    this.redrawSentences();
  }
  
  handleDragEnd() {
    if (this.draggedItem) {
      this.draggedItem.classList.remove("dragging");
      this.draggedItem = null;
      this.draggedIndex = null;
    }
  }
  
  redrawSentences() {
    const sentencesContainer = this.element.querySelector(".PuzzleMenu_sentences");
    sentencesContainer.innerHTML = "";
    
    this.currentOrder.forEach((originalIndex, displayIndex) => {
      const sentenceElement = document.createElement("div");
      sentenceElement.classList.add("PuzzleMenu_sentence");
      sentenceElement.setAttribute("data-index", originalIndex);
      sentenceElement.textContent = this.sentences[originalIndex];
      sentenceElement.draggable = true;
      
      // Add drag event listeners
      sentenceElement.addEventListener("dragstart", (e) => this.handleDragStart(e, originalIndex));
      sentenceElement.addEventListener("dragover", (e) => this.handleDragOver(e));
      sentenceElement.addEventListener("drop", (e) => this.handleDrop(e, displayIndex));
      sentenceElement.addEventListener("dragend", () => this.handleDragEnd());
      
      sentencesContainer.appendChild(sentenceElement);
    });
  }
  
  checkSolution() {
    const isCorrect = ArrayPuzzles.checkSolution(this.currentOrder, this.solution);
    
    if (isCorrect) {
      this.showSuccess();
    } else {
      this.showFailure();
    }
  }
  
  showSuccess() {
    // Update UI to show success
    const content = this.element.querySelector(".PuzzleMenu_content");
    content.innerHTML = (`
      <h2>Letter Restored!</h2>
      <div class="PuzzleMenu_complete_letter">
        <p>${this.sentences[this.solution[0]]}</p>
        <p>${this.sentences[this.solution[1]]}</p>
        <p>${this.sentences[this.solution[2]]}</p>
        <p>${this.sentences[this.solution[3]]}</p>
        <p>${this.sentences[this.solution[4]]}</p>
      </div>
      <div class="PuzzleMenu_lesson">
        <h3>Array Sorting Concept</h3>
        <p>Sorting an array restores clarity, like organizing data in code. Just like you arranged these sentences to reveal meaning, sorting algorithms arrange data to make it useful.</p>
      </div>
      <button class="PuzzleMenu_close_button">Close</button>
    `);
    
    content.querySelector(".PuzzleMenu_close_button").addEventListener("click", () => {
      this.close();
      this.onComplete();
    });
  }
  
  showFailure() {
    const button = this.element.querySelector(".PuzzleMenu_button");
    button.textContent = "Try Again";
    button.classList.add("shake");
    
    setTimeout(() => {
      button.classList.remove("shake");
    }, 500);
  }
  
  close() {
    this.element.remove();
  }
  
  init(container) {
    this.createElement();
    container.appendChild(this.element);
  }
}