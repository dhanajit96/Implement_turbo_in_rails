import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input"];

  timeout = null


  connect() {

    this.apiUrl = "https://inputtools.google.com/request"

    const input = this.inputTarget

    this.suggestionsTarget = this.buildSuggestionsBox()

    input.addEventListener("keydown", (e) => {
      if (e.key === " ") {
        this.skipNextSuggestionFetch = true;
      }
    });

    input.addEventListener("input", (e) => {
      if (this.skipNextSuggestionFetch) {
        this.skipNextSuggestionFetch = false;
        return;
      }
      this.fetchSuggestions(e);
    });

    input.addEventListener("keyup", (e) => {

      if (e.key === " ") {
        this.selectFirstSuggestion();
      }
    });

    document.addEventListener("click", this.handleClickOutside);
  }

  fetchSuggestions(event) {
    const value = event.target.value.trim()
    if (!value) return

    clearTimeout(this.timeout)
    this.timeout = setTimeout(() => {

      const { word: currentWord } = this.getCurrentWordAtCursor(this.inputTarget);

      console.log("currentWord: ", currentWord)

      if (!currentWord || !/^[a-zA-Z]+$/.test(currentWord)) return;
      // if (!currentWord) return;


      fetch(`${this.apiUrl}?text=${currentWord}&itc=mr-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`)
        .then(res => res.json())
        .then(data => {
          if (data[0] === "SUCCESS") {
            const suggestions = data[1][0][1]
            this.showSuggestions(suggestions, currentWord)
          }
        })
    }, 300)
  }

  buildSuggestionsBox() {

    const box = document.createElement("div")
    box.className = "marathi-suggestions";
    box.style.position = "absolute";
    box.style.background = "#fff";
    box.style.border = "0px solid #ccc";
    box.style.zIndex = "9999";
    box.style.padding = "0px";
    box.style.color = "black";

    const rect = this.inputTarget.getBoundingClientRect();
    const scrollOffset = window.scrollY || window.pageYOffset;

    box.style.top = `${rect.bottom + scrollOffset}px`;
    box.style.left = `${rect.left}px`; // 

    this.element.parentElement.appendChild(box)

    return box
  }

  showSuggestions(suggestions, lastWord) {
    this.showSuggestionsBox();

    suggestions.forEach(suggestion => {
      const option = document.createElement("div")
      option.textContent = suggestion
      option.className = "marathi-suggestion"
      option.style.cursor = "pointer"
      option.onclick = () => this.selectSuggestion(suggestion, lastWord)
      this.suggestionsTarget.appendChild(option)
    })

    const originalOption = document.createElement("div");
    originalOption.textContent = lastWord;
    originalOption.className = "marathi-suggestion";
    originalOption.style.cursor = "pointer";
    originalOption.onclick = () => this.selectSuggestion(lastWord, lastWord);
    this.suggestionsTarget.appendChild(originalOption);
  }



  selectFirstSuggestion() {
    if (!this.suggestionsTarget || this.suggestionsTarget.children.length === 0) return;

    const firstOption = this.suggestionsTarget.querySelector(".marathi-suggestion");

    if (firstOption) {
      const suggestion = firstOption.textContent;
      const input = this.inputTarget;
      let { word: currentWord } = this.getCurrentWordAtCursor(input);

      // If space was pressed, caret is after the space => no current word
      if (!currentWord) {
        const valueBeforeCursor = input.value.slice(0, input.selectionStart).trimEnd();
        const words = valueBeforeCursor.split(/\s+/);
        currentWord = words[words.length - 1] || "";
      }


      if (!currentWord) return;

      console.log("currentWord:", currentWord, " suggestion:", suggestion);


      this.selectSuggestion(suggestion, currentWord);
    }
  }

  selectSuggestion(selected, originalWord) {
    const input = this.inputTarget;
    const { wordStart, wordEnd } = this.getCurrentWordAtCursor(input);

    if (wordStart == null || wordEnd == null) return;

    const value = input.value;

    // Reconstruct the value with the selected word
    const newValue = value.slice(0, wordStart) + selected + value.slice(wordEnd);

    // Update the input value and set caret after inserted suggestion
    input.value = newValue;

    // Move caret to after the inserted suggestion
    const caretPos = wordStart + selected.length;
    input.setSelectionRange(caretPos, caretPos);

    this.hideSuggestions();

  }

  handleClickOutside = (event) => {
    const isClickInsideInput = this.inputTarget.contains(event.target);
    const isClickInsideSuggestions = this.suggestionsTarget?.contains(event.target);

    if (!isClickInsideInput && !isClickInsideSuggestions) {
      this.hideSuggestions();
    }
  };


  getCurrentWordAtCursor(input) {
    const value = input.value;
    let cursorPos = input.selectionStart;

    // If cursor is just after a space, move it back to find previous word
    if (cursorPos > 0 && value[cursorPos - 1] === " ") {
      cursorPos--;
    }

    // Skip any Devanagari characters while going backwards
    let wordStart = cursorPos;
    while (
      wordStart > 0 &&
      value[wordStart - 1].match(/[a-zA-Z0-9]/) // Only count English letters and numbers
    ) {
      wordStart--;
    }

    // Skip Devanagari going forward too
    let wordEnd = cursorPos;
    while (
      wordEnd < value.length &&
      value[wordEnd].match(/[a-zA-Z0-9]/)
    ) {
      wordEnd++;
    }


    let word = value.slice(wordStart, wordEnd);

    // console.log("value :", value, " cursorPos :", cursorPos, " wordStart :", wordStart, " wordEnd :", wordEnd, " word: ", word)

    return { word, wordStart, wordEnd };
  }



  hideSuggestions() {
    this.suggestionsTarget.innerHTML = "";
    this.suggestionsTarget.style.border = "0";
    this.suggestionsTarget.style.padding = "0";
  }

  showSuggestionsBox() {
    this.suggestionsTarget.innerHTML = "";
    this.suggestionsTarget.style.border = "1px solid #ccc";
    this.suggestionsTarget.style.padding = "4px";
  }

}
