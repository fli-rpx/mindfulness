# Mindfulness Therapy App - DeepSeek AI Integration

## Overview

The mindfulness app now supports **DeepSeek API** for real AI-powered emotional analysis. By default, it uses a local keyword-based fallback, but you can enable the real AI by adding your DeepSeek API key.

## Setup Instructions

### 1. Get a DeepSeek API Key

1. Go to [DeepSeek Platform](https://platform.deepseek.com/)
2. Sign up for an account
3. Generate an API key from your dashboard
4. Copy the API key

### 2. Configure the App

Open `app.js` and find the `deepseekConfig` object at the top:

```javascript
deepseekConfig: {
    apiKey: '', // <-- Paste your API key here
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    useRealAI: false // <-- Set this to true to enable DeepSeek
},
```

### 3. Enable DeepSeek AI

1. Paste your API key in the `apiKey` field
2. Set `useRealAI: true`
3. Save the file
4. Refresh the app in your browser

## How It Works

### Without DeepSeek (Default)
- Uses keyword matching to detect emotional states
- Pre-written template responses
- Works offline
- No API costs

### With DeepSeek Enabled
- Sends user messages to DeepSeek API
- AI analyzes emotions using the Power-Possession Cycle framework
- Generates personalized, empathetic responses
- Falls back to local analysis if API fails

## API Costs

DeepSeek API pricing (as of 2024):
- Input tokens: ~$0.14 per million tokens
- Output tokens: ~$0.28 per million tokens

Each chat message typically costs less than $0.001.

## Privacy Note

When DeepSeek is enabled:
- User messages are sent to DeepSeek's servers
- Data is processed according to DeepSeek's privacy policy
- No data is stored locally except chat history (if you implement it)

## Troubleshooting

**"I'm having trouble connecting right now"**
- Check your API key is correct
- Verify you have internet connection
- Check browser console for error details

**API not responding**
- The app automatically falls back to local analysis
- Check DeepSeek's status page for outages

## Files Modified

- `app.js` - Added DeepSeek API integration
- `styles.css` - Added typing indicator animation

## Security Note

⚠️ **Never commit your API key to public repositories!**

For production use, consider:
- Using environment variables
- Setting up a backend proxy
- Implementing rate limiting
