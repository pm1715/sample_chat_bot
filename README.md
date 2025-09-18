# Smart ChatBot Web Component

A lightweight, self-contained chatbot that can be easily added to any website. Built as a web component with zero dependencies and no backend required.

## Features

- Pure JavaScript implementation - no dependencies
- No backend server required
- Smart context-aware responses
- Customizable appearance and behavior
- Minimalistic design
- Easy to deploy
- Works offline

## Quick Start

Just add these two lines to your HTML:

```html
<!-- Import the web component -->
<script src="path/to/smart-chat-bot.js"></script>

<!-- Add the chatbot -->
<smart-chat-bot business-name="Your Company" primary-color="#4CAF50"></smart-chat-bot>
```

That's it! No backend setup, no dependencies, no configuration needed.

## Customization

You can customize the chatbot appearance using CSS variables:

```html
<style>
    chat-bot {
        --chat-primary-color: #4CAF50;
        --chat-secondary-color: #45a049;
        --chat-font-family: 'Arial, sans-serif';
        --chat-width: 300px;
        --chat-height: 400px;
    }
</style>
```

Or using JavaScript:

```javascript
const chatbot = document.querySelector('chat-bot');
chatbot.style.setProperty('--chat-primary-color', '#4CAF50');
```

## Customization

### Easy Configuration
You can customize the chatbot by setting a configuration object before loading the script:

```javascript
window.CHATBOT_CONFIG = {
    headerText: 'Your Company Assistant',
    primaryColor: '#4CAF50',
    secondaryColor: '#45a049',
    fontFamily: 'Helvetica, Arial, sans-serif',
    position: 'right',
    initialMessage: "Welcome! How can I assist you today?",
    placeholder: "Ask me anything...",
    buttonText: "Send",
    responses: {
        // Custom responses (optional)
        pricing: {
            initial: [
                "Let me tell you about our pricing options...",
                "We have several packages available..."
            ]
        }
    }
};
```

### Runtime Configuration
You can update the chatbot's configuration at any time using:

```javascript
window.updateChatbotConfig({
    headerText: 'New Title',
    primaryColor: '#2196F3'
});
```

### Advanced Customization
For more extensive customization, you can:
- Modify the CSS in `chatbot-embed.js`
- Extend the response templates in the JavaScript code
- Add new features to the core chatbot functionality

The chatbot includes intelligent response handling for:
- Pricing inquiries
- Contact/support requests
- Product/service information
- Greetings and farewells
- Context-aware follow-up responses

## Deployment

1. Host these files on your web server
2. If using GitHub Pages:
   - Push the code to your GitHub repository
   - Enable GitHub Pages in your repository settings
   - Set the source to the branch containing your code

## Testing Locally

Simply open the `index.html` file in a web browser to test the chatbot functionality.

## Future Improvements

- Add more sophisticated response handling
- Implement API integration for dynamic responses
- Add support for rich media responses
- Include typing indicators
- Add chat history persistence