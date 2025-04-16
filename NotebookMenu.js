class NotebookMenu {
  constructor() {
    this.element = null;
    this.activeTab = "progress";
    this.subSections = {
      chapter1: false,
      chapter2: false,
      chapter3: false
    };
  }

  createElement() {
    this.element = document.createElement("div");
    this.element.classList.add("NotebookMenu");

    this.element.innerHTML = `
      <div class="NotebookMenu_header">
        <h2>Detective's Notebook</h2>
      </div>
      <div class="NotebookMenu_tabs">
        <button data-tab="progress" class="active">Progress</button>
        <button data-tab="ghosts">Ghosts</button>
        <button data-tab="chapters">Chapters</button>
      </div>
      <div id="notebook-content" class="NotebookMenu_section"></div>
    `;

    this.tabs = this.element.querySelectorAll("[data-tab]");
    this.content = this.element.querySelector("#notebook-content");

    this.tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        // Remove active class from all tabs
        this.tabs.forEach(t => t.classList.remove("active"));
        // Add active class to clicked tab
        tab.classList.add("active");
        // Render the tab content
        this.renderTab(tab.dataset.tab);
      });
    });

    // Add close button
    const closeButton = document.createElement("button");
    closeButton.classList.add("NotebookMenu_close");
    closeButton.innerHTML = "X"; // Kept the 'X' as it's standard UI
    closeButton.addEventListener("click", () => this.toggle());
    this.element.appendChild(closeButton);

    this.renderTab("progress");
  }

  renderTab(tab) {
    this.activeTab = tab;
    
    if (tab === "progress") {
      this.renderProgressTab();
    } else if (tab === "ghosts") {
      this.renderGhostsTab();
    } else if (tab === "chapters") {
      this.renderChaptersTab();
    }
  }

  renderProgressTab() {
    // Calculate overall completion percentage
    const totalChapters = 3;
    const completedChapters = [
      utils.gameProgress.chapter1Completed,
      utils.gameProgress.chapter2Completed,
      utils.gameProgress.chapter3Completed
    ].filter(Boolean).length;
    
    const completionPercentage = Math.floor((completedChapters / totalChapters) * 100);

    // Get ghost collection stats
    const activeGhosts = window.guestBook.getAllActiveEntries();
    const allGhosts = Object.keys(window.guestBook.entries);
    const identifiedGhosts = allGhosts.filter(name => !activeGhosts[name]);
    const totalGhosts = allGhosts.length;
    const ghostsPercentage = Math.floor((identifiedGhosts.length / totalGhosts) * 100);
    
    this.content.innerHTML = `
      <div class="NotebookMenu_progress">
        <h3>Game Progress</h3>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${completionPercentage}%"></div>
          <div class="progress-text">${completionPercentage}% Complete</div>
        </div>
        
        <h3>Chapter Status</h3>
        <div class="chapter-status">
          <div class="chapter-item ${utils.gameProgress.chapter1Completed ? 'completed' : ''}">
            <span class="chapter-icon"></span> <!-- Removed symbol -->
            <span class="chapter-name">Chapter 1: Arrays</span>
          </div>
          <div class="chapter-item ${utils.gameProgress.chapter2Completed ? 'completed' : ''}">
            <span class="chapter-icon"></span> <!-- Removed symbol -->
            <span class="chapter-name">Chapter 2: Hash Maps</span>
          </div>
          <div class="chapter-item ${utils.gameProgress.chapter3Completed ? 'completed' : ''}">
            <span class="chapter-icon"></span> <!-- Removed symbol -->
            <span class="chapter-name">Chapter 3: Linked Lists</span>
          </div>
        </div>
        
        <h3>Ghost Collection</h3>
        <div class="progress-bar">
          <div class="progress-fill ghost-fill" style="width: ${ghostsPercentage}%"></div>
          <div class="progress-text">${identifiedGhosts.length}/${totalGhosts} Ghosts Identified</div>
        </div>
      </div>
    `;
  }

  renderGhostsTab() {
    const active = window.guestBook.getAllActiveEntries();
    const all = Object.keys(window.guestBook.entries);
    const identified = all.filter(name => !active[name]);
    const unidentified = all.filter(name => active[name]);

    this.content.innerHTML = `
      <div class="NotebookMenu_ghosts">
        <h3>Ghost Collection</h3>
        <p class="ghost-stats">You've identified ${identified.length} out of ${all.length} ghosts</p>
        
        <div class="ghost-collection">
          <div class="ghost-section">
            <h4>Identified Ghosts</h4>
            <div class="ghost-grid identified">
              ${identified.map(name => `
                <div class="ghost-card">
                  <div class="ghost-name">${name}</div>
                  <div class="ghost-detail">${this.getGhostDetail(name)}</div>
                </div>
              `).join("")}
              ${identified.length === 0 ? '<p class="empty-message">No ghosts identified yet</p>' : ''}
            </div>
          </div>
          
          <div class="ghost-section">
            <h4>Unidentified Ghosts</h4>
            <div class="ghost-grid unidentified">
              ${unidentified.map(name => `
                <div class="ghost-card">
                  <div class="ghost-name">???</div>
                  <div class="ghost-detail">${this.getGhostDetail(name)}</div>
                </div>
              `).join("")}
              ${unidentified.length === 0 ? '<p class="empty-message">All ghosts identified!</p>' : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderChaptersTab() {
    this.content.innerHTML = `
      <div class="NotebookMenu_chapters">
        <h3>Chapter Guide</h3>
        <p>Click on each chapter to view details and hints</p>
        
        <div class="chapter-accordion">
          <div class="chapter-header" data-chapter="chapter1">
            <span class="chapter-toggle">${this.subSections.chapter1 ? 'v' : '>'}</span> <!-- Changed symbols -->
            <span class="chapter-title">Chapter 1: Arrays</span>
            <span class="chapter-status">${utils.gameProgress.chapter1Completed ? "Completed" : "In Progress"}</span> <!-- Removed symbol -->
          </div>
          <div class="chapter-content ${this.subSections.chapter1 ? 'expanded' : ''}">
            <div class="chapter-description">
              <h4>Array Adventures</h4>
              <p>Collect keys and store them in an array. Use indexes to check how many keys you've found.</p>
              
              <div class="dsa-info">
                <h5>What is an Array?</h5>
                <p>An array is a data structure that stores elements of the same type in contiguous memory locations. 
                The elements can be accessed using an index.</p>
                
                <h5>Key Properties</h5>
                <ul>
                  <li><strong>Indexing:</strong> Each element has a numeric index starting from 0</li>
                  <li><strong>Fixed Size:</strong> In many languages, arrays have fixed size</li>
                  <li><strong>Fast Access:</strong> Direct access using index is O(1) time</li>
                </ul>
                
                <h5>Common Operations</h5>
                <ul>
                  <li><code>array[index]</code> - Access element at index (O(1))</li>
                  <li><code>array.push(item)</code> - Add item to end (O(1))</li>
                  <li><code>array.pop()</code> - Remove last item (O(1))</li>
                  <li><code>array.length</code> - Get array size (O(1))</li>
                </ul>
              </div>
              
              <div class="chapter-hints">
                <h5>Hints</h5>
                <ul>
                  <li>Look for keys in hidden corners of the mansion</li>
                  <li>Track your keys with <code>inventory.keysFound.length</code></li>
                  <li>Check index 0 for the first key you found</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="chapter-header" data-chapter="chapter2">
            <span class="chapter-toggle">${this.subSections.chapter2 ? 'v' : '>'}</span> <!-- Changed symbols -->
            <span class="chapter-title">Chapter 2: Hash Maps</span>
            <span class="chapter-status">${utils.gameProgress.chapter2Completed ? "Completed" : "In Progress"}</span> <!-- Removed symbol -->
          </div>
          <div class="chapter-content ${this.subSections.chapter2 ? 'expanded' : ''}">
            <div class="chapter-description">
              <h4>Ghost Identification</h4>
              <p>Use guest descriptions as keys to find names fast. That's how a hash map works!</p>
              
              <div class="dsa-info">
                <h5>What is a Hash Map?</h5>
                <p>A Hash Map (or Dictionary) is a data structure that stores key-value pairs. 
                It uses a hash function to compute an index into an array where the value is stored.</p>
                
                <h5>Key Properties</h5>
                <ul>
                  <li><strong>Key-Value Pairs:</strong> Each value is associated with a unique key</li>
                  <li><strong>Fast Lookup:</strong> Accessing a value using its key is O(1) on average</li>
                  <li><strong>No Order:</strong> Elements are not stored in any particular order</li>
                </ul>
                
                <h5>Common Operations</h5>
                <ul>
                  <li><code>map[key] = value</code> - Insert/update key-value pair (O(1))</li>
                  <li><code>map[key]</code> - Get value by key (O(1))</li>
                  <li><code>delete map[key]</code> - Remove key-value pair (O(1))</li>
                  <li><code>key in map</code> - Check if key exists (O(1))</li>
                </ul>
              </div>
              
              <div class="chapter-hints">
                <h5>Hints</h5>
                <ul>
                  <li>Each ghost has a unique "remembered detail"</li>
                  <li>Match the detail to the name in the guest book</li>
                  <li>Try using <code>guestBook.entries["detail"]</code> to find names quickly</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="chapter-header" data-chapter="chapter3">
            <span class="chapter-toggle">${this.subSections.chapter3 ? 'v' : '>'}</span> <!-- Changed symbols -->
            <span class="chapter-title">Chapter 3: Linked Lists</span>
            <span class="chapter-status">${utils.gameProgress.chapter3Completed ? "Completed" : "In Progress"}</span> <!-- Removed symbol -->
          </div>
          <div class="chapter-content ${this.subSections.chapter3 ? 'expanded' : ''}">
            <div class="chapter-description">
              <h4>Story Fragments</h4>
              <p>The story is in reverse. Reorder fragments to fix the story using .next pointers like a linked list!</p>
              
              <div class="dsa-info">
                <h5>What is a Linked List?</h5>
                <p>A Linked List is a data structure where elements (nodes) contain a value and a pointer to the next node.
                Unlike arrays, elements are not stored in contiguous memory.</p>
                
                <h5>Key Properties</h5>
                <ul>
                  <li><strong>Sequential Access:</strong> Must traverse from the head node</li>
                  <li><strong>Dynamic Size:</strong> Can grow or shrink at runtime</li>
                  <li><strong>Efficient Insertions:</strong> Adding/removing nodes is O(1) if position is known</li>
                </ul>
                
                <h5>Common Operations</h5>
                <ul>
                  <li><code>node.next</code> - Access the next node in the list</li>
                  <li><code>node.next = newNode</code> - Set a new next node</li>
                  <li><code>head = newNode</code> - Update the head of the list</li>
                  <li><code>while (node) { node = node.next }</code> - Traverse the list</li>
                </ul>
              </div>
              
              <div class="chapter-hints">
                <h5>Hints</h5>
                <ul>
                  <li>Each story fragment has a logical next part</li>
                  <li>Connect fragments by setting <code>currentFragment.next = nextFragment</code></li>
                  <li>Start with the earliest event and follow the chain</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners to chapter headers
    const chapterHeaders = this.content.querySelectorAll(".chapter-header");
    chapterHeaders.forEach(header => {
      header.addEventListener("click", () => {
        const chapter = header.dataset.chapter;
        this.subSections[chapter] = !this.subSections[chapter];
        this.renderChaptersTab();
      });
    });
  }

  // Helper method to get ghost details using the actual guest book data
  getGhostDetail(name) {
      // Access the global guest book instance
      const guestBook = window.guestBook;

      // Check if the guest book and its entries exist
      if (guestBook && guestBook.entries) {
        // Look up the entry by name
        const entry = guestBook.entries[name];

        // If the entry exists and has a description, return it
        if (entry && entry.description) {
          // Return the description (which is the remembered detail)
          return entry.description;
        }
      }
      // Fallback if the name or detail isn't found in the guest book
      // This might happen if the name passed is somehow invalid
      return "Detail unknown";
    }


  toggle() {
    this.element.classList.toggle("visible");
  }

  init(container) {
    this.createElement();
    container.appendChild(this.element);
  }
}
