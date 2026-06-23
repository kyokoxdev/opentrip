import React from 'react';
import { CameraAlert } from '../types';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface AlertWidgetProps {
  closestAlert: CameraAlert | null;
}

export const AlertWidget: React.FC<AlertWidgetProps> = ({ closestAlert }) => {
  if (!closestAlert) {
    return (
      <div 
        className="card card-glowing-green" 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          background: 'linear-gradient(90deg, rgba(0, 255, 102, 0.05) 0%, rgba(22, 22, 28, 0.8) 100%)'
        }}
      >
        <div 
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 255, 102, 0.1)',
            color: 'var(--neon-green)'
          }}
        >
          <ShieldCheck size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ color: 'var(--neon-green)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>
            Road Shield Active
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            All clear. Monitoring upcoming speed cameras & signals.
          </p>
        </div>
      </div>
    );
  }

  // Determine severity and colors based on proximity
  const dist = closestAlert.distance ?? 999;
  const isCritical = dist < 150;
  const isSpeedCamera = closestAlert.type.includes('camera');
  
  const alertColor = isCritical ? 'var(--neon-red)' : isSpeedCamera ? 'var(--neon-red)' : 'var(--neon-orange)';
  const alertBg = isCritical 
    ? 'linear-gradient(90deg, rgba(255, 0, 85, 0.25) 0%, rgba(22, 22, 28, 0.95) 100%)'
    : 'linear-gradient(90deg, rgba(255, 159, 0, 0.15) 0%, rgba(22, 22, 28, 0.95) 100%)';
  const glowShadow = isCritical ? 'var(--glow-red)' : 'var(--glow-orange)';

  return (
    <div 
      className={`card ${isCritical ? 'animate-pulse-red' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        border: `1px solid ${alertColor}`,
        background: alertBg,
        boxShadow: glowShadow,
        transition: 'all 0.2s ease-in-out'
      }}
    >
      {/* Visual Indicator Icon */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          border: `2px solid ${alertColor}`,
          color: alertColor
        }}
      >
        {isCritical ? <ShieldAlert size={28} /> : <AlertTriangle size={24} />}
      </div>

      {/* Warning Description */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <h4 style={{ color: alertColor, textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '0.5px', fontWeight: 700 }}>
            {closestAlert.description}
          </h4>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
          Proximity: <span style={{ color: '#ffffff', fontFamily: 'var(--mono-font)', fontSize: '0.9rem' }}>{dist}m</span>
        </p>
      </div>

      {/* Speed Limit circular display if speed camera */}
      {closestAlert.speedLimit && (
        <div 
          style={{
            width: '45px',
            height: '45px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: '4px solid #ff0055',
            color: '#000000',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
          }}
        >
          <span style={{ fontSize: '0.6rem', fontWeight: 800, lineHeight: '1', textTransform: 'uppercase' }}>Limit</span>
          <span style={{ fontSize: '1rem', fontWeight: 800, lineHeight: '1', fontFamily: 'var(--gauge-font)' }}>
            {closestAlert.speedLimit}
          </span>
        </div>
      )}
    </div>
  );
};
