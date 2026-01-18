import { useEffect, useState } from "react";
import "./App.css";

// Leaflet imports
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API_KEY = "481bdfe9400adef473a08341a346661f";

// 🌡️ Custom temperature marker icon
const temperatureIcon = (temp) =>
  L.divIcon({
    className: "temp-marker",
    html: `<div>${Math.round(temp)}°C</div>`,
    iconSize: [60, 32],
    iconAnchor: [30, 32],
  });

function App() {
  // 🌗 Load settings from localStorage
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );
  const [city, setCity] = useState(
    localStorage.getItem("city") || ""
  );

  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("weather");

  // 💾 Save settings
  useEffect(() => {
    localStorage.setItem("theme", theme);
    localStorage.setItem("city", city);
  }, [theme, city]);

  const fetchWeather = async () => {
    if (!city) {
      setError("Please enter a city");
      return;
    }

    setError("");
    setCurrent(null);
    setForecast([]);

    try {
      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
      );
      const currentData = await currentRes.json();

      if (currentData.cod !== 200) {
        setError(currentData.message);
        return;
      }

      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`
      );
      const forecastData = await forecastRes.json();

      setCurrent(currentData);
      setForecast(forecastData.list);
    } catch {
      setError("Failed to fetch data");
    }
  };

  const toggleTheme = () =>
    setTheme(theme === "dark" ? "light" : "dark");

  return (
    <div className={`app ${theme}`}>
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2 className="logo">🌦</h2>

        <p
          className={activeTab === "weather" ? "active" : ""}
          onClick={() => setActiveTab("weather")}
        >
          Weather
        </p>
        <p
          className={activeTab === "forecast" ? "active" : ""}
          onClick={() => setActiveTab("forecast")}
        >
          Forecast
        </p>
        <p
          className={activeTab === "map" ? "active" : ""}
          onClick={() => setActiveTab("map")}
        >
          Map
        </p>
        <p
          className={activeTab === "settings" ? "active" : ""}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </p>
      </aside>

      {/* MAIN */}
      <main className="main">
        {/* TOP BAR */}
        <div className="top-bar">
          <div className="search-bar">
            <input
              placeholder="Search city..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchWeather()}
            />
            <button onClick={fetchWeather}>Search</button>
          </div>

          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        {/* WEATHER TAB */}
        {activeTab === "weather" && current && (
          <>
            <section className="current-card">
              <div>
                <h1>{current.name}</h1>
                <p className="desc">{current.weather[0].description}</p>
                <h2>{Math.round(current.main.temp)}°C</h2>
              </div>
              <img
                src={`https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`}
                alt=""
              />
            </section>

            <section className="details">
              <Info label="Feels Like" value={`${Math.round(current.main.feels_like)}°C`} />
              <Info label="Humidity" value={`${current.main.humidity}%`} />
              <Info label="Wind Speed" value={`${current.wind.speed} m/s`} />
              <Info label="Pressure" value={`${current.main.pressure} hPa`} />
              <Info label="Visibility" value={`${current.visibility / 1000} km`} />
              <Info label="Cloudiness" value={`${current.clouds.all}%`} />
            </section>
          </>
        )}

        {/* FORECAST TAB */}
        {activeTab === "forecast" && forecast.length > 0 && (
          <section className="forecast">
            <h3>5-Day Forecast</h3>
            <div className="forecast-grid">
              {forecast
                .filter((_, i) => i % 8 === 0)
                .slice(0, 5)
                .map((day, i) => (
                  <div className="forecast-card" key={i}>
                    <p>
                      {new Date(day.dt * 1000).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </p>
                    <img
                      src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                      alt=""
                    />
                    <h4>{Math.round(day.main.temp)}°C</h4>
                  </div>
                ))}
            </div>
          </section>
        )}

       {/* MAP TAB (ENHANCED WEATHER MAP) */}
{activeTab === "map" && current && (
  <div className="map-container">
    <MapContainer
      center={[current.coord.lat, current.coord.lon]}
      zoom={10}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker
  position={[current.coord.lat, current.coord.lon]}
  icon={temperatureIcon(current.main.temp)}
>
        <Popup>
          <div style={{ textAlign: "center" }}>
            <h3 style={{ margin: "5px 0" }}>
              📍 {current.name}, {current.sys.country}
            </h3>

            <img
              src={`https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`}
              alt="weather icon"
            />

            <p style={{ fontSize: "18px", margin: "5px 0" }}>
              🌡 {Math.round(current.main.temp)}°C
            </p>

            <p style={{ textTransform: "capitalize" }}>
              {current.weather[0].description}
            </p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  </div>
)}


        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="placeholder">
            <h3>Settings</h3>
            <p>Theme and last searched city are saved automatically.</p>
            <p>Reload the page to test.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="info-card">
      <p>{label}</p>
      <h3>{value}</h3>
    </div>
  );
}

export default App;
