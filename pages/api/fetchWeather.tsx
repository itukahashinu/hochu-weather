import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

interface WeatherData {
    coord: { lon: number; lat: number };
    weather: { id: number; main: string; description: string; icon: string }[];
    main: {
        temp: number;
        feels_like: number;
        temp_min: number;
        temp_max: number;
        pressure: number;
        humidity: number;
    };
    visibility: number;
    wind: { speed: number; deg: number };
    clouds: { all: number };
    sys: {
        sunrise: number;
        sunset: number;
        country: string;
    };
    timezone: number;
    name: string;
}

const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData | null> => {
    try {
        console.log(`Fetching weather for lat:${lat}, lon:${lon}`);
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
        );
        if (!response.ok) {
            throw new Error(`Failed to fetch weather data: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`Weather data fetched for ${data.name}:`, data);
        return data as WeatherData;
    } catch (error) {
        console.error(`Error fetching weather data for lat:${lat}, lon:${lon}`, error);
        return null;
    }
};

const insertWeatherDataToSupabase = async (weatherData: WeatherData, cityId: number) => {
    const payload = {
        city_id: cityId,
        recorded_at: new Date().toISOString(),
        temp: Math.min(Math.max(weatherData.main.temp, -999.99), 999.99),
        feels_like: Math.min(Math.max(weatherData.main.feels_like, -999.99), 999.99),
        temp_min: Math.min(Math.max(weatherData.main.temp_min, -999.99), 999.99),
        temp_max: Math.min(Math.max(weatherData.main.temp_max, -999.99), 999.99),
        pressure: weatherData.main.pressure,
        humidity: weatherData.main.humidity,
        wind_speed: Math.min(Math.max(weatherData.wind.speed, -999.99), 999.99),
        wind_deg: weatherData.wind.deg,
        cloudiness: weatherData.clouds.all,
        visibility: weatherData.visibility,
        weather_main: weatherData.weather[0].main,
        sunrise: new Date(weatherData.sys.sunrise * 1000).toISOString(),
        sunset: new Date(weatherData.sys.sunset * 1000).toISOString(),
    };

    console.log(`Inserting data for city_id:${cityId}`, payload);

    const { data: existing, error: selectError } = await supabase
        .from("weather_data")
        .select("id")
        .eq("city_id", cityId)
        .eq("recorded_at", payload.recorded_at);

    if (selectError) {
        console.error(`Select error for city_id:${cityId}`, selectError);
        return;
    }

    const result = existing && existing.length > 0
        ? await supabase
              .from("weather_data")
              .update(payload)
              .eq("city_id", cityId)
              .eq("recorded_at", payload.recorded_at)
        : await supabase.from("weather_data").insert([payload]);

    if (result.error) {
        console.error(`Supabase error for city_id:${cityId}`, result.error);
    } else {
        console.log(`Weather data processed for city_id:${cityId}`);
    }
};

/**
 * 1週間以上経過した気象データをSupabaseから削除する関数
 * @returns 削除されたレコード数
 */
const cleanupOldWeatherData = async (): Promise<number> => {
    try {
        console.log("Cleaning up old weather data...");
        
        // 1週間前の日時を計算
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const cutoffDate = oneWeekAgo.toISOString();
        
        console.log(`Deleting weather data older than: ${cutoffDate}`);
        
        // recorded_atがcutoffDateより古いレコードを削除
        const { data, error, count } = await supabase
            .from("weather_data")
            .delete({ count: "exact" })
            .lt("recorded_at", cutoffDate);
            
        if (error) {
            throw new Error(`Failed to delete old weather data: ${error.message}`);
        }
        
        console.log(`Successfully deleted ${count} old weather records`);
        return count || 0;
    } catch (error) {
        console.error("Error cleaning up old weather data:", error);
        return 0;
    }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        console.log("Fetching cities from Supabase...");
        const { data: cities, error: citiesError } = await supabase
            .from("cities")
            .select("id, latitude, longitude");

        if (citiesError) {
            throw new Error(`Failed to fetch cities: ${citiesError.message}`);
        }

        console.log("Cities fetched:", cities);

        if (!cities || cities.length === 0) {
            return res.status(404).json({ message: "No cities found" });
        }

        const requests = cities.map(async (city) => {
            const weather = await fetchWeatherData(city.latitude, city.longitude);
            if (weather) {
                await insertWeatherDataToSupabase(weather, city.id);
            }
        });

        await Promise.all(requests);
        
        // 古いデータのクリーンアップを実行
        const deletedCount = await cleanupOldWeatherData();
        
        res.status(200).json({ 
            message: "Weather data fetched and stored successfully", 
            maintenance: `${deletedCount} old records cleaned up`
        });
    } catch (error) {
        console.error("Error in weather API:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}