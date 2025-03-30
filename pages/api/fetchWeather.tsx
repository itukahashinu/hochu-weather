// pages/api/fetchWeather.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

interface OpenWeatherResponse {
  weather: [{
    id: number;
    main: string;
    description: string;
    icon: string;
  }];
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
  };
  clouds: {
    all: number;
  };
  sys: {
    sunrise: number;
    sunset: number;
    country: string;
  };
  dt: number;
  name: string;
}

async function fetchWeatherData(lat: number, lon: number): Promise<OpenWeatherResponse> {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
  );
  if (!response.ok) throw new Error(`Failed to fetch weather data: ${response.statusText}`);
  return response.json() as Promise<OpenWeatherResponse>;
}

async function updateWeatherData(weatherData: OpenWeatherResponse, cityId: number) {
  const now = new Date().toISOString();
  const payload = {
    city_id: cityId,
    recorded_at: now,
    name: weatherData.name,
    temp: weatherData.main.temp,
    feels_like: weatherData.main.feels_like,
    temp_min: weatherData.main.temp_min,
    temp_max: weatherData.main.temp_max,
    pressure: weatherData.main.pressure,
    humidity: weatherData.main.humidity,
    wind_speed: weatherData.wind.speed,
    wind_deg: weatherData.wind.deg,
    cloudiness: weatherData.clouds.all,
    visibility: weatherData.visibility,
    weather_main: weatherData.weather[0].main,
    weather_description: weatherData.weather[0].description,
    weather_icon: weatherData.weather[0].icon,
    sunrise: new Date(weatherData.sys.sunrise * 1000).toISOString(),
    sunset: new Date(weatherData.sys.sunset * 1000).toISOString(),
    country: weatherData.sys.country,
    dt: weatherData.dt,
  };

  const { error } = await supabase
    .from("weather_data")
    .upsert([payload], { onConflict: "city_id,recorded_at" });

  if (error) throw new Error(`Supabase upsert error: ${error.message}`);
  console.log(`Saved weather data for city_id: ${cityId}`, payload);
}

async function cleanupOldWeatherData() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { error } = await supabase
    .from("weather_data")
    .delete()
    .lt("recorded_at", oneWeekAgo.toISOString());

  if (error) throw new Error(`Supabase cleanup error: ${error.message}`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // cities テーブルから全都市を取得
    const { data: cities, error: citiesError } = await supabase
      .from("cities")
      .select("id, name, latitude, longitude");

    if (citiesError) throw new Error(`Supabase cities fetch error: ${citiesError.message}`);
    if (!cities?.length) {
      return res.status(404).json({ message: "No cities found in cities table" });
    }

    console.log(`Found ${cities.length} cities in the database`);

    // 各都市の天気データを取得して保存
    await Promise.all(
      cities.map(async (city) => {
        const weather = await fetchWeatherData(city.latitude, city.longitude);
        await updateWeatherData(weather, city.id);
      })
    );

    // 古いデータをクリーンアップ
    await cleanupOldWeatherData();

    res.status(200).json({ message: `Weather data updated successfully for ${cities.length} cities` });
  } catch (error) {
    console.error("Fetch weather error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}