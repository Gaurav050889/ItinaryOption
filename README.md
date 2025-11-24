# Travel Itinerary Planner

A modern, full-stack web application for clients to submit their travel itinerary requests with destinations, budget, preferences, and more.

## Features

- **Comprehensive Form**: Collects all necessary information including:
  - Personal information (name, email, phone)
  - Multiple destinations
  - Budget and trip duration
  - Food preferences (Vegetarian, Vegan, Halal, etc.)
  - Stay preferences (Hotels, Hostels, Airbnb, etc.)
  - Sightseeing preferences
  - Required permissions/documents
  - Special requests

- **Modern UI**: Beautiful, responsive design with gradient backgrounds and smooth animations
- **Data Persistence**: SQLite database to store all itinerary requests
- **RESTful API**: Express.js backend with proper error handling
- **React Frontend**: Fast, interactive user interface built with React and Vite

## Tech Stack

- **Frontend**: React 18, Vite
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Styling**: Modern CSS with CSS Variables

## Installation

1. **Install all dependencies**:
   ```bash
   npm run install-all
   ```

   Or install manually:
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

## Running the Application

### Development Mode (Both Frontend and Backend)

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend development server on `http://localhost:3000`

### Run Separately

**Backend only:**
```bash
npm run server
```

**Frontend only:**
```bash
npm run client
```

## Project Structure

```
itinerary-project/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.jsx         # Main app component
│   │   ├── App.css
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Global styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                 # Express backend
│   ├── index.js           # Server entry point
│   ├── package.json
│   └── itinerary.db       # SQLite database (created automatically)
├── package.json           # Root package.json
└── README.md
```

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/itinerary` - Submit a new itinerary request
- `GET /api/itineraries` - Get all itinerary requests
- `GET /api/itinerary/:id` - Get a specific itinerary by ID

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Fill out the itinerary form with your travel details
3. Add multiple destinations by typing and clicking "Add" or pressing Enter
4. Select your food and stay preferences
5. Add any additional information about sightseeing, permissions, or special requests
6. Submit the form
7. You'll receive a confirmation with your request ID

## Database Schema

The SQLite database automatically creates a table with the following structure:

- `id` - Primary key
- `name` - Client name
- `email` - Client email
- `phone` - Client phone (optional)
- `destinations` - Comma-separated list of destinations
- `budget` - Budget amount
- `days` - Number of days
- `food_preferences` - Food preferences
- `stay_preferences` - Stay preferences
- `sightseeing` - Sightseeing preferences
- `permissions` - Required permissions/documents
- `special_requests` - Special requests
- `created_at` - Timestamp

## Development

The application uses:
- **Vite** for fast frontend development with HMR (Hot Module Replacement)
- **Express** for the REST API backend
- **SQLite3** for lightweight database storage

## License

ISC

