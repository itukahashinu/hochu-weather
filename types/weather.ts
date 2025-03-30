// types/weather.ts
export interface WeatherData {
  city_id: number;
  recorded_at: string;
  name: string;
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  cloudiness: number;
  visibility: number;
  weather_main: string;
  weather_description: string;
  weather_icon: string;
  sunrise: string;
  sunset: string;
  country: string;
  dt: number;
  cities: {
    name: string;
    latitude: number;
    longitude: number;
  };
}