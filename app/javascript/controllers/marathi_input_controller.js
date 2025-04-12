import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "suggestions"]
  timeout = null

  connect() {
    this.apiUrl = "https://inputtools.google.com/request"
  }

  fetchSuggestions(event) {
    const value = event.target.value.trim()
    if (!value) return

    // Debounce to avoid too many calls
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

  showSuggestions(suggestions, lastWord) {
    this.suggestionsTarget.innerHTML = ""

    suggestions.forEach(suggestion => {
      const option = document.createElement("div")
      option.textContent = suggestion
      option.classList.add("suggestion")
      option.onclick = () => this.selectSuggestion(suggestion, lastWord)
      this.suggestionsTarget.appendChild(option)
    })
  }

  selectSuggestion(selected, lastWord) {
    const currentValue = this.inputTarget.value
    const newValue = currentValue.replace(new RegExp(`${lastWord}$`), selected)
    this.inputTarget.value = newValue
    this.suggestionsTarget.innerHTML = ""
  }
}
