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
    // Handle form submission for both desktop and mobile
    this.chatForm.addEventListener("submit", (e) => this.handleSubmit(e))

    // Handle send button click specifically for mobile
    this.sendBtn.addEventListener("click", (e) => {
      e.preventDefault()
      this.handleSubmit(e)
    })

    // Handle touch events for mobile
    this.sendBtn.addEventListener("touchend", (e) => {
      e.preventDefault()
      this.handleSubmit(e)
    })

    this.apiKeyInput.addEventListener("input", () => this.updateUI())
    this.clearBtn.addEventListener("click", () => this.clearChat())
    this.togglePassword.addEventListener("click", () => this.togglePasswordVisibility())
    this.toggleSettings.addEventListener("click", () => this.toggleSettingsPanel())

    // Enhanced mobile keyboard handling
    this.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        this.handleSubmit(e)
      }
    })

    // Add input event for real-time UI updates on mobile
    this.messageInput.addEventListener("input", () => this.updateUI())
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
    e.stopPropagation() // Prevent event bubbling on mobile

    const message = this.messageInput.value.trim()
    const apiKey = this.apiKeyInput.value.trim()

    if (!message || !apiKey || this.isLoading) return

    // Blur input on mobile to hide keyboard
    if (window.innerWidth <= 768) {
      this.messageInput.blur()
    }

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
      // Prepare messages for the API with health context
      const systemMessage = {
        role: "system",
        content: `You are a helpful AI doctor and medical information provider. You can help users understand symptoms, provide general health information, and suggest when to seek professional medical care.

IMPORTANT DISCLAIMERS:
- You are not a replacement for professional medical advice, diagnosis, or treatment
- Always recommend consulting with qualified healthcare professionals for serious concerns
- In emergencies, advise users to call emergency services immediately
- Provide educational information while emphasizing the importance of professional medical consultation

Be empathetic, informative, and always prioritize user safety by recommending professional medical care when appropriate.`,
      }

      const messages = [systemMessage, ...this.chatHistory, { role: "user", content: message }]

      // Make direct API call to OpenRouter
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "AI Doctor Assistant",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1-0528:free",
          messages: messages,
          stream: true,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }

      // Handle streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let fullContent = ""

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
              this.finishStreamingMessage(fullContent)
              return
            }

            try {
              const parsed = JSON.parse(data)

              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                const chunk = parsed.choices[0].delta.content
                fullContent += chunk
                this.updateStreamingMessage(chunk)
              }
            } catch (e) {
              // Skip invalid JSON chunks
              continue
            }
          }
        }
      }

      // Fallback if streaming ends without [DONE]
      if (fullContent) {
        this.finishStreamingMessage(fullContent)
      }
    } catch (error) {
      console.error("Streaming error:", error)
      this.handleStreamingError(error.message)
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
    const typingIndicator = this.currentStreamingMessage.querySelector(".typing-indicator")

    if (textElement) {
      // Remove typing indicator on first chunk
      if (typingIndicator && textElement.textContent === "") {
        typingIndicator.remove()
      }

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
    const userMessage = {
      role: "user",
      content:
        this.chatHistory.length > 0
          ? this.chatMessages.querySelector(".message.user:last-of-type .message-text").textContent
          : "Previous message",
    }

    const assistantMessage = {
      role: "assistant",
      content: textElement.textContent,
    }

    // Only add user message if it's not already in history
    if (this.chatHistory.length === 0 || this.chatHistory[this.chatHistory.length - 1].role !== "user") {
      this.chatHistory.push(userMessage)
    }
    this.chatHistory.push(assistantMessage)

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

      textElement.textContent = `I apologize, but I'm having trouble connecting to the AI doctor service. 

Error: ${errorMessage}

Please check:
- Your API key is correct and valid
- You have internet connection
- Your OpenRouter account has credits

If this is a medical emergency, please contact emergency services immediately.`

      textElement.classList.add("error-message")
      this.currentStreamingMessage.classList.remove("streaming")
      this.currentStreamingMessage = null
    }
  }

  addMessage(role, content) {
    const message = {
      role: role,
      content: content,
      timestamp: new Date(),
    }

    this.renderMessage(message)
    this.scrollToBottom()

    // Hide welcome message if it exists
    const welcomeMessage = this.chatMessages.querySelector(".welcome-message")
    if (welcomeMessage) {
      welcomeMessage.style.display = "none"
    }

    // Add to history (will be updated properly in finishStreamingMessage for assistant messages)
    if (role === "user") {
      this.chatHistory.push({ role: "user", content: content })
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
