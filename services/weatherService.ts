
import { WeatherData } from '../types';

export const getMockWeather = (): WeatherData => {
  const conditions: Array<'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy'> = ['Sunny', 'Cloudy', 'Rainy', 'Sunny', 'Sunny'];
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
