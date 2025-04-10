// ReverseMenu.js (Interactive Linked List Reordering with .next label)
class ReverseMenu {
  constructor({ nodes, onComplete }) {
    this.nodes = nodes;
    this.linkedList = this.buildList(nodes);
    this.onComplete = onComplete;
    this.element = null;
    this.ghostImages = [
      'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 64 64\' fill=\'%23f5f5f5\'%3E%3Cpath d=\'M32 8C19.85 8 10 17.85 10 30v20c0 1.1.9 2 2 2 .55 0 1.05-.22 1.41-.59L20 44h6l4 4h4l4-4h6l6.59 7.41c.36.37.86.59 1.41.59 1.1 0 2-.9 2-2V30c0-12.15-9.85-22-22-22zm-8 28c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm16 0c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z\'/%3E%3C/svg%3E")',
      'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 64 64\' fill=\'%23e0e0ff\'%3E%3Cpath d=\'M32 8C19.85 8 10 17.85 10 30v20c0 1.1.9 2 2 2 .55 0 1.05-.22 1.41-.59L20 44h6l4 4h4l4-4h6l6.59 7.41c.36.37.86.59 1.41.59 1.1 0 2-.9 2-2V30c0-12.15-9.85-22-22-22zm-8 28c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm16 0c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z\'/%3E%3C/svg%3E")'
    ];
  }

  buildList(nodes) {
    const list = [];
    let currentId = this.findHead(nodes);
    while (currentId) {
      const node = nodes[currentId];
      list.push(node);
      currentId = node.next;
    }
    return list;
  }

  findHead(nodes) {
    const referenced = new Set(Object.values(nodes).map(n => n.next).filter(n => n));
    return Object.keys(nodes).find(id => !referenced.has(id));
  }

  createElement() {
    this.element = document.createElement("div");
    this.element.classList.add("ReverseMenu");
    this.element.innerHTML = `
      <div class="ReverseMenu_content">
        <div class="ReverseMenu_ghost"></div>
        <h2>The Reverse Haunting</h2>
        <p>Drag the fragments to reorder the ghost's tale.</p>
        <div class="ReverseMenu_chain"></div>
        <div class="ReverseMenu_controls">
          <div class="ReverseMenu_counter">Attempts: <span>0</span></div>
          <button class="ReverseMenu_button">
            <span class="button-text">Check Order</span>
            <span class="button-icon">✓</span>
          </button>
        </div>
      </div>
    `;

    this.renderChain();

    // Add event listener for the Check Order button
    this.element.querySelector(".ReverseMenu_button").addEventListener("click", () => {
      this.checkSolution();
    });

    const ghost = this.element.querySelector(".ReverseMenu_ghost");
    ghost.style.backgroundImage = this.ghostImages[0];
    this.animateGhost(ghost);
  }

  renderChain() {
    const container = this.element.querySelector(".ReverseMenu_chain");
    container.innerHTML = "";

    this.linkedList.forEach((node, index) => {
      const div = document.createElement("div");
      div.classList.add("ReverseMenu_node");
      div.setAttribute("draggable", true);
      div.dataset.id = node.id;
      div.innerHTML = `
        <div class="ReverseMenu_node_text">${node.text}</div>
      `;

      div.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", node.id);
      });

      div.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      div.addEventListener("drop", (e) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData("text/plain");
        this.reorderNodes(draggedId, node.id);
      });

      container.appendChild(div);

      if (index < this.linkedList.length - 1) {
        const arrow = document.createElement("div");
        arrow.classList.add("arrow");
        arrow.innerHTML = `→ <span style="font-size: 9px; opacity: 0.7;">.next</span>`;
        container.appendChild(arrow);
      }
    });
  }

  reorderNodes(draggedId, targetId) {
    const draggedIndex = this.linkedList.findIndex(n => n.id === draggedId);
    const targetIndex = this.linkedList.findIndex(n => n.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;

    const dragged = this.linkedList.splice(draggedIndex, 1)[0];
    this.linkedList.splice(targetIndex, 0, dragged);
    this.updatePointers();
    this.renderChain();
  }

  updatePointers() {
    for (let i = 0; i < this.linkedList.length; i++) {
      this.linkedList[i].next = i < this.linkedList.length - 1 ? this.linkedList[i + 1].id : null;
    }
  }

  checkSolution() {
    const correctOrder = ["node1", "node2", "node3", "node4"];
    const currentIds = this.linkedList.map(n => n.id);
    
    // Update attempts counter
    const counter = this.element.querySelector(".ReverseMenu_counter span");
    counter.textContent = parseInt(counter.textContent) + 1;
    
    if (JSON.stringify(correctOrder) === JSON.stringify(currentIds)) {
      this.playSound('success');
      this.showSuccess();
    } else {
      alert("That's not quite right. Try again!");
    }
  }

  showSuccess() {
    const container = this.element.querySelector(".ReverseMenu_content");
    this.element.classList.add("success");

    setTimeout(() => {
      container.innerHTML = `
        <div class="ReverseMenu_ghost fading"></div>
        <h2>The story is clear now.</h2>
        <p>As the memories align, the ghost's form begins to fade…</p>
        <div class="ReverseMenu_results">
          <p>You restored the ghost's tale! <span class="ReverseMenu_star">★</span></p>
        </div>
        <button class="ReverseMenu_close">Close</button>
      `;

      const ghost = this.element.querySelector(".ReverseMenu_ghost");
      ghost.style.backgroundImage = this.ghostImages[1];

      container.querySelector(".ReverseMenu_close").addEventListener("click", () => {
        this.close();
        this.onComplete();
      });
    }, 500);
  }

  animateGhost(ghost) {
    setInterval(() => {
      const randomX = Math.floor(Math.random() * 20) - 10;
      const randomY = Math.floor(Math.random() * 20) - 10;
      ghost.style.transform = `translate(${randomX}px, ${randomY}px)`;

      if (Math.random() > 0.8) {
        const imageIndex = Math.floor(Math.random() * this.ghostImages.length);
        ghost.style.backgroundImage = this.ghostImages[imageIndex];
      }
    }, 2000);
  }

  playSound(type) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      if (type === 'success') {
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);
      }

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log("Audio not available:", e);
    }
  }

  close() {
    this.element.remove();
  }

  init(container) {
    this.createElement();
    container.appendChild(this.element);
    setTimeout(() => {
      this.element.classList.add("visible");
    }, 10);
  }
}