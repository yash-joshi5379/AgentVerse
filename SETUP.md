# API Key Setup Guide

## Quick Setup

1. Create a `.env` file in the project root (same level as `package.json`)

2. Add the following line to your `.env` file:
```
VITE_OPENAI_API_KEY=your_actual_openai_api_key_here
```

3. Replace `your_actual_openai_api_key_here` with your real OpenAI API key

4. Get your API key from: https://platform.openai.com/api-keys

5. Restart your dev server if it's running

## Important Notes

- ⚠️ **Never commit your `.env` file** - it's already in `.gitignore`
- 🔒 Keep your API key secure and private
- 💰 Monitor your usage at https://platform.openai.com/usage
- 🔑 API keys start with `sk-`

## Troubleshooting

### "API key not configured" error
- Make sure your `.env` file is in the root directory
- Verify the variable name is exactly: `VITE_OPENAI_API_KEY`
- Restart your dev server after creating/modifying `.env`
- Make sure there are no spaces around the `=` sign

### API request failed
- Check that your API key is valid
- Ensure you have credits in your OpenAI account
- Check your internet connection
- Verify the API key hasn't expired or been revoked

### Still having issues?
- Check the browser console for detailed error messages
- Verify the `.env` file is being loaded by checking network requests
- Try generating a new API key from OpenAI

