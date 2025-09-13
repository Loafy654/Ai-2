class AIDoctorAssistant {
  constructor() {
    this.chatHistory = []
    this.isLoading = false
    this.currentStreamingMessage = null
    this.initializeElements()
    this.bindEvents()
    this.updateUI()
  }

  initializeElements() {
    this.apiKeyInput = document.getElementById("apiKey")
    this.messageInput = document.getElementById("messageInput")
    this.sendBtn = document.getElementById("sendBtn")
    this.chatMessages = document.getElementById("chatMessages")
    this.chatForm = document.getElementById("chatForm")
    this.clearBtn = document.getElementById("clearChat")
    this.togglePassword = document.getElementById("togglePassword")
    this.toggleSettings = document.getElementById("toggleSettings")
    this.settingsContent = document.getElementById("settingsContent")
  }

  bindEvents() {
    this.chatForm.addEventListener("submit", (e) => this.handleSubmit(e))
    this.apiKeyInput.addEventListener("input", () => this.updateUI())
    this.clearBtn.addEventListener("click", () => this.clearChat())
    this.togglePassword.addEventListener("click", () => this.togglePasswordVisibility())
    this.toggleSettings.addEventListener("click", () => this.toggleSettingsPanel())

    // Enter key to send message
    this.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        this.handleSubmit(e)
      }
    })
  }

  updateUI() {
    const hasApiKey = this.apiKeyInput.value.trim().length > 0
    const hasMessage = this.messageInput.value.trim().length > 0

    this.messageInput.disabled = !hasApiKey || this.isLoading
    this.sendBtn.disabled = !hasApiKey || !hasMessage || this.isLoading
    this.clearBtn.disabled = this.chatHistory.length === 0

    if (hasApiKey) {
      this.messageInput.placeholder = "Ask your AI doctor about symptoms or health concerns..."
    } else {
      this.messageInput.placeholder = "Please enter your API key to consult with your AI doctor"
    }
  }

  togglePasswordVisibility() {
    const isPassword = this.apiKeyInput.type === "password"
    this.apiKeyInput.type = isPassword ? "text" : "password"
    this.togglePassword.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>'
  }

  toggleSettingsPanel() {
    const isHidden = this.settingsContent.classList.contains("hidden")

    if (isHidden) {
      this.settingsContent.classList.remove("hidden")
      this.toggleSettings.classList.remove("collapsed")
    } else {
      this.settingsContent.classList.add("hidden")
      this.toggleSettings.classList.add("collapsed")
    }
  }

  async handleSubmit(e) {
    e.preventDefault()

    const message = this.messageInput.value.trim()
    const apiKey = this.apiKeyInput.value.trim()

    if (!message || !apiKey || this.isLoading) return

    // Add user message to chat
    this.addMessage("user", message)
    this.messageInput.value = ""
    this.updateUI()

    // Start streaming response
    this.startStreamingResponse(message, apiKey)
  }

  async startStreamingResponse(message, apiKey) {
    this.isLoading = true
    this.updateUI()

    // Create streaming message container
    this.currentStreamingMessage = this.createStreamingMessage()

    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          message: message,
          api_key: apiKey,
          chat_history: this.chatHistory,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data.trim() === "[DONE]") {
              this.finishStreamingMessage()
              return
            }

            try {
              const parsed = JSON.parse(data)

              if (parsed.error) {
                this.handleStreamingError(parsed.error)
                return
              }

              if (parsed.chunk) {
                this.updateStreamingMessage(parsed.chunk)
              }

              if (parsed.done) {
                this.finishStreamingMessage(parsed.content)
                return
              }
            } catch (e) {
              console.warn("Failed to parse streaming data:", data)
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error)
      this.handleStreamingError(
        `Connection error: ${error.message}. Please check your API key and try again. If this is a medical emergency, please contact emergency services immediately.`,
      )
    } finally {
      this.isLoading = false
      this.updateUI()
    }
  }

  createStreamingMessage() {
    const messageDiv = document.createElement("div")
    messageDiv.className = "message assistant streaming"

    const roleIcon = "fas fa-user-md"
    const roleLabel = "AI Doctor"

    messageDiv.innerHTML = `
      <div class="message-content">
        <div class="message-header">
          <i class="${roleIcon}"></i>
          <strong>${roleLabel}</strong>
          <span class="typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </span>
        </div>
        <div class="message-text streaming-text"></div>
        <div class="message-time">${this.formatTime(new Date())}</div>
      </div>
    `

    this.chatMessages.appendChild(messageDiv)
    this.scrollToBottom()

    // Hide welcome message if it exists
    const welcomeMessage = this.chatMessages.querySelector(".welcome-message")
    if (welcomeMessage) {
      welcomeMessage.style.display = "none"
    }

    return messageDiv
  }

  updateStreamingMessage(chunk) {
    if (!this.currentStreamingMessage) return

    const textElement = this.currentStreamingMessage.querySelector(".streaming-text")
    if (textElement) {
      textElement.textContent += chunk
      this.scrollToBottom()
    }
  }

  finishStreamingMessage(finalContent = null) {
    if (!this.currentStreamingMessage) return

    const textElement = this.currentStreamingMessage.querySelector(".streaming-text")
    const typingIndicator = this.currentStreamingMessage.querySelector(".typing-indicator")

    // Remove typing indicator
    if (typingIndicator) {
      typingIndicator.remove()
    }

    // Remove streaming class
    this.currentStreamingMessage.classList.remove("streaming")
    textElement.classList.remove("streaming-text")
    textElement.classList.add("message-text")

    // Use final content if provided
    if (finalContent) {
      textElement.textContent = finalContent
    }

    // Add to chat history
    const message = {
      id: Date.now().toString(),
      role: "assistant",
      content: textElement.textContent,
      timestamp: new Date(),
    }

    this.chatHistory.push(message)
    this.currentStreamingMessage = null
    this.scrollToBottom()
  }

  handleStreamingError(errorMessage) {
    if (this.currentStreamingMessage) {
      const textElement = this.currentStreamingMessage.querySelector(".streaming-text")
      const typingIndicator = this.currentStreamingMessage.querySelector(".typing-indicator")

      if (typingIndicator) {
        typingIndicator.remove()
      }

      textElement.textContent = `I apologize, but I'm having trouble connecting to the AI doctor service. Error: ${errorMessage}`
      textElement.classList.add("error-message")

      this.currentStreamingMessage.classList.remove("streaming")
      this.currentStreamingMessage = null
    }
  }

  addMessage(role, content) {
    const message = {
      id: Date.now().toString(),
      role: role,
      content: content,
      timestamp: new Date(),
    }

    this.chatHistory.push(message)
    this.renderMessage(message)
    this.scrollToBottom()

    // Hide welcome message if it exists
    const welcomeMessage = this.chatMessages.querySelector(".welcome-message")
    if (welcomeMessage) {
      welcomeMessage.style.display = "none"
    }
  }

  renderMessage(message) {
    const messageDiv = document.createElement("div")
    messageDiv.className = `message ${message.role}`

    const roleIcon = message.role === "user" ? "fas fa-user" : "fas fa-user-md"
    const roleLabel = message.role === "user" ? "You" : "AI Doctor"

    messageDiv.innerHTML = `
      <div class="message-content">
        <div class="message-header">
          <i class="${roleIcon}"></i>
          <strong>${roleLabel}</strong>
        </div>
        <div class="message-text">${this.escapeHtml(message.content)}</div>
        <div class="message-time">${this.formatTime(message.timestamp)}</div>
      </div>
    `

    this.chatMessages.appendChild(messageDiv)
  }

  clearChat() {
    this.chatHistory = []
    this.currentStreamingMessage = null
    this.chatMessages.innerHTML = `
      <div class="welcome-message">
        <div class="welcome-content">
          <i class="fas fa-heartbeat welcome-icon"></i>
          <h3>Welcome to Your AI Doctor!</h3>
          <p>I'm your personal AI doctor here to help with health questions, symptom analysis, and medical guidance.</p>
          <div class="health-features">
            <div class="feature">
              <i class="fas fa-search-plus"></i>
              <span>Symptom Analysis</span>
            </div>
            <div class="feature">
              <i class="fas fa-pills"></i>
              <span>Medication Info</span>
            </div>
            <div class="feature">
              <i class="fas fa-heart"></i>
              <span>Wellness Tips</span>
            </div>
            <div class="feature">
              <i class="fas fa-phone-alt"></i>
              <span>When to See a Doctor</span>
            </div>
          </div>
          <p class="start-prompt">Enter your API key above and start consulting with your AI doctor</p>
        </div>
      </div>
    `
    this.updateUI()
  }

  scrollToBottom() {
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight
  }

  formatTime(date) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }
}

// Initialize the AI doctor when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new AIDoctorAssistant()
})
