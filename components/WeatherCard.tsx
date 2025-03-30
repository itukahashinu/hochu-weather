// src/components/WeatherCard.tsx
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Thermometer } from "lucide-react";
import { WeatherData } from "@/types/weather";

// 日本時間 (JST) に変換する関数
const formatJST = (timestamp: string | number | null | undefined, timeOnly: boolean = false): string => {
  // 無効な値の場合、デフォルトで "N/A" を返す
  if (!timestamp) return "N/A";

  let date: Date;
  try {
    if (typeof timestamp === "string") {
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp * 1000); // UNIXタイムスタンプの場合
    }

    // Dateオブジェクトが無効か確認
    if (isNaN(date.getTime())) return "N/A";

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
  } catch (error) {
    console.error("Invalid timestamp:", timestamp, error);
    return "N/A";
  }
};

// 風向きを矢印で表示する関数
const getWindDirection = (deg: number) => {
  const directions = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
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

// 数値のフォーマット関数
const formatNumber = (value: number | null, precision: number = 1, unit: string = ""): string => {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(precision)}${unit}`;
};

const WeatherCard = ({ data }: { data: WeatherData }) => {
  if (!data?.cities) {
    return (
      <div className="flex-shrink-0 w-[400px] bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border-2 border-zinc-800 transition-colors duration-300 hover:shadow-blue-900/20 hover:border-zinc-700 snap-center select-none">
        <div className="p-6">
          <div className="text-center text-gray-500">データがありません</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 w-[400px] bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border-2 border-zinc-800 transition-colors duration-300 hover:shadow-blue-900/20 hover:border-zinc-700 snap-center select-none">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
          <h2 className="text-2xl font-bold text-white">{data.name}</h2>
          <div className="flex items-center bg-zinc-800/50 px-3 py-1 rounded-lg">
            {getWeatherIcon(data.weather_main)}
            <span className="ml-2 text-gray-300">{data.weather_description}</span>
          </div>
        </div>

        <div className="mb-6 bg-zinc-800/30 rounded-lg p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-5xl font-bold text-white tracking-tight">
                {formatNumber(data.temp, 1, "°C")}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                体感: {formatNumber(data.feels_like, 1, "°C")}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end mb-2">
                <Thermometer className="w-5 h-5 text-blue-400 mr-2" />
                <span className="text-gray-300">{formatNumber(data.temp_min, 1, "°C")}</span>
              </div>
              <div className="flex items-center justify-end">
                <Thermometer className="w-5 h-5 text-red-400 mr-2" />
                <span className="text-gray-300">{formatNumber(data.temp_max, 1, "°C")}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4">
            <div className="flex items-center">
              <Droplets className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-gray-300">{formatNumber(data.humidity, 0, "%")}</span>
            </div>
            <div className="flex items-center">
              <Wind className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-gray-300">{formatNumber(data.wind_speed, 1, "m/s")}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between bg-zinc-800/20 p-2 rounded">
              <span className="text-gray-400">日の出</span>
              <span className="text-gray-300">{formatJST(data.sunrise, true)}</span>
            </div>
            <div className="flex justify-between bg-zinc-800/20 p-2 rounded">
              <span className="text-gray-400">日の入</span>
              <span className="text-gray-300">{formatJST(data.sunset, true)}</span>
            </div>
            <div className="flex justify-between bg-zinc-800/20 p-2 rounded">
              <span className="text-gray-400">風向</span>
              <span className="text-gray-300">
                {data.wind_deg ? `${getWindDirection(data.wind_deg)} (${data.wind_deg}°)` : "N/A"}
              </span>
            </div>
            <div className="flex justify-between bg-zinc-800/20 p-2 rounded">
              <span className="text-gray-400">気圧</span>
              <span className="text-gray-300">{formatNumber(data.pressure, 0, "hPa")}</span>
            </div>
            <div className="flex justify-between bg-zinc-800/20 p-2 rounded">
              <span className="text-gray-400">雲量</span>
              <span className="text-gray-300">{formatNumber(data.cloudiness, 0, "%")}</span>
            </div>
            <div className="flex justify-between bg-zinc-800/20 p-2 rounded">
              <span className="text-gray-400">視程</span>
              <span className="text-gray-300">{formatNumber(data.visibility / 1000, 1, "km")}</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 text-right">
            最終更新: {formatJST(data.dt, true)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;