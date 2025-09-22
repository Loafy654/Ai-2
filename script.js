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
      // Prepare messages for the API with enhanced health context
      const systemMessage = {
        role: "system",
        content: `You are an advanced AI doctor and medical information provider with expertise in healthcare, symptom analysis, and medical guidance. You provide comprehensive, empathetic, and informative responses while prioritizing patient safety.

MEDICAL EXPERTISE AREAS:
- Symptom analysis and differential diagnosis
- General medicine and family practice
- Preventive healthcare and wellness
- Medication information and interactions
- Emergency recognition and triage
- Mental health and wellness support
- Chronic disease management
- Health education and lifestyle counseling

RESPONSE GUIDELINES:
- Provide detailed, well-structured medical information
- Use clear, understandable language for patients
- Include relevant follow-up questions when appropriate
- Suggest specific next steps and timeline for care
- Explain medical concepts in an educational manner
- Consider multiple possibilities and risk factors
- Provide context about when symptoms warrant immediate attention

CRITICAL SAFETY PROTOCOLS:
- Always emphasize that you are not a replacement for professional medical care
- Strongly recommend consulting healthcare professionals for diagnosis and treatment
- Immediately advise emergency services for life-threatening symptoms
- Clearly state limitations of AI-based medical advice
- Prioritize patient safety above all other considerations
- Include appropriate medical disclaimers in responses

COMMUNICATION STYLE:
- Be empathetic, caring, and professional
- Show genuine concern for patient wellbeing
- Provide hope while being realistic about conditions
- Use a warm, reassuring tone while maintaining medical accuracy
- Structure responses clearly with headers and bullet points when helpful
- Include relevant medical terminology with explanations

Remember: Your role is to educate, inform, and guide patients toward appropriate medical care, not to replace professional medical diagnosis or treatment.`,
      }

      const messages = [systemMessage, ...this.chatHistory, { role: "user", content: message }]

      // Enhanced model selection with better fallback strategy
      const models = [
        "deepseek/deepseek-r1-0528:free",
        "meta-llama/llama-3.2-3b-instruct:free",
        "microsoft/phi-3-mini-128k-instruct:free",
        "google/gemma-2-9b-it:free",
        "qwen/qwen-2-7b-instruct:free",
      ]

      let lastError = null
      let attemptCount = 0

      for (const model of models) {
        attemptCount++
        try {
          console.log(`Attempting model ${attemptCount}/${models.length}: ${model}`)

          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "HTTP-Referer": window.location.origin,
              "X-Title": "AI Doctor Assistant - Advanced Medical Consultation",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: model,
              messages: messages,
              stream: true,
              temperature: 0.7,
              max_tokens: 2000,
            }),
          })

          if (response.ok) {
            console.log(`✅ Successfully connected with ${model}`)

            // Success! Process the streaming response
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ""
            let fullContent = ""
            let hasStartedStreaming = false

            while (true) {
              const { done, value } = await reader.read()

              if (done) break

              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split("\n")
              buffer = lines.pop()

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6)

                  if (data.trim() === "[DONE]") {
                    this.finishStreamingMessage(fullContent)
                    return
                  }

                  try {
                    const parsed = JSON.parse(data)

                    if (
                      parsed.choices &&
                      parsed.choices[0] &&
                      parsed.choices[0].delta &&
                      parsed.choices[0].delta.content
                    ) {
                      const chunk = parsed.choices[0].delta.content
                      fullContent += chunk
                      hasStartedStreaming = true
                      this.updateStreamingMessage(chunk)
                    }
                  } catch (e) {
                    continue
                  }
                }
              }
            }

            if (fullContent) {
              this.finishStreamingMessage(fullContent)
            } else if (!hasStartedStreaming) {
              throw new Error("No content received from model")
            }
            return // Success, exit the function
          } else {
            const errorText = await response.text()
            lastError = `Model ${model}: HTTP ${response.status} - ${errorText}`

            // If it's a rate limit error, try next model
            if (response.status === 429) {
              console.log(`⏳ Model ${model} is rate-limited, trying next model...`)
              continue
            } else {
              console.log(`❌ Model ${model} failed with error: ${response.status}`)
              // For other errors, try next model instead of failing immediately
              continue
            }
          }
        } catch (error) {
          lastError = `Model ${model}: ${error.message}`
          console.log(`❌ Failed with model ${model}:`, error.message)
          continue
        }
      }

      // If we get here, all models failed
      throw new Error(`All ${models.length} models failed. Last error: ${lastError}`)
    } catch (error) {
      console.error("❌ All streaming attempts failed:", error)
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

    // Remove streaming class and cursor
    this.currentStreamingMessage.classList.remove("streaming")
    textElement.classList.remove("streaming-text")
    textElement.classList.add("message-text")

    // Use final content if provided
    if (finalContent) {
      textElement.textContent = finalContent
    }

    // Add to chat history for context
    const assistantMessage = {
      role: "assistant",
      content: textElement.textContent,
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

      let helpMessage = ""

      if (errorMessage.includes("429") || errorMessage.includes("rate-limited")) {
        helpMessage = `🚫 **All Free Models Are Currently Busy**

The free AI models are experiencing high traffic right now. Here are your options:

**⏰ Quick Solutions:**
• Wait 2-3 minutes and try again
• Free models reset limits every hour
• Try during off-peak hours (early morning/late night)

**💡 For Unlimited Access:**
• Visit openrouter.ai and add $5 credit
• Get access to premium models (GPT-4, Claude, etc.)
• No more waiting or rate limits
• Much better medical responses

**🔄 What We Tried:**
• DeepSeek R1 (rate limited)
• Llama 3.2 (rate limited) 
• Phi-3 Mini (rate limited)
• Gemma 2 (rate limited)
• All backup models (rate limited)

**Current Status:** All 5 free models are temporarily overloaded.`
      } else if (
        errorMessage.includes("401") ||
        errorMessage.includes("invalid") ||
        errorMessage.includes("unauthorized")
      ) {
        helpMessage = `🔑 **API Key Problem**

There's an issue with your API key. Please check:

**✅ Verification Steps:**
• Your API key is correctly copied (no extra spaces)
• Key is from openrouter.ai (not OpenAI or other services)
• Your OpenRouter account is active and verified
• You haven't exceeded your account limits

**🔧 How to Fix:**
1. Go to openrouter.ai/keys
2. Copy your API key again
3. Paste it carefully in the field above
4. Make sure there are no extra characters

**💳 Account Status:**
• Free accounts have daily limits
• Adding $5 credit removes all restrictions`
      } else {
        helpMessage = `⚠️ **Connection Issue**

We're having trouble connecting to the AI medical service.

**🔍 Error Details:** ${errorMessage}

**🛠️ Troubleshooting Steps:**
• Check your internet connection
• Try refreshing the page (F5 or Ctrl+R)
• Clear your browser cache
• Try a different browser
• Wait a few minutes and try again

**📞 If Problem Persists:**
• Check openrouter.ai status page
• Verify your account at openrouter.ai
• Contact OpenRouter support if needed`
      }

      textElement.innerHTML = `
        <div class="error-container">
          <div class="error-header">
            <i class="fas fa-exclamation-triangle"></i>
            <strong>Unable to Connect to AI Doctor</strong>
          </div>
          <div class="error-content">
            ${helpMessage
              .split("\n")
              .map((line) => {
                if (line.startsWith("**") && line.endsWith("**")) {
                  return `<h4>${line.replace(/\*\*/g, "")}</h4>`
                } else if (line.startsWith("•")) {
                  return `<li>${line.substring(1).trim()}</li>`
                } else if (line.trim()) {
                  return `<p>${line}</p>`
                }
                return ""
              })
              .join("")}
          </div>
          <div class="error-footer">
            <p><strong>🚨 Medical Emergency?</strong> Don't wait for the AI - call emergency services immediately!</p>
          </div>
        </div>
      `

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

    // Add to history for context
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
          <h3>Welcome to Your Advanced AI Doctor!</h3>
          <p>I'm your comprehensive AI medical assistant, equipped with advanced healthcare knowledge to help with symptom analysis, medical guidance, and health education.</p>
          <div class="health-features">
            <div class="feature">
              <i class="fas fa-search-plus"></i>
              <span>Advanced Symptom Analysis</span>
            </div>
            <div class="feature">
              <i class="fas fa-pills"></i>
              <span>Medication Information</span>
            </div>
            <div class="feature">
              <i class="fas fa-heart"></i>
              <span>Wellness & Prevention</span>
            </div>
            <div class="feature">
              <i class="fas fa-phone-alt"></i>
              <span>Emergency Recognition</span>
            </div>
            <div class="feature">
              <i class="fas fa-brain"></i>
              <span>Mental Health Support</span>
            </div>
            <div class="feature">
              <i class="fas fa-clipboard-list"></i>
              <span>Health Education</span>
            </div>
          </div>
          <p class="start-prompt">Enter your OpenRouter API key above and start your comprehensive medical consultation</p>
          <div class="feature-highlight">
            <p><strong>🎯 Enhanced Features:</strong> Real-time streaming responses, comprehensive medical knowledge, mobile-optimized interface, and intelligent fallback systems for reliable service.</p>
          </div>
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

// Initialize the enhanced AI doctor when the page loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("🏥 Initializing Advanced AI Doctor Assistant...")
  new AIDoctorAssistant()
})
