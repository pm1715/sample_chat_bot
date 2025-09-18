class SmartChatBot {
    constructor(options = {}) {
        this.options = {
            initialMessage: "Hello! How can I help you today?",
            businessName: options.businessName || "Our Business",
            primaryColor: options.primaryColor || "#2c3e50",
            // AI Configuration
            aiConfig: options.aiConfig || {
                enabled: false,
                provider: 'huggingface', // 'huggingface', 'openai', or 'custom'
                apiKey: '',
                endpoint: '',
                modelName: 'facebook/blenderbot-400M-distill',
                temperature: 0.7,
                maxTokens: 100
            },
            // Business specific data
            businessData: options.businessData || {
                products: [],
                services: [],
                pricing: {},
                contactInfo: {},
                faqs: []
            },
            // Fallback response system
            knowledgeBase: options.knowledgeBase || this.getDefaultKnowledgeBase()
        };

        // Context tracking
        this.conversationContext = {
            lastTopic: null,
            mentionedTopics: new Set(),
            messageCount: 0
        };
    }

    getDefaultKnowledgeBase() {
        return {
            products: {
                keywords: ['product', 'item', 'buy', 'purchase'],
                responses: [
                    "We offer a wide range of products. Could you specify what type of product you're looking for?",
                    "Our product line includes various options. What specific features are you interested in?",
                    "I'd be happy to tell you about our products. What's your main requirement?"
                ]
            },
            pricing: {
                keywords: ['price', 'cost', 'pricing', 'expensive', 'cheap', 'affordable'],
                responses: [
                    "Our pricing is competitive and varies based on your needs. Would you like a detailed quote?",
                    "We offer flexible pricing options to suit different budgets. What's your price range?",
                    "I can provide you with pricing information. Which specific product or service interests you?"
                ]
            },
            support: {
                keywords: ['help', 'support', 'issue', 'problem', 'trouble'],
                responses: [
                    "I'm here to help! Could you describe your issue in more detail?",
                    "Our support team is ready to assist. What specific help do you need?",
                    "Let me help you resolve that. Can you provide more information about your concern?"
                ]
            },
            contact: {
                keywords: ['contact', 'email', 'phone', 'call', 'reach'],
                responses: [
                    "You can reach us at contact@example.com or call us at (555) 123-4567.",
                    "Our support team is available 24/7. Would you like me to have someone contact you?",
                    "I can help you get in touch with the right person. What's your preferred contact method?"
                ]
            }
        };
    }

    findBestMatch(message) {
        const lowerMessage = message.toLowerCase();
        let bestMatch = {
            category: null,
            score: 0
        };

        // Check each category in knowledge base
        for (const [category, data] of Object.entries(this.options.knowledgeBase)) {
            const matchScore = data.keywords.reduce((score, keyword) => {
                return score + (lowerMessage.includes(keyword) ? 1 : 0);
            }, 0);

            if (matchScore > bestMatch.score) {
                bestMatch = {
                    category,
                    score: matchScore
                };
            }
        }

        return bestMatch;
    }

    async generateResponse(message) {
        // Track conversation context
        this.conversationContext.messageCount++;
        
        // First, try to find exact product or pricing matches
        const businessMatch = this.findBusinessDataMatch(message);
        if (businessMatch) {
            return businessMatch;
        }

        // Then try AI if enabled
        if (this.options.aiConfig.enabled) {
            try {
                const aiResponse = await this.getAIResponse(message);
                if (aiResponse) {
                    return aiResponse;
                }
            } catch (error) {
                console.warn('AI response failed, falling back to rule-based response:', error);
            }
        }

        // Finally, fall back to rule-based responses
        return this.getFallbackResponse(message);
    }

    findBusinessDataMatch(message) {
        const lowerMessage = message.toLowerCase();
        const { products, services, pricing, faqs } = this.options.businessData;

        // Check for product queries
        if (products.length > 0) {
            const productMatch = products.find(p => 
                lowerMessage.includes(p.name.toLowerCase()) ||
                p.keywords?.some(k => lowerMessage.includes(k.toLowerCase()))
            );
            if (productMatch) {
                return this.formatProductResponse(productMatch);
            }
        }

        // Check for pricing queries
        if (Object.keys(pricing).length > 0 && 
            (lowerMessage.includes('price') || lowerMessage.includes('cost'))) {
            const priceMatch = Object.keys(pricing).find(k => 
                lowerMessage.includes(k.toLowerCase())
            );
            if (priceMatch) {
                return this.formatPricingResponse(priceMatch, pricing[priceMatch]);
            }
        }

        // Check FAQs
        if (faqs.length > 0) {
            const faqMatch = faqs.find(faq => 
                lowerMessage.includes(faq.question.toLowerCase())
            );
            if (faqMatch) {
                return faqMatch.answer;
            }
        }

        return null;
    }

    async getAIResponse(message) {
        const context = this.getBusinessContext();
        const conversationContext = this.getConversationContext();
        
        // Prepare the prompt with business context
        const prompt = `
        Context: You are a customer service assistant for ${this.options.businessName}.
        Business Information: ${context}
        Previous context: ${conversationContext}
        Customer message: ${message}
        Respond in a helpful, professional manner while keeping the response concise and accurate.
        `;

        switch (this.options.aiConfig.provider) {
            case 'huggingface':
                return this.getHuggingFaceResponse(prompt);
            case 'openai':
                return this.getOpenAIResponse(prompt);
            case 'custom':
                return this.getCustomAIResponse(prompt);
            default:
                throw new Error('Unknown AI provider');
        }
    }

    async getHuggingFaceResponse(prompt) {
        const { apiKey, endpoint, modelName, temperature, maxTokens } = this.options.aiConfig;
        try {
            const response = await fetch(
                endpoint || `https://api-inference.huggingface.co/models/${modelName}`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ 
                        inputs: prompt,
                        parameters: {
                            max_length: maxTokens,
                            temperature: temperature,
                            top_p: 0.9
                        }
                    }),
                }
            );

            if (!response.ok) throw new Error('AI API request failed');
            const result = await response.json();
            return result[0]?.generated_text || null;
        } catch (error) {
            console.error('HuggingFace API error:', error);
            return null;
        }
    }

    async getOpenAIResponse(prompt) {
        const { apiKey, endpoint, temperature, maxTokens } = this.options.aiConfig;
        try {
            const response = await fetch(
                endpoint || 'https://api.openai.com/v1/completions',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'text-davinci-003',
                        prompt: prompt,
                        max_tokens: maxTokens,
                        temperature: temperature
                    })
                }
            );

            if (!response.ok) throw new Error('OpenAI API request failed');
            const result = await response.json();
            return result.choices[0]?.text || null;
        } catch (error) {
            console.error('OpenAI API error:', error);
            return null;
        }
    }

    async getCustomAIResponse(prompt) {
        const { endpoint, apiKey } = this.options.aiConfig;
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) throw new Error('Custom AI API request failed');
            const result = await response.json();
            return result.response || null;
        } catch (error) {
            console.error('Custom AI API error:', error);
            return null;
        }
    }

    getBusinessContext() {
        const { products, services, pricing } = this.options.businessData;
        return `
            Available products: ${products.map(p => p.name).join(', ')}
            Services offered: ${services.join(', ')}
            Price ranges: ${Object.keys(pricing).map(k => `${k}: ${pricing[k]}`).join(', ')}
        `;
    }

    formatProductResponse(product) {
        return `${product.name}: ${product.description}. ${
            product.price ? `Price: ${product.price}.` : ''
        } ${product.availability ? `Availability: ${product.availability}` : ''}`;
    }

    formatPricingResponse(item, price) {
        return `The price for ${item} is ${price}. Would you like more details or to proceed with a purchase?`;
    }

    getFallbackResponse(message) {
        const match = this.findBestMatch(message);

        if (match.score > 0) {
            const responses = this.options.knowledgeBase[match.category].responses;
            this.conversationContext.lastTopic = match.category;
            this.conversationContext.mentionedTopics.add(match.category);
            return responses[Math.floor(Math.random() * responses.length)];
        }

        if (this.conversationContext.lastTopic) {
            const lastTopicResponses = this.options.knowledgeBase[this.conversationContext.lastTopic].responses;
            return "Regarding " + this.conversationContext.lastTopic + ", " + 
                   lastTopicResponses[Math.floor(Math.random() * lastTopicResponses.length)];
        }

        return "I understand you're asking about '" + message + "'. Could you please provide more details or rephrase your question?";
    }

    getConversationContext() {
        // Get relevant context from conversation history
        const topics = Array.from(this.conversationContext.mentionedTopics).join(', ');
        return `Previous topics discussed: ${topics}. Last topic: ${this.conversationContext.lastTopic}`;
    }

    isGreeting(message) {
        const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
        return greetings.some(greeting => message.toLowerCase().includes(greeting));
    }
}

