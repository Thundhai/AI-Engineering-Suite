import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GeoLocation } from '../types';
import { MapPinIcon, GlobeIcon, CheckIcon, SpinnerIcon } from './Icons';

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
    <div className={`eng-panel p-4 transition-opacity ${disabled ? 'opacity-50' : 'opacity-100'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GlobeIcon className={`w-4 h-4 ${location ? 'text-eng-accent' : 'text-slate-500'}`} />
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Geospatial Uplink</h3>
        </div>
        {location && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-eng-accent/10 border border-eng-accent/30 rounded-full">
            <div className="w-1 h-1 bg-eng-accent rounded-full animate-pulse"></div>
            <span className="text-[9px] font-mono text-eng-accent uppercase tracking-widest">Active</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGetCurrentLocation}
          disabled={disabled || isFetching}
          className="w-full flex items-center justify-center gap-3 bg-slate-800 border border-eng-border text-slate-300 hover:bg-slate-700 py-2.5 rounded transition-all duration-300"
        >
          {isFetching ? (
            <>
              <SpinnerIcon className="w-4 h-4 animate-spin text-eng-accent" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Synchronizing...</span>
            </>
          ) : (
            <>
              <MapPinIcon className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Auto-Detect Location</span>
            </>
          )}
        </motion.button>

        <div className="flex items-center gap-2">
            <input 
                type="number"
                placeholder="LAT"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                disabled={disabled}
                className="w-full bg-slate-900/50 border border-eng-border rounded px-3 py-2 text-[11px] text-white focus:ring-1 focus:ring-eng-accent focus:outline-none transition font-mono"
            />
            <input 
                type="number"
                placeholder="LON"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                disabled={disabled}
                className="w-full bg-slate-900/50 border border-eng-border rounded px-3 py-2 text-[11px] text-white focus:ring-1 focus:ring-eng-accent focus:outline-none transition font-mono"
            />
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSetManualLocation}
                disabled={disabled || !manualLat || !manualLon}
                className="bg-eng-accent hover:bg-cyan-300 disabled:bg-slate-700 disabled:text-slate-500 text-eng-bg font-bold py-2 px-4 rounded text-[10px] uppercase tracking-widest transition shadow-lg shadow-eng-accent/10"
            >
                Set
            </motion.button>
        </div>
        
        <AnimatePresence>
          {error && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-[10px] text-red-400 font-mono"
            >
              ERR: {error}
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {location && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-slate-900/50 border border-eng-accent/30 p-3 rounded flex items-center justify-between"
              >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-eng-accent/10 rounded">
                      <CheckIcon className="w-3.5 h-3.5 text-eng-accent" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-0.5">Pinned Coordinates</span>
                      <span className="text-[11px] font-mono text-white tracking-wider">
                        {location.latitude.toFixed(6)}°N, {location.longitude.toFixed(6)}°W
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={handleClearLocation} 
                    disabled={disabled} 
                    className="text-[9px] font-mono text-red-400 hover:text-red-300 uppercase tracking-widest transition-colors"
                  >
                    Purge
                  </button>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AlphaEarthConnector;
