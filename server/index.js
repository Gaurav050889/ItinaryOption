const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize SQLite database
const dbPath = path.join(__dirname, 'itinerary.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    // Create table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS itineraries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      destinations TEXT NOT NULL,
      budget REAL NOT NULL,
      days INTEGER NOT NULL,
      food_preferences TEXT,
      stay_preferences TEXT,
      sightseeing TEXT,
      permissions TEXT,
      special_requests TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Database table ready');
      }
    });
  }
});

const USER_AGENT = 'TravelItineraryPlanner/1.0 (contact@itineraryplanner.local)';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const WIKI_GEOSEARCH_URL = 'https://en.wikipedia.org/w/api.php';

const normalizeDestinations = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter(Boolean);
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }
  return [];
};

const curatedCatalog = {
  singapore: {
    currency: 'SGD',
    usdRate: 0.74,
    attractions: [
      {
        title: 'Gardens by the Bay (Flower Dome + Cloud Forest)',
        priceLocal: 28,
        duration: '2-3 hrs',
        category: 'Nature & Architecture',
        description: 'Supertree Grove light show, indoor waterfalls, and biodomes.',
        bookingUrl: 'https://www.gardensbythebay.com.sg',
      },
      {
        title: 'Marina Bay Sands SkyPark Observation Deck',
        priceLocal: 32,
        duration: '1 hr',
        category: 'Skyline View',
        description: 'Panoramic views of the bay and city skyline from 57 floors up.',
        bookingUrl: 'https://www.marinabaysands.com',
      },
      {
        title: 'Universal Studios Singapore (Day Pass)',
        priceLocal: 81,
        duration: 'Full day',
        category: 'Theme Park',
        description: 'Movie-themed rides and shows on Sentosa Island.',
        bookingUrl: 'https://www.rwsentosa.com',
      },
      {
        title: 'Singapore Flyer',
        priceLocal: 40,
        duration: '40 min',
        category: 'Observation Wheel',
        description: 'Giant observation wheel offering sunset and night views.',
        bookingUrl: 'https://www.singaporeflyer.com',
      },
      {
        title: 'Night Safari (Tram Ride + Walking Trails)',
        priceLocal: 55,
        duration: '3-4 hrs',
        category: 'Wildlife',
        description: 'Nocturnal zoo experience with guided tram ride.',
        bookingUrl: 'https://www.mandai.com/en/night-safari.html',
      },
    ],
  },
  bangkok: {
    currency: 'THB',
    usdRate: 0.027,
    attractions: [
      {
        title: 'Grand Palace & Emerald Buddha Guided Entry',
        priceLocal: 500,
        duration: '2 hrs',
        category: 'Heritage',
        description: 'Skip-the-line access with local historian.',
        bookingUrl: 'https://www.royalgrandpalace.th',
      },
      {
        title: 'Chao Phraya Dinner Cruise',
        priceLocal: 1350,
        duration: '2 hrs',
        category: 'Dining Cruise',
        description: 'Buffet dinner with live music and skyline views.',
        bookingUrl: 'https://www.asiatiquethailand.com',
      },
      {
        title: 'Damnoen Saduak Floating Market + Maeklong Railway',
        priceLocal: 950,
        duration: '5 hrs',
        category: 'Excursion',
        description: 'Shared transport with English-speaking guide.',
        bookingUrl: 'https://www.tourismthailand.org',
      },
      {
        title: 'Thai Cooking Class & Market Visit',
        priceLocal: 1200,
        duration: '4 hrs',
        category: 'Food Experience',
        description: 'Hands-on class capped at 10 guests.',
        bookingUrl: 'https://www.bangkokthaicooking.com',
      },
      {
        title: 'ICONSIAM Observation Deck',
        priceLocal: 250,
        duration: '1 hr',
        category: 'Skyline View',
        description: 'Sunset access to one of Bangkok’s newest riverfront icons.',
        bookingUrl: 'https://www.iconsiam.com',
      },
    ],
  },
};

const normalizeKey = (value = '') =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+(city|town|country|state)$/g, '')
    .trim();

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
};

const fetchGeoData = async (destination) => {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('q', destination);

  const data = await fetchJson(url, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!Array.isArray(data) || !data.length) {
    return null;
  }

  const place = data[0];
  const lat = Number(place.lat);
  const lon = Number(place.lon);

  return {
    displayName: place.display_name,
    country: place.address?.country || 'Unknown',
    coordinates: { lat, lon },
    mapUrl: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=11/${lat}/${lon}`,
  };
};

const fetchNearbyAttractions = async (lat, lon, limit = 6) => {
  const url = new URL(WIKI_GEOSEARCH_URL);
  url.searchParams.set('action', 'query');
  url.searchParams.set('list', 'geosearch');
  url.searchParams.set('gscoord', `${lat}|${lon}`);
  url.searchParams.set('gsradius', '15000');
  url.searchParams.set('gslimit', String(limit));
  url.searchParams.set('format', 'json');

  const data = await fetchJson(url);
  const items = data?.query?.geosearch || [];

  return items.map((item) => ({
    title: item.title,
    distance: item.dist,
    pageId: item.pageid,
    pageUrl: `https://en.wikipedia.org/?curid=${item.pageid}`,
    priceLocal: null,
    priceUSD: null,
    currency: null,
    duration: null,
    category: 'Point of interest',
    description: null,
    source: 'wikipedia',
  }));
};

const mapCuratedAttractions = (entry) => {
  if (!entry) return [];
  return entry.attractions.map((attraction) => ({
    title: attraction.title,
    priceLocal: attraction.priceLocal,
    currency: entry.currency,
    priceUSD: Number((attraction.priceLocal * entry.usdRate).toFixed(0)),
    duration: attraction.duration,
    category: attraction.category,
    description: attraction.description,
    pageId: null,
    pageUrl: attraction.bookingUrl,
    distance: null,
    source: 'curated',
  }));
};

