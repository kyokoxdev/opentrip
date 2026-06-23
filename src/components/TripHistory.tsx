import React, { useState } from 'react';
import { Trip, AppSettings } from '../types';
import { History, Calendar, Clock, Navigation, Zap, Trash2, ArrowLeft, Image } from 'lucide-react';
import { ShareCard } from './ShareCard';

interface TripHistoryProps {
  trips: Trip[];
  settings: AppSettings;
  onDeleteTrip: (id: string) => Promise<void>;
}

export const TripHistory: React.FC<TripHistoryProps> = ({
  trips,
  settings,
  onDeleteTrip
}) => {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  
  const isImperial = settings.units === 'imperial';
  const distUnit = isImperial ? 'mi' : 'km';
  const speedUnit = isImperial ? 'mph' : 'km/h';

  const formatDuration = (sec: number): string => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const handleTripSelect = (trip: Trip) => {
    setSelectedTrip(trip);
  };

  const handleBackToList = () => {
    setSelectedTrip(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this trip record permanently?')) {
      await onDeleteTrip(id);
      if (selectedTrip?.id === id) {
        setSelectedTrip(null);
      }
    }
  };

  // If a specific trip details subview is selected
  if (selectedTrip) {
    const displayDist = isImperial ? selectedTrip.distance * 0.621371 : selectedTrip.distance;
    const displayMaxSpeed = isImperial ? selectedTrip.maxSpeed * 0.621371 : selectedTrip.maxSpeed;
    const displayAvgSpeed = isImperial ? selectedTrip.avgSpeed * 0.621371 : selectedTrip.avgSpeed;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
        
        {/* Back navigation header */}
        <button 
          className="btn btn-outline" 
          onClick={handleBackToList}
          style={{ alignSelf: 'flex-start', padding: '8px 14px', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to List</span>
        </button>

        {/* Detailed stats card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', textTransform: 'uppercase', margin: 0 }}>Trip Analytics</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {new Date(selectedTrip.date).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
              </span>
            </div>
            <button 
              className="btn btn-outline" 
              onClick={(e) => handleDelete(selectedTrip.id, e)}
              style={{ color: 'var(--neon-red)', borderColor: 'rgba(255,0,85,0.2)', padding: '6px 12px' }}
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Distance</span>
              <span className="stat-value">
                {displayDist.toFixed(2)}
                <span className="stat-unit">{distUnit}</span>
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Duration</span>
              <span className="stat-value">{formatDuration(selectedTrip.duration)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Max Speed</span>
              <span className="stat-value">
                {Math.round(displayMaxSpeed)}
                <span className="stat-unit">{speedUnit}</span>
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Avg Speed</span>
              <span className="stat-value">
                {Math.round(displayAvgSpeed)}
                <span className="stat-unit">{speedUnit}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Peak G forces metrics */}
        <div className="card">
          <h3 style={{ textTransform: 'uppercase', color: 'var(--text-secondary)', fontSize: '0.85rem', letterSpacing: '1px', marginBottom: '12px' }}>
            Extreme G-Force Telemetry
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
            <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Cornering</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--gauge-font)', color: 'var(--neon-orange)', marginTop: '4px' }}>
                {selectedTrip.maxGForce.lat.toFixed(2)}G
              </div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Acceleration</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--gauge-font)', color: 'var(--neon-cyan)', marginTop: '4px' }}>
                {selectedTrip.maxGForce.acc.toFixed(2)}G
              </div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Braking</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--gauge-font)', color: 'var(--neon-red)', marginTop: '4px' }}>
                {selectedTrip.maxGForce.brk.toFixed(2)}G
              </div>
            </div>
          </div>
        </div>

        {/* Share card generator display */}
        <ShareCard trip={selectedTrip} units={settings.units} />

      </div>
    );
  }

  // If viewing the history list
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <History size={24} style={{ color: 'var(--neon-cyan)' }} />
        <h2 style={{ fontSize: '1.6rem', textTransform: 'uppercase', margin: 0 }}>Driving History</h2>
      </div>

      {trips.length === 0 ? (
        <div 
          className="card" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            padding: '40px 20px', 
            color: 'var(--text-secondary)',
            textAlign: 'center',
            gap: '12px'
          }}
        >
          <Navigation size={32} style={{ color: 'var(--text-muted)' }} />
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>No trips logged yet.</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Your recorded drives will appear here with charts, maps, and sharing cards.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {trips.map((trip) => {
            const displayDist = isImperial ? trip.distance * 0.621371 : trip.distance;
            const displayMaxSpeed = isImperial ? trip.maxSpeed * 0.621371 : trip.maxSpeed;

            return (
              <div 
                key={trip.id}
                className="card"
                onClick={() => handleTripSelect(trip)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  cursor: 'pointer',
                  margin: 0,
                  background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(22, 22, 28, 0.4) 100%)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    {new Date(trip.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    <Clock size={12} style={{ marginLeft: '6px' }} />
                    {new Date(trip.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  <span 
                    style={{ 
                      fontSize: '1.3rem', 
                      fontWeight: 700, 
                      fontFamily: 'var(--gauge-font)',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '4px'
                    }}
                  >
                    {displayDist.toFixed(2)}
                    <span style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)', fontWeight: 500 }}>{distUnit}</span>
                    <span style={{ color: 'var(--border-bright)', margin: '0 8px', fontSize: '0.9rem' }}>|</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {formatDuration(trip.duration)}
                    </span>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Top Speed</div>
                    <div style={{ fontFamily: 'var(--gauge-font)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                      {Math.round(displayMaxSpeed)} {speedUnit}
                    </div>
                  </div>
                  
                  <button 
                    className="btn btn-outline" 
                    onClick={(e) => handleDelete(trip.id, e)}
                    style={{ color: 'var(--neon-red)', borderColor: 'transparent', padding: '6px' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
