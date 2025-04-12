import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input"]
  timeout = null


  connect() {

    console.log("testing : ", this.element)

    this.apiUrl = "https://inputtools.google.com/request"

    const input = this.inputTarget

    this.suggestionsTarget = this.buildSuggestionsBox()

    // this.positionSuggestionsBox(event.target); // event.target is the <input>
    // this.inputTarget.addEventListener("input", this.fetchSuggestions.bind(this))

    // this.inputTarget.addEventListener("keyup", (e) => {
    //   if (e.key === " ") {
    //     this.selectFirstSuggestion();
    //   }
    // });

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
      console.log("value of e.key -:", e.key, "=")

      if (e.key === " ") {
        this.selectFirstSuggestion();
      }
    });

  }

  fetchSuggestions(event) {
    const value = event.target.value.trim()
    if (!value) return

    clearTimeout(this.timeout)
    this.timeout = setTimeout(() => {
      const lastWord = value.split(" ").pop()

      fetch(`${this.apiUrl}?text=${lastWord}&itc=mr-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`)
        .then(res => res.json())
        .then(data => {
          if (data[0] === "SUCCESS") {
            const suggestions = data[1][0][1]
            this.showSuggestions(suggestions, lastWord)
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

    // Get the position of the input field
    const rect = this.inputTarget.getBoundingClientRect();
    const scrollOffset = window.scrollY || window.pageYOffset;

    box.style.top = `${rect.bottom + scrollOffset}px`;
    box.style.left = `${rect.left}px`; // 

    this.element.parentElement.appendChild(box)


    return box
  }

  showSuggestions(suggestions, lastWord) {
    this.suggestionsTarget.innerHTML = ""
    this.suggestionsTarget.style.border = "1px solid #ccc";
    this.suggestionsTarget.style.border = "4px";


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

    console.log("clicked here : ", this.suggestionsTarget)

    if (firstOption) {
      const suggestion = firstOption.textContent;
      const value = this.inputTarget.value.trim();
      const lastWord = value.split(" ").pop();
      this.selectSuggestion(suggestion, lastWord);
    }
  }

  selectSuggestion(selected, lastWord) {
    const currentValue = this.inputTarget.value
    const newValue = currentValue.replace(new RegExp(`${lastWord}$`), selected)
    this.inputTarget.value = newValue
    this.suggestionsTarget.innerHTML = ""
    this.suggestionsTarget.style.border = "0";
    this.suggestionsTarget.style.padding = "0";

  }
}
