import React, { useState, useEffect } from 'react';
import { GeoLocation } from '../types';
import { MapPinIcon } from './Icons';
import Spinner from './Spinner';

interface AlphaEarthConnectorProps {
  location: GeoLocation | null;
  onSetLocation: (location: GeoLocation | null) => void;
  disabled: boolean;
}

const AlphaEarthConnector: React.FC<AlphaEarthConnectorProps> = ({ location, onSetLocation, disabled }) => {
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setManualLat(location?.latitude.toString() ?? '');
    setManualLon(location?.longitude.toString() ?? '');
    setError(null);
  }, [location]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setIsFetching(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onSetLocation({ latitude, longitude });
        setIsFetching(false);
      },
      (err) => {
        setError(`Failed to get location: ${err.message}`);
        setIsFetching(false);
      }
    );
  };

  const handleSetManualLocation = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError("Invalid coordinates. Please enter valid latitude (-90 to 90) and longitude (-180 to 180).");
      return;
    }
    setError(null);
    onSetLocation({ latitude: lat, longitude: lon });
  };
  
  const handleClearLocation = () => {
    onSetLocation(null);
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700 transition-opacity ${disabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}>
      <div className="flex items-center gap-3 mb-3">
        <MapPinIcon className="w-6 h-6 text-cyan-400" />
        <h2 className="text-lg font-semibold text-cyan-400">AlphaEarth Mapping</h2>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleGetCurrentLocation}
          disabled={disabled || isFetching}
          className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600/50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition duration-300"
        >
          {isFetching ? <Spinner size="sm" /> : 'Get Current Location'}
        </button>

        <div className="flex items-center gap-2">
            <input 
                type="number"
                placeholder="Latitude"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                disabled={disabled}
                className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
            />
            <input 
                type="number"
                placeholder="Longitude"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                disabled={disabled}
                className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
            />
            <button
                onClick={handleSetManualLocation}
                disabled={disabled || !manualLat || !manualLon}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition"
            >
                Set
            </button>
        </div>
        
        {error && <p className="text-xs text-red-400">{error}</p>}

        {location && (
            <div className="bg-gray-900/50 p-3 rounded-md text-sm">
                <p className="font-semibold text-white">Project Location Pinned:</p>
                <p className="text-gray-300">Lat: {location.latitude.toFixed(6)}, Lon: {location.longitude.toFixed(6)}</p>
                <button onClick={handleClearLocation} disabled={disabled} className="text-xs text-red-400 hover:underline mt-1">Clear</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default AlphaEarthConnector;