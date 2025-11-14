import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const GEO_API_URL = process.env.GEODB_API_URL;
const GEO_API_KEY = process.env.GEODB_API_KEY;
const GEOPIFY_API_KEY = process.env.GEOPIFY_API_KEY;

/**
 * 🌍 Smart Location Suggestions
 * 1️⃣ Try Geoapify (address + city + state)
 * 2️⃣ If empty, fallback to GeoDB (city-level)
 */
export const getLocationSuggestions = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: MESSAGES.LOCATION.QUERY_TOO_SHORT });
    }

    // 1️⃣ Try Geoapify first
    const geoapifyUrl = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
      query
    )}&limit=7&apiKey=${GEOPIFY_API_KEY}`;

    const geoapifyRes = await axios.get(geoapifyUrl);
    const geoapifyData = geoapifyRes.data?.features || [];

    if (geoapifyData.length > 0) {
      const formattedResults = geoapifyData.map((item) => {
        const p = item.properties;
        return {
          id: p.place_id,
          source: "geoapify",
          name: p.name || p.address_line1 || p.formatted,
          formatted: p.formatted,
          city: p.city || p.town || p.village || "",
          state: p.state || "",
          country: p.country || "",
          postcode: p.postcode || "",
          latitude: p.lat,
          longitude: p.lon,
        };
      });
      return res.status(200).json(formattedResults);
    }

    // 2️⃣ Fallback: GeoDB (for cities only)
    const geodbOptions = {
      method: "GET",
      url: GEO_API_URL,
      params: { namePrefix: query, limit: 7 },
      headers: {
        "X-RapidAPI-Key": GEO_API_KEY,
        "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
      },
    };

    const geodbRes = await axios.request(geodbOptions);
    const geodbData = geodbRes.data?.data || [];

    const fallbackResults = geodbData.map((city) => ({
      id: city.id,
      source: "geodb",
      name: city.city,
      formatted: `${city.city}, ${city.region}, ${city.country}`,
      city: city.city,
      state: city.region,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
    }));

    res.status(200).json(fallbackResults);
  } catch (error) {
    console.error("Location Suggestion Error:", error.message);
    res.status(500).json({ message: MESSAGES.LOCATION.FETCH_SUGGESTIONS_FAILED });
  }
};

/**
 * 📍 Reverse Geocoding: Get current location from lat/lon
 */
export const getCurrentLocation = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ message: MESSAGES.LOCATION.LAT_LON_REQUIRED });
    }

    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${GEOPIFY_API_KEY}`;
    const response = await axios.get(url);

    const location = response.data?.features?.[0]?.properties;
    if (!location) {
      return res.status(404).json({ message: MESSAGES.LOCATION.LOCATION_NOT_FOUND });
    }

    const result = {
      formatted: location.formatted,
      city: location.city || location.town || location.village || "",
      state: location.state || "",
      country: location.country || "",
      postcode: location.postcode || "",
      latitude: lat,
      longitude: lon,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("Geoapify Reverse Error:", error.message);
    res.status(500).json({ message: MESSAGES.LOCATION.FETCH_CURRENT_FAILED });
  }
};