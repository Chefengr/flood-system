// FloodSafe Chatbot System
class FloodSafeBot {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.initUI();
    this.bindEvents();
    
    // Common questions and responses
    this.responses = {
      "hello": "Hello! How can I help you with flood navigation today?",
      "hi": "Hi there! I'm FloodSafe's assistant. How can I help you?",
      "help": "I can help you with: finding safe routes, checking flood data, understanding warnings, or saving your favorite routes.",
      "route": "To find a safe route, go to the Navigation page and enter your start and destination points. I'll show you the safest path avoiding flooded areas.",
      "flood": "Our real-time flood data comes from sensors, weather services, and user reports. You can view current flood zones on our Data page.",
      "account": "You can create an account by clicking the Login button and then selecting the Register tab. This lets you save routes and get personalized alerts.",
      "contact": "You can reach our team through the Contact page or email us at support@floodsafe.example.com",
      "about": "FloodSafe is a flood detection and route optimization system that helps vehicles navigate safely during flood events in Biñan City, Laguna."
    };
    
    // Enhanced knowledge base for more general questions
    this.knowledgeBase = [
      {
        keywords: ["what", "is", "floodsafe", "about", "purpose"],
        response: "FloodSafe is an intelligent navigation system designed specifically for Biñan City, Laguna, Philippines. It helps drivers find safe routes during flood events by combining real-time flood data with advanced routing algorithms."
      },
      {
        keywords: ["how", "work", "system", "detect", "floods"],
        response: "FloodSafe works by collecting data from multiple sources including weather services, flood sensors, and user reports. We analyze this data to identify flooded areas and then calculate safe routes that avoid these hazards."
      },
      {
        keywords: ["biñan", "city", "laguna", "philippines", "area", "cover", "coverage"],
        response: "FloodSafe currently covers Biñan City, Laguna, Philippines. We focus on this area because it experiences significant flooding during rainy seasons, and our detailed mapping of the city allows for accurate route planning."
      },
      {
        keywords: ["weather", "forecast", "rain", "today", "tomorrow", "expect"],
        response: "I can't provide real-time weather forecasts, but you can check our Data page for current conditions in Biñan City. For detailed weather forecasts, I recommend checking PAGASA (Philippine Atmospheric, Geophysical and Astronomical Services Administration)."
      },
      {
        keywords: ["emergency", "help", "stuck", "danger", "rescue"],
        response: "If you're in an emergency situation, please contact Biñan City Disaster Risk Reduction and Management Office immediately at (123) 456-7890. For life-threatening emergencies, call 911."
      },
      {
        keywords: ["safe", "route", "find", "navigate", "directions"],
        response: "To find a safe route, go to our Navigation page and enter your starting point and destination. The system will calculate multiple routes and highlight the safest options that avoid flooded areas in Biñan City."
      },
      {
        keywords: ["report", "flood", "submit", "information", "alert"],
        response: "You can report flood conditions by using the 'Report Flood' feature on our Data page. Your reports help us maintain accurate flood information for the entire community in Biñan City."
      },
      {
        keywords: ["account", "login", "register", "sign up", "profile"],
        response: "Creating an account lets you save favorite routes, receive personalized flood alerts, and contribute flood reports. Click the Login button and select the Register tab to create your account."
      },
      {
        keywords: ["data", "source", "accurate", "reliable", "update"],
        response: "Our flood data comes from multiple sources including government weather services, IoT flood sensors installed throughout Biñan City, and verified user reports. The data is updated in real-time to ensure accuracy."
      },
      {
        keywords: ["app", "mobile", "download", "android", "iphone", "ios"],
        response: "The FloodSafe mobile app is coming soon! For now, our website is fully mobile-responsive and works great on smartphones and tablets. Just open your mobile browser and visit our site."
      },
      {
        keywords: ["cost", "free", "premium", "subscription", "pay"],
        response: "FloodSafe is completely free to use for all residents and visitors of Biñan City. This service is supported by the local government to improve safety during flood events."
      },
      {
        keywords: ["thank", "thanks", "appreciate", "helpful"],
        response: "You're welcome! I'm happy to help keep you safe during flood events in Biñan City. Is there anything else you'd like to know?"
      }
    ];
  }
  
  // Initialize the chatbot UI
  initUI() {
    // Create chat button
    const chatButton = document.createElement('div');
    chatButton.id = 'chat-button';
    chatButton.className = 'fixed bottom-6 right-6 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg cursor-pointer z-50 hover:bg-blue-700 transition';
    chatButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>';
    
    // Create chat container
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chat-container';
    chatContainer.className = 'fixed bottom-24 right-6 w-80 bg-white rounded-lg shadow-xl z-50 flex flex-col overflow-hidden transition-all duration-300 transform scale-0 origin-bottom-right';
    chatContainer.style.height = '400px';
    chatContainer.style.maxHeight = '70vh';
    
    // Chat header
    chatContainer.innerHTML = `
      <div class="bg-blue-600 text-white p-4 flex justify-between items-center">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
          </div>
          <span class="font-semibold">FloodSafe Assistant</span>
        </div>
        <button id="close-chat" class="text-white hover:text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      <div id="chat-messages" class="flex-1 p-4 overflow-y-auto"></div>
      <div class="border-t border-gray-200 p-3">
        <form id="chat-form" class="flex">
          <input type="text" id="chat-input" placeholder="Type your message..." class="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </form>
      </div>
    `;
    
    // Add elements to the DOM
    document.body.appendChild(chatButton);
    document.body.appendChild(chatContainer);
  }
  
  // Bind event listeners
  bindEvents() {
    // Toggle chat window
    document.getElementById('chat-button').addEventListener('click', () => {
      this.toggleChat();
    });
    
    // Close chat
    document.getElementById('close-chat').addEventListener('click', () => {
      this.toggleChat(false);
    });
    
    // Send message
    document.getElementById('chat-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });
    
    // Add welcome message after a short delay
    setTimeout(() => {
      this.addBotMessage("👋 Hi there! I'm your FloodSafe assistant. How can I help you navigate safely today?");
      
      // Add quick suggestion buttons
      this.addSuggestions([
        "How do I find a safe route?",
        "Current flood areas?",
        "How does FloodSafe work?"
      ]);
    }, 500);
  }
  
  // Toggle chat window
  toggleChat(forceState) {
    const chatContainer = document.getElementById('chat-container');
    this.isOpen = forceState !== undefined ? forceState : !this.isOpen;
    
    if (this.isOpen) {
      chatContainer.classList.remove('scale-0');
      chatContainer.classList.add('scale-100');
      // Focus input field
      setTimeout(() => {
        document.getElementById('chat-input').focus();
      }, 300);
    } else {
      chatContainer.classList.remove('scale-100');
      chatContainer.classList.add('scale-0');
    }
  }
  
  // Add a message from the bot
  addBotMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'flex mb-3';
    messageElement.innerHTML = `
      <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
          <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
        </svg>
      </div>
      <div class="ml-2 bg-blue-100 py-2 px-3 rounded-lg rounded-tl-none max-w-[85%]">
        ${message}
      </div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Store message
    this.messages.push({
      sender: 'bot',
      text: message
    });
  }
  
  // Add a message from the user
  addUserMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'flex mb-3 justify-end';
    messageElement.innerHTML = `
      <div class="mr-2 bg-blue-600 text-white py-2 px-3 rounded-lg rounded-tr-none max-w-[85%]">
        ${message}
      </div>
      <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
        </svg>
      </div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Store message
    this.messages.push({
      sender: 'user',
      text: message
    });
  }
  
  // Add suggestion buttons
  addSuggestions(suggestions) {
    const chatMessages = document.getElementById('chat-messages');
    const suggestionsElement = document.createElement('div');
    suggestionsElement.className = 'flex flex-wrap gap-2 mb-3';
    
    suggestions.forEach(suggestion => {
      const button = document.createElement('button');
      button.className = 'bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm py-1 px-3 rounded-full border border-blue-200 transition';
      button.textContent = suggestion;
      button.addEventListener('click', () => {
        this.addUserMessage(suggestion);
        this.processMessage(suggestion);
        suggestionsElement.remove();
      });
      
      suggestionsElement.appendChild(button);
    });
    
    chatMessages.appendChild(suggestionsElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Send a message
  sendMessage() {
    const inputField = document.getElementById('chat-input');
    const message = inputField.value.trim();
    
    if (message) {
      this.addUserMessage(message);
      this.processMessage(message);
      inputField.value = '';
    }
  }
  
  // Process the message and generate a response
  processMessage(message) {
    // Add typing indicator
    this.showTypingIndicator();
    
    // Process after a short delay to simulate thinking
    setTimeout(() => {
      this.hideTypingIndicator();
      
      // Check for exact matches in responses
      const lowerMessage = message.toLowerCase();
      let response = null;
      
      // Check for direct keyword matches
      for (const [key, value] of Object.entries(this.responses)) {
        if (lowerMessage.includes(key)) {
          response = value;
          break;
        }
      }
      
      // If no direct match, use the knowledge base for more complex matching
      if (!response) {
        response = this.findResponseFromKnowledgeBase(lowerMessage);
      }
      
      // If still no match, provide a fallback response
      if (!response) {
        if (this.isQuestionAboutBiñanCity(lowerMessage)) {
          response = "I'm specifically designed to help with flood navigation in Biñan City, Laguna. For detailed information about Biñan City, I recommend checking the city's official website or contacting the local government office.";
        } else if (this.isGreeting(lowerMessage)) {
          response = "Hello! How can I assist you with flood navigation in Biñan City today?";
        } else {
          response = "I'm not sure I understand. I can help with questions about flood navigation, current flood areas, or how to use FloodSafe. Could you rephrase your question?";
        }
      }
      
      // Add the response
      this.addBotMessage(response);
      
      // Add follow-up suggestions based on the conversation context
      this.addContextualSuggestions(lowerMessage);
    }, 1000);
  }
  
  // Show typing indicator
  showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    const typingElement = document.createElement('div');
    typingElement.id = 'typing-indicator';
    typingElement.className = 'flex mb-3';
    typingElement.innerHTML = `
      <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
          <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
        </svg>
      </div>
      <div class="ml-2 bg-blue-100 py-2 px-3 rounded-lg rounded-tl-none">
        <div class="flex space-x-1">
          <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0s"></div>
          <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
          <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        </div>
      </div>
    `;
    
    chatMessages.appendChild(typingElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Hide typing indicator
  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }
  
  // Find a response from the knowledge base using keyword matching
  findResponseFromKnowledgeBase(message) {
    // Tokenize the message
    const words = message.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2); // Filter out short words
    
    // Find the best matching entry in the knowledge base
    let bestMatch = null;
    let highestScore = 0;
    
    this.knowledgeBase.forEach(entry => {
      let score = 0;
      
      // Count matching keywords
      entry.keywords.forEach(keyword => {
        if (message.includes(keyword.toLowerCase())) {
          score += 1;
        }
      });
      
      // Check for word matches
      words.forEach(word => {
        if (entry.keywords.some(keyword => keyword.toLowerCase() === word)) {
          score += 0.5;
        }
      });
      
      // Update best match if this score is higher
      if (score > highestScore) {
        highestScore = score;
        bestMatch = entry;
      }
    });
    
    // Return the response if the score is above threshold
    return (highestScore >= 1) ? bestMatch.response : null;
  }
  
  // Check if the message is asking about Biñan City
  isQuestionAboutBiñanCity(message) {
    const biñanKeywords = ['biñan', 'binan', 'laguna', 'city', 'philippines', 'local', 'area'];
    return biñanKeywords.some(keyword => message.includes(keyword));
  }
  
  // Check if the message is a greeting
  isGreeting(message) {
    const greetings = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'];
    return greetings.some(greeting => message.includes(greeting));
  }
  
  // Add contextual suggestions based on the conversation
  addContextualSuggestions(message) {
    let suggestions = [];
    
    if (message.includes('route') || message.includes('navigation') || message.includes('direction')) {
      suggestions = [
        "Show me safe routes",
        "How to avoid floods?",
        "Current road conditions"
      ];
    } else if (message.includes('flood') || message.includes('water') || message.includes('rain')) {
      suggestions = [
        "Flood levels in Biñan",
        "Report a flood",
        "Flood safety tips"
      ];
    } else if (message.includes('account') || message.includes('login') || message.includes('register')) {
      suggestions = [
        "Benefits of an account",
        "How to register",
        "Forgot password"
      ];
    } else if (message.includes('emergency') || message.includes('help') || message.includes('danger')) {
      suggestions = [
        "Emergency contacts",
        "Evacuation centers",
        "Safety procedures"
      ];
    } else {
      // Default suggestions
      suggestions = [
        "Navigation help",
        "Flood information",
        "About FloodSafe"
      ];
    }
    
    this.addSuggestions(suggestions);
  }
}

// Initialize the chatbot when the page is loaded
document.addEventListener('DOMContentLoaded', function() {
window.floodSafeBot = new FloodSafeBot();
});