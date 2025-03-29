import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Head from "next/head";
import WeatherCard from "@/components/WeatherCard";

interface WeatherData {
    city_id: number;
    recorded_at: string;
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
    sunrise: string;
    sunset: string;
    cities: { name: string; latitude: number; longitude: number };
}

const Home = () => {
    const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // 最新の天気データを取得
    const fetchLatestWeatherData = async () => {
        try {
            const { data, error } = await supabase
                .from("weather_data")
                .select("*, cities (name, latitude, longitude)")
                .order("recorded_at", { ascending: false });

            if (error) throw new Error(`Failed to fetch: ${error.message}`);

            // 各都市の最新データを抽出
            const latestData = Object.values(
                data.reduce((acc: { [key: number]: WeatherData }, item) => {
                    if (!acc[item.city_id] || item.recorded_at > acc[item.city_id].recorded_at) {
                        acc[item.city_id] = item;
                    }
                    return acc;
                }, {})
            ) as WeatherData[];

            setWeatherData(latestData);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLatestWeatherData();
        
        // 10分ごとに自動更新
        const interval = setInterval(fetchLatestWeatherData, 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-black text-white">
            <Head>
                <title>Hochu Weather App</title>
                <meta name="description" content="リアルタイム天気情報アプリ" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            
            <header className="bg-zinc-900/50 backdrop-blur-sm shadow-lg border-b border-zinc-800/50">
                <div className="container mx-auto py-6 px-4">
                    <h1 className="text-3xl font-bold text-center">
                        <span className="text-blue-400">Hochu</span> Weather App
                    </h1>
                </div>
            </header>
            
            <main className="py-8">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
                    </div>
                ) : weatherData.length > 0 ? (
                    <div className="flex overflow-x-auto space-x-6 pb-6 px-6 snap-x snap-mandatory scroll-smooth hide-scrollbar">
                        <div className="pl-[max(2rem,calc((100vw-1280px)/2))]" />
                        {weatherData.map((data) => (
                            <WeatherCard key={data.city_id} data={data} />
                        ))}
                        <div className="pr-[max(2rem,calc((100vw-1280px)/2))]" />
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-xl text-gray-400">天気データがありません</p>
                    </div>
                )}
            </main>
            
            <footer className="bg-zinc-900/50 backdrop-blur-sm py-6 text-center text-gray-400 text-sm mt-auto border-t border-zinc-800/50">
                <div className="container mx-auto px-4">
                    <p>© {new Date().getFullYear()} Hochu Weather App</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
