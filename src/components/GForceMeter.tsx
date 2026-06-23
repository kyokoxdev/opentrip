import React from 'react';
import { GForce } from '../types';

interface GForceMeterProps {
  gForce: GForce;
  maxG: { lat: number; acc: number; brk: number };
  onCalibrate: () => void;
}

export const GForceMeter: React.FC<GForceMeterProps> = ({ gForce, maxG, onCalibrate }) => {
  // Convert G-force to coordinate percentages (max scale corresponds to 1.0G)
  const maxScaleG = 1.0;
  
  // Calculate positions (capped at -100% to +100%)
  const xPercent = Math.max(-100, Math.min(100, (gForce.x / maxScaleG) * 100));
  const yPercent = Math.max(-100, Math.min(100, (gForce.y / maxScaleG) * 100));

  // Peak G markers
  const peakRight = (maxG.lat / maxScaleG) * 100;
  const peakLeft = -(maxG.lat / maxScaleG) * 100;
  const peakAcc = (maxG.acc / maxScaleG) * 100;
  const peakBrk = -(maxG.brk / maxScaleG) * 100;

  return (
    <div className="card card-glowing-green" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ textTransform: 'uppercase', color: 'var(--text-secondary)', fontSize: '0.85rem', letterSpacing: '1px' }}>
          G-Force telemetry
        </h3>
        <button 
          className="btn btn-outline" 
          onClick={onCalibrate}
          style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
        >
          Tare/Calibrate
        </button>
      </div>

      {/* Outer Gauge Ring */}
      <div 
        style={{
          position: 'relative',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          border: '1px dashed var(--border-bright)',
          background: 'radial-gradient(circle, rgba(22,22,28,0.4) 0%, rgba(12,12,14,0.8) 100%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
        }}
      >
        {/* Concentric rings at 0.5G and 1.0G */}
        <div style={{
          position: 'absolute',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          border: '1px dotted rgba(255, 255, 255, 0.08)',
        }} />
        
        <span style={{
          position: 'absolute',
          top: '30px',
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          fontWeight: 600
        }}>0.5G</span>
        
        <span style={{
          position: 'absolute',
          top: '6px',
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          fontWeight: 600
        }}>1.0G</span>

        {/* Crosshair Lines */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', background: 'rgba(255,255,255,0.05)' }} />

        {/* Peak G Trace Box Bounds / Peak Markers (faint dots) */}
        {maxG.lat > 0.05 && (
          <>
            {/* Peak Left */}
            <div style={{
              position: 'absolute',
              left: `calc(50% + ${peakLeft}% - 3px)`,
              top: '50%',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 159, 0, 0.3)',
              transform: 'translate(-50%, -50%)',
            }} />
            {/* Peak Right */}
            <div style={{
              position: 'absolute',
              left: `calc(50% + ${peakRight}% - 3px)`,
              top: '50%',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 159, 0, 0.3)',
              transform: 'translate(-50%, -50%)',
            }} />
          </>
        )}
        {maxG.acc > 0.05 && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: `calc(50% - ${peakAcc}% - 3px)`,
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 229, 255, 0.3)',
            transform: 'translate(-50%, -50%)',
          }} />
        )}
        {maxG.brk > 0.05 && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: `calc(50% - ${peakBrk}% - 3px)`,
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 0, 85, 0.3)',
            transform: 'translate(-50%, -50%)',
          }} />
        )}

        {/* Live G-force Bubble */}
        <div 
          style={{
            position: 'absolute',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #00ff66 0%, #00d957 70%)',
            boxShadow: '0 0 12px #00ff66, inset 0 2px 4px rgba(255,255,255,0.6)',
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${xPercent}px), calc(-50% - ${yPercent}px))`,
            transition: 'transform 0.05s ease-out'
          }}
        />
        
        {/* Real-time numerical display inside center */}
        <div 
          style={{
            position: 'absolute',
            bottom: '12px',
            fontFamily: 'var(--gauge-font)',
            fontWeight: 700,
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: '2px 8px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          {Math.abs(gForce.x).toFixed(2)}G LAT | {Math.abs(gForce.y).toFixed(2)}G LON
        </div>
      </div>

      {/* Peak statistics labels footer */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          width: '100%',
          marginTop: '12px',
          borderTop: '1px solid var(--border-dim)',
          paddingTop: '12px',
          fontSize: '0.8rem'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Max Lateral</div>
          <div style={{ fontWeight: 700, color: 'var(--neon-orange)', fontFamily: 'var(--gauge-font)', fontSize: '1.1rem' }}>
            {maxG.lat.toFixed(2)}G
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Max Accel</div>
          <div style={{ fontWeight: 700, color: 'var(--neon-cyan)', fontFamily: 'var(--gauge-font)', fontSize: '1.1rem' }}>
            {maxG.acc.toFixed(2)}G
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Max Braking</div>
          <div style={{ fontWeight: 700, color: 'var(--neon-red)', fontFamily: 'var(--gauge-font)', fontSize: '1.1rem' }}>
            {maxG.brk.toFixed(2)}G
          </div>
        </div>
      </div>
    </div>
  );
};
