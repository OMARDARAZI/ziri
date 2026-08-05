const content = require('../../repositories/content.repository');
const { success } = require('../../utils/apiResponse');

async function getLiveSidonWeather() {
  try {
    const response = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=33.5631&longitude=35.3689&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m'
    );
    if (!response.ok) return null;
    const data = await response.json();
    const current = data.current;
    if (!current) return null;

    const code = current.weather_code;
    let condition = 'Sunny';
    let description = 'Clear skies with a coastal breeze.';
    let icon = 'sun';

    if (code === 0) {
      condition = 'Sunny';
      description = 'Clear skies and warm sunshine.';
    } else if (code >= 1 && code <= 3) {
      condition = 'Partly Cloudy';
      description = 'Partly cloudy with coastal breeze.';
      icon = 'cloud-sun';
    } else if (code >= 45 && code <= 48) {
      condition = 'Foggy';
      description = 'Coastal mist and fog.';
      icon = 'cloud';
    } else if (code >= 51 && code <= 67) {
      condition = 'Rainy';
      description = 'Light coastal rain showers.';
      icon = 'cloud-rain';
    } else if (code >= 80 && code <= 82) {
      condition = 'Showers';
      description = 'Passing rain showers.';
      icon = 'cloud-rain';
    } else if (code >= 95) {
      condition = 'Thunderstorm';
      description = 'Thunderstorms with heavy rain.';
      icon = 'cloud-lightning';
    }

    return {
      id: 1,
      location: 'Sidon, Lebanon',
      temperature: Math.round(current.temperature_2m),
      condition: condition,
      description: description,
      humidity: Math.round(current.relative_humidity_2m),
      wind_speed: Math.round(current.wind_speed_10m),
      icon: icon,
      weather_date: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error fetching live Sidon weather:', err.message);
    return null;
  }
}

async function home(_req, res) {
  const [stories, news, events, safetyTips, dbWeather, liveWeather] = await Promise.all([
    content.list('stories', { limit: 20 }),
    content.list('news', { limit: 10 }),
    content.list('events', { limit: 10 }),
    content.list('safetyTips', { limit: 20 }),
    content.list('weather', { limit: 1 }),
    getLiveSidonWeather()
  ]);

  const finalWeather = liveWeather || (dbWeather.items[0] ? { ...dbWeather.items[0], location: 'Sidon, Lebanon' } : {
    id: 1,
    location: 'Sidon, Lebanon',
    temperature: 28,
    condition: 'Sunny',
    description: 'Clear skies with coastal breeze',
    humidity: 62,
    wind_speed: 12,
    icon: 'sun'
  });

  success(res, {
    stories: stories.items,
    news: news.items,
    events: events.items.filter((event) => new Date(event.event_date) >= new Date(new Date().toDateString())),
    safety_tips: safetyTips.items,
    weather: finalWeather
  });
}

module.exports = { home };
