# FindMyFood - Restaurant Recommendation App

A modern, responsive food recommendation dashboard that helps you find restaurants tailored to your personal taste profile, dietary preferences, and allergen requirements.

## Features

- 🔍 **Smart Restaurant Search**: Search for any restaurant with AI-powered information
- 🎯 **Personalized Recommendations**: Get menu suggestions based on your taste profile
- 🥗 **Health Information**: View detailed nutrition info for every menu item
- 📋 **Dietary Filters**: Filter by dietary preferences (Vegan, Keto, etc.) and allergens
- ⭐ **Match Scores**: See how well each dish matches your preferences
- 🎨 **Beautiful UI**: Modern glassmorphism design with smooth animations

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- OpenAI API key (get one at [platform.openai.com](https://platform.openai.com/api-keys))

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd FindMyFood
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Add your OpenAI API key to the `.env` file:
```
VITE_OPENAI_API_KEY=your_actual_openai_api_key_here
```

**⚠️ IMPORTANT**: Replace `your_actual_openai_api_key_here` with your actual OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys)

### Running the Application

Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The production build will be in the `build/` directory.

## How to Use

1. **Enter Restaurant Name**: Type the name of any restaurant you want to try
2. **Add Location** (optional): Include a city or location for more accurate results
3. **Set Taste Profile**: Add your favorite flavors (e.g., "Spicy", "Fried", "Sweet")
4. **Dietary Preferences**: Specify dietary requirements (e.g., "Vegan", "Keto", "Gluten-Free")
5. **Allergens**: List any allergies to avoid (e.g., "Peanuts", "Dairy")
6. **Search**: Click the search button to get AI-generated restaurant information

The app will display:
- Restaurant background story and origins
- Complete menu with prices and ratings
- Nutrition information for each dish
- Match scores showing how well dishes fit your profile
- Similar restaurant recommendations

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **OpenAI API** - AI-powered restaurant data generation
- **Vite** - Build tool and dev server

## API Key Security

- Never commit your `.env` file to version control
- The `.env` file is already included in `.gitignore`
- Keep your API key secure and don't share it publicly
- Monitor your API usage at [platform.openai.com](https://platform.openai.com/usage)

## License

MIT License - feel free to use this project for your own purposes!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
