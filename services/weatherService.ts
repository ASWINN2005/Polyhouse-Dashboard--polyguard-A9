import { WeatherData } from '../types';

// Map WMO Weather codes to our 4 condition types
function mapWmoToCondition(code: number): 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy' {
  if (code === 0 || code === 1) return 'Sunny';
  if (code === 2 || code === 3) return 'Cloudy';
  if (code >= 45 && code <= 48) return 'Cloudy'; // Fog
  if (code >= 51 && code <= 67) return 'Rainy'; // Rain
  if (code >= 80 && code <= 82) return 'Rainy'; // Showers
  if (code >= 95) return 'Stormy'; // Thunderstorm
  return 'Cloudy'; // fallback
}

export const fetchLiveWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max&timezone=auto`
    );
    const data = await response.json();
    
    const current = data.current;
    let currentCond = mapWmoToCondition(current.weather_code);
    
    const daily = data.daily;
    const daysArr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const forecast = [];
    
    // Skip today (index 0), get next 3 days
    for (let i = 1; i <= 3; i++) {
        if (!daily.time[i]) break;
        const dateStr = daily.time[i];
        const dayOfWeek = daysArr[new Date(dateStr).getDay()];
        
        forecast.push({
            day: dayOfWeek,
            temp: Math.round(daily.temperature_2m_max[i]),
            condition: mapWmoToCondition(daily.weather_code[i])
        });
    }

    return {
      current: {
        temp: Math.round(current.temperature_2m),
        condition: currentCond,
        humidity: Math.round(current.relative_humidity_2m),
        windSpeed: Math.round(current.wind_speed_10m)
      },
      forecast
    };
  } catch (error) {
    console.error("Error fetching live weather, falling back to mock:", error);
    return getMockWeather();
  }
};

const resolveIPWeather = async (resolve: (data: WeatherData) => void) => {
  try {
    const ipRes = await fetch('https://ipapi.co/json/');
    const ipData = await ipRes.json();
    if (ipData && ipData.latitude && ipData.longitude) {
      const weather = await fetchLiveWeather(ipData.latitude, ipData.longitude);
      resolve(weather);
    } else {
      resolve(getMockWeather());
    }
  } catch (e) {
    resolve(getMockWeather());
  }
};

export const fetchCoordinatesByCity = async (city: string): Promise<{ lat: number; lon: number; name: string } | null> => {
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const { latitude, longitude, name } = data.results[0];
      return { lat: latitude, lon: longitude, name };
    }
    return null;
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
};

export const getLocalWeather = async (city?: string): Promise<WeatherData> => {
  if (city) {
    const coords = await fetchCoordinatesByCity(city);
    if (coords) {
      return fetchLiveWeather(coords.lat, coords.lon);
    }
  }

  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolveIPWeather(resolve);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const weather = await fetchLiveWeather(pos.coords.latitude, pos.coords.longitude);
        resolve(weather);
      },
      (err) => {
        console.warn("Geolocation denied/failed. Falling back to IP-based location.");
        resolveIPWeather(resolve);
      },
      { timeout: 5000 }
    );
  });
};

export const getMockWeather = (): WeatherData => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayIndex = new Date().getDay();

  return {
    current: {
      temp: 28,
      condition: 'Sunny',
      humidity: 45,
      windSpeed: 12
    },
    forecast: [
      {
        day: days[(todayIndex + 1) % 7],
        temp: 26,
        condition: 'Cloudy'
      },
      {
        day: days[(todayIndex + 2) % 7],
        temp: 24,
        condition: 'Rainy'
      },
      {
        day: days[(todayIndex + 3) % 7],
        temp: 29,
        condition: 'Sunny'
      }
    ]
  };
};
