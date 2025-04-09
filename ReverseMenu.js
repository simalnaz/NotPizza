// ReverseMenu.js
class ReverseMenu {
    constructor({ nodes, onComplete }) {
      this.originalNodes = nodes;
      this.linkedList = this.buildList(nodes);
      this.onComplete = onComplete;
      this.element = null;
      this.moveCount = 0;
      this.isAnimating = false;
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
      // Head = node not referenced as .next by any other
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
          <p>This ghost's tale is reversed. Fix it to free them.</p>
          <div class="ReverseMenu_chain"></div>
          <div class="ReverseMenu_controls">
            <div class="ReverseMenu_counter">Reversals: <span>0</span></div>
            <button class="ReverseMenu_button">
              <span class="button-text">Reverse</span>
              <span class="button-icon">↑↓</span>
            </button>
          </div>
          <div class="ReverseMenu_hint">
            <button class="ReverseMenu_hint_button">Need a hint?</button>
            <div class="ReverseMenu_hint_text hidden">Try to get the nodes in chronological order, from beginning to end.</div>
          </div>
        </div>
      `;
  
      this.renderChain();
  
      // Event listeners
      this.element.querySelector(".ReverseMenu_button").addEventListener("click", () => {
        if (this.isAnimating) return;
        this.playSound('whoosh');
        this.moveCount++;
        this.updateMoveCounter();
        this.animateReversal();
      });
  
      this.element.querySelector(".ReverseMenu_hint_button").addEventListener("click", (e) => {
        const hintText = this.element.querySelector(".ReverseMenu_hint_text");
        hintText.classList.toggle("hidden");
        e.target.textContent = hintText.classList.contains("hidden") ? "Need a hint?" : "Hide hint";
      });
  
      // Set random ghost position initially
      const ghost = this.element.querySelector(".ReverseMenu_ghost");
      ghost.style.backgroundImage = this.ghostImages[0];
      this.animateGhost(ghost);
    }
  
    animateGhost(ghost) {
      // Randomly move the ghost around
      setInterval(() => {
        const randomX = Math.floor(Math.random() * 20) - 10;
        const randomY = Math.floor(Math.random() * 20) - 10;
        ghost.style.transform = `translate(${randomX}px, ${randomY}px)`;
        
        // Occasionally change ghost image
        if (Math.random() > 0.8) {
          const imageIndex = Math.floor(Math.random() * this.ghostImages.length);
          ghost.style.backgroundImage = this.ghostImages[imageIndex];
        }
      }, 2000);
    }
  
    playSound(type) {
      // Create a simple audio using Web Audio API
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'whoosh') {
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
        } else if (type === 'success') {
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
          oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
        }
      } catch (e) {
        // Silently fail if audio context isn't available
        console.log("Audio not available:", e);
      }
    }
  
    updateMoveCounter() {
      const counter = this.element.querySelector(".ReverseMenu_counter span");
      counter.textContent = this.moveCount;
    }
  
    renderChain() {
      const container = this.element.querySelector(".ReverseMenu_chain");
      container.innerHTML = "";
  
      this.linkedList.forEach((node, index) => {
        const div = document.createElement("div");
        div.classList.add("ReverseMenu_node");
        div.dataset.id = node.id;
        div.innerHTML = `
          <div class="ReverseMenu_node_text">${node.text}</div>
          ${index < this.linkedList.length - 1 ? "<div class='arrow'>↓</div>" : ""}
        `;
        container.appendChild(div);
      });
    }
  
    animateReversal() {
      this.isAnimating = true;
      
      // Store the current nodes for animation
      const nodeElements = Array.from(this.element.querySelectorAll(".ReverseMenu_node"));
      const container = this.element.querySelector(".ReverseMenu_chain");
      
      // Add transition class to container
      container.classList.add("reversing");
      
      // Apply exit animations
      nodeElements.forEach((node, i) => {
        node.style.transitionDelay = `${i * 50}ms`;
        node.classList.add("exit");
      });
      
      // After nodes have exited, reverse the list and render again
      setTimeout(() => {
        this.reverseList();
        this.renderChain();
        
        // Apply entrance animations to new nodes
        const newNodeElements = Array.from(this.element.querySelectorAll(".ReverseMenu_node"));
        newNodeElements.forEach((node, i) => {
          node.style.transitionDelay = `${i * 50}ms`;
          node.classList.add("enter");
        });
        
        // Remove animation classes after animation completes
        setTimeout(() => {
          newNodeElements.forEach(node => {
            node.classList.remove("enter");
          });
          container.classList.remove("reversing");
          this.isAnimating = false;
          this.checkSolution();
        }, 500); // Match this with the CSS animation duration
      }, 400); // Time to wait for exit animation
    }
  
    reverseList() {
      let prev = null;
      for (let i = 0; i < this.linkedList.length; i++) {
        this.linkedList[i].next = prev ? prev.id : null;
        prev = this.linkedList[i];
      }
      this.linkedList.reverse();
    }
  
    checkSolution() {
      const correctOrder = ["node4", "node3", "node2", "node1"];
      const currentIds = this.linkedList.map(n => n.id);
      const isCorrect = JSON.stringify(currentIds) === JSON.stringify(correctOrder);
  
      if (isCorrect) {
        this.playSound('success');
        this.showSuccess();
      }
    }
  
    showSuccess() {
      const container = this.element.querySelector(".ReverseMenu_content");
      
      // Add success class for animation
      this.element.classList.add("success");

      this.element.style.width = "190px";
      this.element.style.height = "140px";
      
      setTimeout(() => {
        container.innerHTML = `
          <div class="ReverseMenu_ghost fading"></div>
          <h2>The story is clear now.</h2>
          <p>As the memories align, the ghost's form begins to fade…</p>
          <div class="ReverseMenu_results">
            <p>You freed the ghost in ${this.moveCount} reversals!</p>
            ${this.moveCount <= 3 ? '<div class="ReverseMenu_star">⭐ Perfect solution!</div>' : ''}
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
  
    close() {
      // Add exit animation
      this.element.classList.add("closing");
      setTimeout(() => {
        this.element.remove();
      }, 500);
    }
  
    init(container) {
      this.createElement();
      container.appendChild(this.element);
      
      // Add entrance animation
      setTimeout(() => {
        this.element.classList.add("visible");
      }, 10);
    }
  }