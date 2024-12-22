import React, { createContext, useContext, useState } from 'react';

interface WeatherData {
  temp: number;
  description: string;
  weatherCode: number;
  humidity: number;
  windSpeed: number;
}

interface WeatherContextType {
  weather: WeatherData | null;
  setWeather: (weather: WeatherData | null) => void;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const WeatherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  return (
    <WeatherContext.Provider value={{ weather, setWeather }}>
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
}; 