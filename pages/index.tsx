// /pages/index.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Head from "next/head";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Thermometer } from "lucide-react";

// 天気データの型定義
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

// 日本時間 (JST) に変換する関数
const formatJST = (utcDateString: string, timeOnly: boolean = false) => {
    const date = new Date(utcDateString + "Z"); // UTCとして解釈
    const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Tokyo",
        hour: "2-digit",
        minute: "2-digit",
    };
    if (!timeOnly) {
        options.year = "numeric";
        options.month = "2-digit";
        options.day = "2-digit";
    }
    return new Intl.DateTimeFormat("ja-JP", options).format(date);
};

// 天気アイコンを選択する関数
const getWeatherIcon = (weatherMain: string) => {
    switch (weatherMain.toLowerCase()) {
        case "clear":
            return <Sun className="w-8 h-8 text-yellow-400" />;
        case "clouds":
            return <Cloud className="w-8 h-8 text-gray-400" />;
        case "rain":
        case "drizzle":
            return <CloudRain className="w-8 h-8 text-blue-400" />;
        case "snow":
            return <CloudSnow className="w-8 h-8 text-blue-200" />;
        case "thunderstorm":
            return <CloudLightning className="w-8 h-8 text-yellow-500" />;
        default:
            return <Cloud className="w-8 h-8 text-gray-400" />;
    }
};

// 風向きを矢印で表示する関数
const getWindDirection = (deg: number) => {
    const directions = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
};

const WeatherCard = ({ data }: { data: WeatherData }) => {
    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700">
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">{data.cities.name}</h2>
                    <div className="flex items-center">
                        {getWeatherIcon(data.weather_main)}
                        <span className="ml-2 text-gray-300">{data.weather_main}</span>
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row justify-between mb-6">
                    <div className="text-center md:text-left mb-4 md:mb-0">
                        <div className="text-4xl font-bold text-white">{data.temp.toFixed(1)}°C</div>
                        <div className="text-sm text-gray-400">体感: {data.feels_like.toFixed(1)}°C</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center">
                            <Thermometer className="w-5 h-5 text-blue-400 mr-2" />
                            <span className="text-gray-300">{data.temp_min.toFixed(1)}°C</span>
                        </div>
                        <div className="flex items-center">
                            <Thermometer className="w-5 h-5 text-red-400 mr-2" />
                            <span className="text-gray-300">{data.temp_max.toFixed(1)}°C</span>
                        </div>
                        <div className="flex items-center">
                            <Droplets className="w-5 h-5 text-blue-400 mr-2" />
                            <span className="text-gray-300">{data.humidity}%</span>
                        </div>
                        <div className="flex items-center">
                            <Wind className="w-5 h-5 text-gray-400 mr-2" />
                            <span className="text-gray-300">{data.wind_speed}m/s</span>
                        </div>
                    </div>
                </div>
                
                <div className="border-t border-gray-700 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">日の出</span>
                            <span className="text-gray-300">{formatJST(data.sunrise, true)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">日の入</span>
                            <span className="text-gray-300">{formatJST(data.sunset, true)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">風向</span>
                            <span className="text-gray-300">{getWindDirection(data.wind_deg)} ({data.wind_deg}°)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">気圧</span>
                            <span className="text-gray-300">{data.pressure}hPa</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">雲量</span>
                            <span className="text-gray-300">{data.cloudiness}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">視程</span>
                            <span className="text-gray-300">{(data.visibility / 1000).toFixed(1)}km</span>
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-500 text-right">
                        最終更新: {formatJST(data.recorded_at)}
                    </div>
                </div>
            </div>
        </div>
    );
};

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
        <div className="min-h-screen bg-gray-900 text-white">
            <Head>
                <title>Hochu Weather App</title>
                <meta name="description" content="リアルタイム天気情報アプリ" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            
            <header className="bg-gray-800 shadow-md">
                <div className="container mx-auto py-6 px-4">
                    <h1 className="text-3xl font-bold text-center">
                        <span className="text-blue-400">Hochu</span> Weather App
                    </h1>
                </div>
            </header>
            
            <main className="container mx-auto py-8 px-4">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
                    </div>
                ) : weatherData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {weatherData.map((data) => (
                            <WeatherCard key={data.city_id} data={data} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-xl text-gray-400">天気データがありません</p>
                    </div>
                )}
            </main>
            
            <footer className="bg-gray-800 py-6 text-center text-gray-400 text-sm mt-auto">
                <div className="container mx-auto px-4">
                    <p>© {new Date().getFullYear()} Hochu Weather App</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;