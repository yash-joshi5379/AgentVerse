# Quick Start Guide

Get up and running with ChatGPT API integration in 3 easy steps!

## Step 1: Get Your API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

## Step 2: Add API Key to Project

1. Create a file named `.env` in the project root (same folder as `package.json`)
2. Add this line:
   ```
   VITE_OPENAI_API_KEY=sk-your-actual-key-here
   ```
3. Replace `sk-your-actual-key-here` with your real key

⚠️ **Important**: The file MUST be named exactly `.env` (not `.env.txt` or anything else)

## Step 3: Run the App

```bash
npm run dev
```

That's it! The app will open in your browser.

## Test It Out

1. Type any restaurant name (e.g., "Pizza Palace" or "Sushi Zen")
2. Add a location (e.g., "New York City")
3. Add some taste preferences (e.g., "Spicy", "Asian")
4. Add dietary preferences if you want (e.g., "Vegan", "Keto")
5. Click Search!

You'll see AI-generated:
- Restaurant background story
- Complete menu with prices
- Nutrition information for each dish
- Health benefits and dietary info
- Personalized match scores

## Troubleshooting

**"API key not configured" error?**
- Make sure `.env` file exists in project root
- Check the filename is exactly `.env`
- Restart the dev server after creating `.env`
- Verify no spaces around the `=` sign

**"Failed to load restaurant information"?**
- Check your API key is valid
- Make sure you have credits in OpenAI account
- Check browser console for details
- Verify internet connection

**Need help?**
See `SETUP.md` for detailed troubleshooting!

## Example Searches

Try these to see the AI in action:

- **Italian Restaurant** → Authentic Italian dishes with nutrition info
- **Sushi Bar Tokyo** → Japanese cuisine with health benefits
- **Vegan Cafe** → Plant-based options with detailed nutrition
- **BBQ Smokehouse** → American BBQ with calorie info

Enjoy exploring restaurants with AI-powered insights! 🍽️✨