class ChatBotUI extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Initialize the smart chatbot
        this.chatBot = new SmartChatBot({
            businessName: this.getAttribute('business-name') || "Our Business",
            primaryColor: this.getAttribute('primary-color') || "#2c3e50"
        });

        this.setupComponent();
    }

    setupComponent() {
        const style = document.createElement('style');
        style.textContent = `
            :host {
                --chat-primary-color: ${this.chatBot.options.primaryColor};
                --chat-secondary-color: ${this.adjustColor(this.chatBot.options.primaryColor, -20)};
                --chat-font-family: Arial, sans-serif;
                --chat-width: 300px;
                --chat-height: 400px;
            }

            .chat-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: var(--chat-width);
                height: var(--chat-height);
                border: 1px solid #ccc;
                border-radius: 10px;
                background: white;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                display: flex;
                flex-direction: column;
                font-family: var(--chat-font-family);
                z-index: 10000;
                transition: all 0.3s ease;
            }

            .chat-header {
                background: var(--chat-primary-color);
                color: white;
                padding: 10px;
                border-top-left-radius: 10px;
                border-top-right-radius: 10px;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
                background: #f9f9f9;
            }

            .message {
                margin: 5px 0;
                padding: 8px 12px;
                border-radius: 15px;
                max-width: 80%;
                word-wrap: break-word;
                animation: fadeIn 0.3s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .user-message {
                background: #e3f2fd;
                margin-left: auto;
                color: #000;
            }

            .bot-message {
                background: #fff;
                margin-right: auto;
                color: #000;
            }

            .chat-input-container {
                padding: 10px;
                border-top: 1px solid #eee;
                display: flex;
                background: white;
            }

            .chat-input {
                flex: 1;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 20px;
                margin-right: 8px;
                font-size: 14px;
            }

            .chat-send-button {
                padding: 8px 15px;
                background: var(--chat-primary-color);
                color: white;
                border: none;
                border-radius: 20px;
                cursor: pointer;
            }

            .chat-send-button:hover {
                background: var(--chat-secondary-color);
            }

            .minimize-button {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 18px;
                padding: 0 5px;
            }

            .chat-container.minimized {
                height: auto;
            }

            .chat-container.minimized .chat-messages,
            .chat-container.minimized .chat-input-container {
                display: none;
            }
        `;

        const chatHTML = `
            <div class="chat-container">
                <div class="chat-header">
                    <span>${this.chatBot.options.businessName} Assistant</span>
                    <button class="minimize-button">−</button>
                </div>
                <div class="chat-messages"></div>
                <div class="chat-input-container">
                    <input type="text" class="chat-input" placeholder="Type your message...">
                    <button class="chat-send-button">Send</button>
                </div>
            </div>
        `;

        this.shadowRoot.innerHTML = chatHTML;
        this.shadowRoot.appendChild(style);

        this.setupEventListeners();
        this.showWelcomeMessage();
    }

    setupEventListeners() {
        const input = this.shadowRoot.querySelector('.chat-input');
        const sendButton = this.shadowRoot.querySelector('.chat-send-button');
        const minimizeButton = this.shadowRoot.querySelector('.minimize-button');
        const container = this.shadowRoot.querySelector('.chat-container');

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        sendButton.addEventListener('click', () => this.sendMessage());

        minimizeButton.addEventListener('click', () => {
            container.classList.toggle('minimized');
            minimizeButton.textContent = container.classList.contains('minimized') ? '+' : '−';
        });
    }

    async sendMessage() {
        const input = this.shadowRoot.querySelector('.chat-input');
        const message = input.value.trim();

        if (message) {
            this.addMessage(message, 'user');
            input.value = '';

            // Show typing indicator
            const typingIndicator = this.showTypingIndicator();
            
            try {
                // Get response from chatbot
                const response = await this.chatBot.generateResponse(message);
                
                // Remove typing indicator and add response
                typingIndicator.remove();
                this.addMessage(response, 'bot');
            } catch (error) {
                console.error('Error getting response:', error);
                typingIndicator.remove();
                this.addMessage("I apologize, but I'm having trouble generating a response right now. Please try again.", 'bot');
            }
        }
    }

    showTypingIndicator() {
        const messages = this.shadowRoot.querySelector('.chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.textContent = 'Typing...';
        messages.appendChild(typingDiv);
        messages.scrollTop = messages.scrollHeight;

        return typingDiv;
    }

    addMessage(text, sender) {
        const messages = this.shadowRoot.querySelector('.chat-messages');
        const typingIndicator = messages.querySelector('.typing-indicator');
        
        if (typingIndicator) {
            typingIndicator.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.textContent = text;
        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    showWelcomeMessage() {
        setTimeout(() => {
            this.addMessage(this.chatBot.options.initialMessage, 'bot');
        }, 500);
    }

    adjustColor(color, amount) {
        return color;  // For simplicity, returning the same color
    }

    // API for external configuration
    updateConfig(config) {
        if (config.primaryColor) {
            this.style.setProperty('--chat-primary-color', config.primaryColor);
            this.style.setProperty('--chat-secondary-color', this.adjustColor(config.primaryColor, -20));
        }
        if (config.businessName) {
            this.shadowRoot.querySelector('.chat-header span').textContent = `${config.businessName} Assistant`;
        }
        if (config.knowledgeBase) {
            this.chatBot.options.knowledgeBase = config.knowledgeBase;
        }
    }
}

// Register the web component
customElements.define('smart-chat-bot', ChatBotUI);