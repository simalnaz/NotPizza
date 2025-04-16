class RevealingText {
  constructor(config) {
    this.element = config.element;
    this.text = config.text;
    this.speed = config.speed || 60;

    this.timeout = null;
    this.isDone = false;
  }

  revealOneCharacter(list) {
    const next = list.splice(0,1)[0];
    next.span.classList.add("revealed");

    if (list.length > 0) {
      this.timeout = setTimeout(() => {
        this.revealOneCharacter(list)
      }, next.delayAfter)
    } else {
      this.isDone = true;
    }
  }

  warpToDone() {
    clearTimeout(this.timeout);
    this.isDone = true;
    this.element.querySelectorAll("span").forEach(s => {
      s.classList.add("revealed");
    })
  }

  init() {
    let characters = [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<span>${this.text}</span>`, "text/html");
    const root = doc.body.firstChild;

    const traverse = (node, parentClasses = []) => {
      node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          child.textContent.split("").forEach(char => {
            const span = document.createElement("span");
            span.textContent = char;
            span.classList.add(...parentClasses);
            this.element.appendChild(span);
            characters.push({
              span,
              delayAfter: char === " " ? 0 : this.speed
            });
          });
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          let classMap = {
            "i": "inner",
            "g": "ghost",
            "b": "bold"
          };
          const className = classMap[child.tagName.toLowerCase()];
          traverse(child, className ? [...parentClasses, className] : parentClasses);
        }
      });
    };

    traverse(root);
    this.revealOneCharacter(characters);
  }
}