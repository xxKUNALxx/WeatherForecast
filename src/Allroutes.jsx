import React from 'react';
import { Route, Routes } from 'react-router-dom'; // ✅ no BrowserRouter here
import WeatherLoginPage from './pages/WeatherLoginPage';
import WeatherApp from './pages/Home';
import Map from './pages/Map';

const AllRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<WeatherLoginPage />} />
      <Route path="/home" element={<WeatherApp />} />
      <Route path="/map" element={<Map />} />
    </Routes>
  );
};

export default AllRoutes;
