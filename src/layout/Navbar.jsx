import { useState } from 'react';
import { Sun, Map, Globe, Upload, Menu, X, User } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { googleLogout } from '@react-oauth/google';

export default function WeatherNavbar() {
  const [activeTab, setActiveTab] = useState('weather');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 🔒 Hide navbar on login page
  if (location.pathname === '/') return null;

  const tabs = [
    { id: 'weather', label: 'Weather', icon: <Sun />, path: '/home' },
    { id: 'map', label: 'Map', icon: <Map />, path: '/map' },
    { id: 'globe', label: 'Globe', icon: <Globe />, path: '/globe' },
    { id: 'upload', label: 'Upload', icon: <Upload />, path: '/upload' }
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (profileMenuOpen) setProfileMenuOpen(false);
  };

  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
    if (mobileMenuOpen) setMobileMenuOpen(false);
  };

  // 🚪 Handle Logout
  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem('user'); // optional: remove session
    navigate('/'); // redirect to login
  };

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-white font-bold text-xl">
            <Sun className="text-yellow-400" />
            <span>WeatherApp</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex space-x-4">
              {tabs.map((tab) => (
                <Link
                  to={tab.path}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Profile Button (Desktop) */}
          <div className="hidden md:block relative">
            <button
              onClick={toggleProfileMenu}
              className="flex items-center px-3 py-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <User className="h-5 w-5 text-gray-300" />
              <span className="ml-2">Profile</span>
            </button>

            {/* Profile Dropdown */}
            {profileMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-700 ring-1 ring-black ring-opacity-5 z-10">
                <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">Your Profile</a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">Settings</a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">Preferences</a>
                <div className="border-t border-gray-600"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu buttons */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleProfileMenu}
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600"
            >
              <User className="h-5 w-5 text-gray-300" />
            </button>
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          {tabs.map((tab) => (
            <Link
              to={tab.path}
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
              }}
              className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="mr-3">{tab.icon}</span>
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Profile Menu */}
      <div className={`md:hidden ${profileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-700">
          <a href="#" className="block px-4 py-2 text-base font-medium text-gray-300 hover:bg-gray-600 rounded-md">Your Profile</a>
          <a href="#" className="block px-4 py-2 text-base font-medium text-gray-300 hover:bg-gray-600 rounded-md">Settings</a>
          <a href="#" className="block px-4 py-2 text-base font-medium text-gray-300 hover:bg-gray-600 rounded-md">Preferences</a>
          <div className="border-t border-gray-600 my-1"></div>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-base font-medium text-gray-300 hover:bg-gray-600 rounded-md"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
