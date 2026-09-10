import React, { useState, useEffect } from 'react';
import { GeoLocation } from '../types';
import { MapPinIcon, GlobeIcon, CheckIcon, SpinnerIcon } from './Icons';

interface AlphaEarthConnectorProps {
  location: GeoLocation | null;
  onSetLocation: (location: GeoLocation | null) => void;
  disabled: boolean;
}

function formatCoordinate(value: number, positiveLabel: string, negativeLabel: string): string {
  const hemisphere = value < 0 ? negativeLabel : positiveLabel;
  return `${Math.abs(value).toFixed(6)}°${hemisphere}`;
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
      setError('Geolocation is not supported by your browser.');
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
      setError('Invalid coordinates. Please enter a valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }
    setError(null);
    onSetLocation({ latitude: lat, longitude: lon });
  };

  const handleClearLocation = () => {
    onSetLocation(null);
  };

  return (
    <div className={`eng-panel p-4 transition-opacity ${disabled ? 'opacity-60' : 'opacity-100'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GlobeIcon className={`w-4 h-4 ${location ? 'text-eng-accent' : 'text-eng-muted'}`} />
          <h3 className="eng-label mb-0">Site location</h3>
        </div>
        {location && (
          <span className="text-xs font-medium text-eng-success bg-eng-success-soft px-2 py-0.5 rounded-full">Set</span>
        )}
      </div>

      <div className="space-y-4">
        <button
          onClick={handleGetCurrentLocation}
          disabled={disabled || isFetching}
          className="w-full flex items-center justify-center gap-2 eng-button-secondary eng-button"
        >
          {isFetching ? (
            <>
              <SpinnerIcon className="w-4 h-4 animate-spin text-eng-accent" />
              Detecting…
            </>
          ) : (
            <>
              <MapPinIcon className="w-4 h-4" />
              Use my current location
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Latitude"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
            disabled={disabled}
            className="w-full eng-input text-sm"
          />
          <input
            type="number"
            placeholder="Longitude"
            value={manualLon}
            onChange={(e) => setManualLon(e.target.value)}
            disabled={disabled}
            className="w-full eng-input text-sm"
          />
          <button
            onClick={handleSetManualLocation}
            disabled={disabled || !manualLat || !manualLon}
            className="eng-button eng-button-primary text-sm px-4"
          >
            Set
          </button>
        </div>

        {error && (
          <p className="text-xs text-eng-danger">{error}</p>
        )}

        {location && (
          <div className="bg-slate-50 border border-eng-border p-3 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-eng-success-soft rounded-md">
                <CheckIcon className="w-3.5 h-3.5 text-eng-success" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-eng-muted mb-0.5">Coordinates</span>
                <span className="text-sm font-mono text-eng-ink">
                  {formatCoordinate(location.latitude, 'N', 'S')}, {formatCoordinate(location.longitude, 'E', 'W')}
                </span>
              </div>
            </div>
            <button
              onClick={handleClearLocation}
              disabled={disabled}
              className="text-xs font-medium text-eng-danger hover:text-red-700 transition-colors"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlphaEarthConnector;
