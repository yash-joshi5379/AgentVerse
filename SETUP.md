# API Key Setup Guide

## Quick Setup

1. Create a `.env` file in the project root (same level as `package.json`)

2. Add the following lines to your `.env` file:
```
VITE_OPENAI_API_KEY=your_actual_openai_api_key_here
VITE_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
```

3. Replace the keys with your real API keys:
   - **OpenAI API Key**: Get from https://platform.openai.com/api-keys
   - **Google Maps API Key**: Get from https://console.cloud.google.com/google/maps-apis

4. For Google Maps API Key setup:
   - Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
   - Create a new project or select an existing one
   - Enable "Maps Embed API" 
   - Create credentials (API Key)
   - Restrict the API key to "Maps Embed API" for security
   - Copy your API key

5. Restart your dev server if it's running

**Note**: Google Maps API key is optional. The app will work without it but maps will show a fallback link instead.

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

