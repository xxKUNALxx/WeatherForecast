import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, Wind, Droplets, 
  Eye, Umbrella, Thermometer, Clock, Calendar, Search, MapPin, Sunrise, Sunset,
  ChevronRight, RefreshCcw, AlertTriangle, Moon, BarChart
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';

// Replace with your API key or move to environment variables in production
const API_KEY = '111cd0dfbd221dea9239e1a2a941b8ae';

export default function WeatherApp() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState({ hourly: [], daily: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [city, setCity] = useState('New York');
  const [searchInput, setSearchInput] = useState('');
  const [view, setView] = useState('hourly');
  const [units, setUnits] = useState('metric');
  const [refreshing, setRefreshing] = useState(false);
  const [tempRange, setTempRange] = useState({ min: 0, max: 0 });

  const temperatureUnit = units === 'metric' ? '°C' : '°F';
  const speedUnit = units === 'metric' ? 'm/s' : 'mph';

  useEffect(() => {
    fetchWeatherData();
  }, [city, units]);

  const fetchWeatherData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch current weather
      const currentRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${units}`
      );
      
      // Fetch forecast data
      const forecastRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=${units}`
      );

      // Store the initial weather data
      setWeather(currentRes.data);
      
      // Process hourly forecast (next 24 hours)
      const hourlyData = forecastRes.data.list.slice(0, 8).map(item => ({
        time: new Date(item.dt * 1000).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        }),
        temp: (item.main.temp),
        feels: (item.main.feels_like),
        humidity: item.main.humidity,
        description: item.weather[0].main,
        icon: item.weather[0].icon,
        pop: item.pop || 0, // Probability of precipitation
        wind: item.wind.speed,
        pressure: item.main.pressure
      }));
      
      // Filter forecasts for today to get accurate min/max
      const todaysHourlyForecasts = forecastRes.data.list.filter(item => {
        const itemDate = new Date(item.dt * 1000);
        const today = new Date();
        return itemDate.getDate() === today.getDate();
      });

      // Calculate actual min and max from today's hourly forecasts
      if (todaysHourlyForecasts.length > 0) {
        const todayTemps = todaysHourlyForecasts.map(item => item.main.temp);
        const realTempMin = Math.min(...todayTemps);
        const realTempMax = Math.max(...todayTemps);
        
        setTempRange({
          min: (realTempMin),
          max: (realTempMax),
        });
      } else {
        // Fallback to current weather min/max if no hourly data for today
        setTempRange({
          min: (currentRes.data.main.temp_min),
          max: (currentRes.data.main.temp_max),
        });
      }
      
      // Process daily forecast by grouping by day
      const processedDailyData = [];
      const dailyMap = {};
      
      forecastRes.data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayKey = date.toLocaleDateString('en-US');
        
        if (!dailyMap[dayKey]) {
          dailyMap[dayKey] = {
            day,
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            temps: [],
            humidity: [],
            descriptions: [],
            icons: [],
            pops: []
          };
        }
        
        dailyMap[dayKey].temps.push(item.main.temp);
        dailyMap[dayKey].humidity.push(item.main.humidity);
        dailyMap[dayKey].descriptions.push(item.weather[0].main);
        dailyMap[dayKey].icons.push(item.weather[0].icon);
        dailyMap[dayKey].pops.push(item.pop || 0);
      });


      console.log(weather)
      console.log(currentRes)
      // console.log(weather.wind.speed)

      
      // Calculate min/max temps and most common weather condition
      Object.values(dailyMap).forEach(day => {
        if (day.temps.length > 0) {
          processedDailyData.push({
            day: day.day,
            date: day.date,
            high:  (Math.max(...day.temps)),
            low:  (Math.min(...day.temps)),
            humidity:  (day.humidity.reduce((sum, val) => sum + val, 0) / day.humidity.length),
            // Get most frequent weather condition
            description: getMostFrequent(day.descriptions),
            icon: getMostFrequent(day.icons),
            pop: Math.max(...day.pops)
          });
        }
      });
      
      setForecast({ 
        hourly: hourlyData, 
        daily: processedDailyData.slice(0, 7) 
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching weather:", error);
      setError(`Could not fetch weather data for "${city}". Please check the city name and try again.`);
      setLoading(false);
    }
  };

  // Helper function to get most frequent item in array
  const getMostFrequent = (arr) => {
    return arr.sort((a, b) => 
      arr.filter(v => v === a).length - arr.filter(v => v === b).length
    ).pop();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setCity(searchInput);
      setSearchInput('');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWeatherData().finally(() => {
      setTimeout(() => setRefreshing(false), 500);
    });
  };

  // Get appropriate weather icon based on condition code
  const getWeatherIcon = (condition, iconCode) => {
    // Check if it's night (iconCode ends with 'n')
    const isNight = iconCode && iconCode.endsWith('n');
    
    // Default icon size
    const iconSize = 24;
    
    switch (condition?.toLowerCase()) {
      case 'thunderstorm':
        return <CloudLightning size={iconSize} className="text-yellow-500" />;
      case 'drizzle':
      case 'rain':
        return <CloudRain size={iconSize} className="text-blue-400" />;
      case 'snow':
        return <CloudSnow size={iconSize} className="text-blue-100" />;
      case 'mist':
      case 'smoke':
      case 'haze':
      case 'dust':
      case 'fog':
      case 'sand':
      case 'ash':
      case 'squall':
      case 'tornado':
        return <CloudFog size={iconSize} className="text-gray-400" />;
      case 'clear':
        return isNight 
          ? <Moon size={iconSize} className="text-blue-200" />
          : <Sun size={iconSize} className="text-yellow-400" />;
      case 'clouds':
        return <Cloud size={iconSize} className="text-gray-400" />;
      default:
        return <Cloud size={iconSize} className="text-gray-400" />;
    }
  };

  // Format timestamp to human-readable time
  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Calculate percentage for temperature range visualization
  const calculateTempPercentage = (temp, min, max) => {
    if (min === max) return 50; // Default to middle if range is 0
    const range = max - min;
    const position = temp - min;
    return Math.min(100, Math.max(0, (position / range) * 100));
  };

  if (loading && !weather) {
    return (
      
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="animate-pulse text-xl">Loading weather data...</div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-red-400 flex items-center gap-2 p-4 bg-gray-800 rounded-lg">
          <AlertTriangle />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <h1 className="text-2xl md:text-3xl font-bold">Weather Dashboard</h1>
          {refreshing ? (
            <RefreshCcw size={20} className="ml-3 animate-spin text-blue-400" />
          ) : (
            <RefreshCcw 
              size={20} 
              className="ml-3 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors"
              onClick={handleRefresh}
            />
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className="flex-grow">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search city..."
                className="bg-gray-800 px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-1 rounded-md"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </form>
          
          <select
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            className="bg-gray-800 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="metric">°C</option>
            <option value="imperial">°F</option>
          </select>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-200 p-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}
      
      {weather && (
        <>
          {/* Current Weather */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            {/* Main weather card */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg col-span-1 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Current Weather</h2>
                <span className="text-sm text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
              
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="text-6xl mr-6">
                    {getWeatherIcon(weather.weather[0].main, weather.weather[0].icon)}
                  </div>
                  <div>
                    <h3 className="text-4xl font-bold">{ (weather.main.temp)}{temperatureUnit}</h3>
                    <p className="text-gray-400 capitalize">{weather.weather[0].description}</p>
                    <p className="text-blue-400 flex items-center gap-1 mt-1">
                      <MapPin size={16} />
                      {weather.name}, {weather.sys.country}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <div className="flex items-center">
                    <Thermometer size={16} className="mr-2 text-red-400" />
                    <span className="text-sm">Feels: { (weather.main.feels_like)}{temperatureUnit}</span>
                  </div>
                  <div className="flex items-center">
                    <Wind size={16} className="mr-2 text-blue-300" />
                    <span className="text-sm">{(weather.wind.speed)} {speedUnit}</span>
                  </div>
                  <div className="flex items-center">
                    <Droplets size={16} className="mr-2 text-blue-400" />
                    <span className="text-sm">{weather.main.humidity}%</span>
                  </div>
                  <div className="flex items-center">
                    <Eye size={16} className="mr-2 text-gray-400" />
                    <span className="text-sm">{(weather.visibility / 1000).toFixed(1)} km</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Min-Max & Sunrise-Sunset */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Today's Range</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Min Temp</span>
                    <span className="font-semibold">{tempRange.min}{temperatureUnit}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-300 rounded-full" 
                      style={{ width: `${calculateTempPercentage(tempRange.min, tempRange.min - 5, tempRange.max + 5)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Max Temp</span>
                    <span className="font-semibold">{tempRange.max}{temperatureUnit}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full" 
                      style={{ width: `${calculateTempPercentage(tempRange.max, tempRange.min - 5, tempRange.max + 5)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="mt-2 pt-4 border-t border-gray-700">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Sunrise size={18} className="text-yellow-500 mr-2" />
                      <span>Sunrise</span>
                    </div>
                    <span>{formatTime(weather.sys.sunrise)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center">
                      <Sunset size={18} className="text-orange-400 mr-2" />
                      <span>Sunset</span>
                    </div>
                    <span>{formatTime(weather.sys.sunset)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Weather Details */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Air Conditions</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Umbrella size={18} className="text-blue-400 mr-2" />
                    <span className="text-gray-400">Precipitation</span>
                  </div>
                  <span className="font-semibold">
                    {forecast.hourly[0]?.pop ? (forecast.hourly[0].pop * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BarChart size={18} className="text-purple-400 mr-2" />
                    <span className="text-gray-400">Pressure</span>
                  </div>
                  <span className="font-semibold">{weather.main.pressure} hPa</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Droplets size={18} className="text-blue-400 mr-2" />
                    <span className="text-gray-400">Humidity</span>
                  </div>
                  <span className="font-semibold">{weather.main.humidity}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wind size={18} className="text-green-400 mr-2" />
                    <span className="text-gray-400">Wind</span>
                  </div>
                  <span className="font-semibold">
                    {(weather.wind.speed)} {speedUnit} {weather.wind.deg && `(${getWindDirection(weather.wind.deg)})`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Forecast Toggle & Chart */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Forecast</h2>
              <div className="flex bg-gray-700 rounded-lg p-1">
                <button
                  className={`px-4 py-1 rounded-md ${view === 'hourly' ? 'bg-blue-600' : ''}`}
                  onClick={() => setView('hourly')}
                >
                  <Clock size={16} className="inline mr-1" /> Hourly
                </button>
                <button
                  className={`px-4 py-1 rounded-md ${view === 'daily' ? 'bg-blue-600' : ''}`}
                  onClick={() => setView('daily')}
                >
                  <Calendar size={16} className="inline mr-1" /> Daily
                </button>
              </div>
            </div>

            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={view === 'hourly' ? forecast.hourly : forecast.daily}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey={view === 'hourly' ? 'time' : 'day'} 
                    stroke="#9CA3AF"
                  />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem' }}
                    formatter={(value, name) => {
                      if (name.includes('Temperature') || name.includes('Temp')) {
                        return [`${value}${temperatureUnit}`, name];
                      }
                      if (name === 'Humidity (%)') {
                        return [`${value}%`, name];
                      }
                      if (name === 'Wind') {
                        return [`${value} ${speedUnit}`, name];
                      }
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey={view === 'hourly' ? 'temp' : 'high'} 
                    name={`Temperature (${temperatureUnit})`}
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  {view === 'daily' && (
                    <Line 
                      type="monotone" 
                      dataKey="low" 
                      name={`Min Temp (${temperatureUnit})`}
                      stroke="#60A5FA" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                  <Line 
                    type="monotone" 
                    dataKey="humidity" 
                    name="Humidity (%)" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  {view === 'hourly' && (
                    <Line 
                      type="monotone" 
                      dataKey="wind" 
                      name={`Wind (${speedUnit})`}
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly/Daily Forecast Cards */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-6">{view === 'hourly' ? 'Hourly' : 'Daily'} Forecast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {(view === 'hourly' ? forecast.hourly.slice(0, 8) : forecast.daily).map((item, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded-lg text-center">
                  <p className="text-gray-400 mb-1">{view === 'hourly' ? item.time : `${item.day}, ${item.date}`}</p>
                  <div className="text-2xl my-2">
                    {getWeatherIcon(item.description, item.icon)}
                  </div>
                  <p className="font-bold capitalize">
                    {view === 'hourly' 
                      ? `${(item.temp)}${temperatureUnit}` 
                      : `${(item.high)}/${(item.low)}${temperatureUnit}`
                    }
                  </p>
                  <div className="flex items-center justify-center mt-2 text-xs text-blue-300">
                    <Droplets size={12} className="mr-1" />
                    <span>{item.humidity}%</span>
                    {item.pop > 0 && (
                      <>
                        <Umbrella size={12} className="ml-2 mr-1" />
                        <span>{(item.pop * 100)}%</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      
      {/* Footer */}
      
    </div>
  );


}

// Helper function to convert wind degrees to cardinal direction
function getWindDirection(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = (degrees / 22.5) % 16;
  return directions[index];
}