const buildGenericFallbackAttractions = (destinationLabel, country) => {
  const label = destinationLabel || 'Destination';
  return [
    {
      title: `${label} City Highlights Tour`,
      priceUSD: 120,
      currency: 'USD',
      priceLocal: null,
      duration: 'Half day',
      category: 'Guided Tour',
      description: `Small-group orientation covering the must-see neighborhoods of ${label}.`,
      pageUrl: null,
      pageId: null,
      distance: null,
      source: 'generated',
    },
    {
      title: `${label} Street Food Crawl`,
      priceUSD: 55,
      currency: 'USD',
      priceLocal: null,
      duration: '3 hrs',
      category: 'Food Experience',
      description: `Taste local favorites with a foodie host in ${country || 'the city'}.`,
      pageUrl: null,
      pageId: null,
      distance: null,
      source: 'generated',
    },
    {
      title: `${label} Cultural Evening`,
      priceUSD: 80,
      currency: 'USD',
      priceLocal: null,
      duration: 'Evening',
      category: 'Cultural Show',
      description: 'Performance tickets plus transfers from city center hotels.',
      pageUrl: null,
      pageId: null,
      distance: null,
      source: 'generated',
    },
  ];
};

const buildSuggestions = async (destinations = [], days = 0, budget = 0) => {
  const normalized = normalizeDestinations(destinations);
  if (!normalized.length) {
    return [];
  }

  const results = await Promise.all(
    normalized.map(async (destination) => {
      try {
        const geo = await fetchGeoData(destination);
        if (!geo) {
          return {
            destinationLabel: destination,
            status: 'not_found',
            message: 'Sorry, location not found. Please verify the spelling.',
          };
        }

        const destinationLabel = destination;
        const destinationKey = normalizeKey(destinationLabel || geo.displayName);
        const curatedEntry = curatedCatalog[destinationKey];
        const curatedAttractions = mapCuratedAttractions(curatedEntry);
        let attractions = curatedAttractions;

        if (!curatedAttractions.length) {
          const live = await fetchNearbyAttractions(geo.coordinates.lat, geo.coordinates.lon, 8);
          attractions = live.length ? live : buildGenericFallbackAttractions(destinationLabel, geo.country);
        } else {
          const supplemental = await fetchNearbyAttractions(geo.coordinates.lat, geo.coordinates.lon, 3);
          const supplementalFiltered = supplemental.filter(
            (item) => !curatedAttractions.some((curated) => curated.title === item.title)
          );
          const fallbackIfNone = supplementalFiltered.length
            ? supplementalFiltered
            : buildGenericFallbackAttractions(destinationLabel, geo.country);
          attractions = [...curatedAttractions, ...fallbackIfNone];
        }

        return {
          destinationLabel: destination,
          status: 'ok',
          exactName: geo.displayName,
          country: geo.country,
          coordinates: geo.coordinates,
          mapUrl: geo.mapUrl,
          perDayBudget: days ? Number(((budget || 0) / days).toFixed(0)) : null,
          currency: curatedEntry?.currency || 'USD',
          curated: Boolean(curatedAttractions.length),
          attractions,
          notes: attractions.length ? null : 'No notable attractions found within 15 km.',
        };
      } catch (error) {
        console.error(`Suggestion lookup failed for ${destination}:`, error.message);
        return {
          destinationLabel: destination,
          status: 'error',
          message: 'We hit a snag fetching this location. Please try again later.',
        };
      }
    })
  );

  return results;
};

const insertItinerary = (payload) =>
  new Promise((resolve, reject) => {
    const sql = `INSERT INTO itineraries 
      (name, email, phone, destinations, budget, days, food_preferences, stay_preferences, sightseeing, permissions, special_requests)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, payload, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Submit itinerary request
app.post('/api/itinerary', async (req, res) => {
  const {
    name,
    email,
    phone,
    destinations,
    budget,
    days,
    foodPreferences,
    stayPreferences,
    sightseeing,
    permissions,
    specialRequests
  } = req.body;

  // Validation
  if (!name || !email || !destinations || !budget || !days) {
    return res.status(400).json({
      error: 'Missing required fields: name, email, destinations, budget, and days are required'
    });
  }

  let suggestions = [];
  try {
    suggestions = await buildSuggestions(destinations, days, budget);
  } catch (error) {
    console.error('Suggestion builder failed:', error.message);
  }

  try {
    const lastID = await insertItinerary([
      name,
      email,
      phone || null,
      Array.isArray(destinations) ? destinations.join(', ') : destinations,
      budget,
      days,
      foodPreferences || null,
      stayPreferences || null,
      sightseeing || null,
      permissions || null,
      specialRequests || null
    ]);

    res.json({
      success: true,
      message: 'Itinerary request submitted successfully',
      id: lastID,
      suggestions,
    });
  } catch (err) {
    console.error('Error inserting itinerary:', err.message);
    res.status(500).json({ error: 'Failed to save itinerary request' });
  }
});

// Get all itineraries (for admin/viewing purposes)
app.get('/api/itineraries', (req, res) => {
  db.all('SELECT * FROM itineraries ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching itineraries:', err.message);
      return res.status(500).json({ error: 'Failed to fetch itineraries' });
    }
    res.json(rows);
  });
});

// Get single itinerary by ID
app.get('/api/itinerary/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM itineraries WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching itinerary:', err.message);
      return res.status(500).json({ error: 'Failed to fetch itinerary' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }
    res.json(row);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

