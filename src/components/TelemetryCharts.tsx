import React, { useRef } from 'react';
import { TelemetryLog } from '../types';

interface TelemetryChartsProps {
  telemetryLogs: TelemetryLog[];
  units: 'metric' | 'imperial';
  activeTelemetryIndex: number | null;
  setActiveTelemetryIndex: (index: number | null) => void;
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({
  telemetryLogs,
  units,
  activeTelemetryIndex,
  setActiveTelemetryIndex
}) => {
  const speedChartRef = useRef<SVGSVGElement>(null);
  const gForceChartRef = useRef<SVGSVGElement>(null);

  if (!telemetryLogs || telemetryLogs.length === 0) {
    return (
      <div className="card" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No telemetry logs available for this trip.
      </div>
    );
  }

  const isImperial = units === 'imperial';
  const speedUnit = isImperial ? 'mph' : 'km/h';
  
  // Speed values (convert if imperial)
  const speedMultiplier = isImperial ? 0.621371 : 1;
  const speeds = telemetryLogs.map(log => log.speed * speedMultiplier);
  const maxSpeed = Math.max(...speeds, 10); // avoid division by zero, min max is 10
  
  // G-Force values
  const lateralGs = telemetryLogs.map(log => log.gForce.x);
  const longitudinalGs = telemetryLogs.map(log => log.gForce.y);
  
  // Find extreme G bounds
  const maxLatG = Math.max(...lateralGs.map(Math.abs), 0.1);
  const maxLongG = Math.max(...longitudinalGs.map(Math.abs), 0.1);
  const absoluteMaxG = Math.max(maxLatG, maxLongG, 0.5); // min scale limit of 0.5G

  const totalPoints = telemetryLogs.length;

  // Chart Dimensions (viewBox based)
  const width = 500;
  const height = 130;
  const paddingX = 15;
  const paddingTop = 15;
  const paddingBottom = 15;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingTop - paddingBottom;

  // 1. Generate Speed Path
  let speedPath = '';
  speeds.forEach((val, i) => {
    const x = paddingX + (i / (totalPoints - 1)) * chartW;
    const y = height - paddingBottom - (val / maxSpeed) * chartH;
    speedPath += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  });

  // Generate Speed Fill Area (goes down to baseline)
  let speedAreaPath = speedPath;
  if (totalPoints > 0) {
    const lastX = paddingX + chartW;
    const firstX = paddingX;
    const baseY = height - paddingBottom;
    speedAreaPath += ` L ${lastX.toFixed(1)} ${baseY} L ${firstX.toFixed(1)} ${baseY} Z`;
  }

  // 2. Generate G-Force Paths
  // Zero line for G-force is in the exact center of the chart height
  const gCenterY = paddingTop + chartH / 2;
  
  let latGPath = '';
  let longGPath = '';

  lateralGs.forEach((val, i) => {
    const x = paddingX + (i / (totalPoints - 1)) * chartW;
    // Positive goes up, negative goes down
    const y = gCenterY - (val / absoluteMaxG) * (chartH / 2);
    latGPath += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  });

  longitudinalGs.forEach((val, i) => {
    const x = paddingX + (i / (totalPoints - 1)) * chartW;
    const y = gCenterY - (val / absoluteMaxG) * (chartH / 2);
    longGPath += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  });

  // Interactivity Scrubber Handler
  const handleInteraction = (
    e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>,
    chartElement: SVGSVGElement | null
  ) => {
    if (!chartElement || totalPoints < 2) return;
    
    const rect = chartElement.getBoundingClientRect();
    let clientX = 0;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }

    const relativeX = clientX - rect.left;
    const percentX = Math.max(0, Math.min(1, relativeX / rect.width));
    
    // Convert percentage X to data index
    const dataIndex = Math.round(percentX * (totalPoints - 1));
    setActiveTelemetryIndex(dataIndex);
  };

  const handleMouseLeave = () => {
    setActiveTelemetryIndex(null);
  };

  const activeLog = activeTelemetryIndex !== null ? telemetryLogs[activeTelemetryIndex] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Dynamic Scrubber Tooltip */}
      <div 
        className="card"
        style={{
          margin: 0,
          padding: '12px',
          background: 'var(--bg-card-glass)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border-bright)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Telemetry Scrub Analyzer
          </span>
          {activeLog ? (
            <span className="text-mono" style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)' }}>
              T +{Math.round((activeLog.timestamp - telemetryLogs[0].timestamp) / 1000)}s
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Drag finger over charts to scrub telemetry</span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
          <div style={{ padding: '6px', background: 'var(--bg-input)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>SPEED</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--neon-cyan)', fontFamily: 'var(--gauge-font)' }}>
              {activeLog ? Math.round(activeLog.speed * speedMultiplier) : '--'}
              <span style={{ fontSize: '0.65rem', fontWeight: 500, marginLeft: '2px' }}>{speedUnit}</span>
            </div>
          </div>

          <div style={{ padding: '6px', background: 'var(--bg-input)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>LATERAL G</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--neon-orange)', fontFamily: 'var(--gauge-font)' }}>
              {activeLog ? activeLog.gForce.x.toFixed(2) : '--'}
              <span style={{ fontSize: '0.65rem', fontWeight: 500, marginLeft: '1px' }}>G</span>
            </div>
          </div>

          <div style={{ padding: '6px', background: 'var(--bg-input)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>LONGITUDINAL G</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: activeLog && activeLog.gForce.y >= 0 ? 'var(--neon-green)' : 'var(--neon-red)', fontFamily: 'var(--gauge-font)' }}>
              {activeLog ? activeLog.gForce.y.toFixed(2) : '--'}
              <span style={{ fontSize: '0.65rem', fontWeight: 500, marginLeft: '1px' }}>G</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart 1: Speed Over Time */}
      <div className="card" style={{ margin: 0, padding: '14px 12px 8px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <span style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>Speed Profile</span>
          <span style={{ color: 'var(--text-secondary)' }}>Max: {Math.round(maxSpeed)} {speedUnit}</span>
        </div>
        
        <svg
          ref={speedChartRef}
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', overflow: 'visible', cursor: 'crosshair', touchAction: 'none' }}
          onMouseMove={(e) => handleInteraction(e, speedChartRef.current)}
          onTouchMove={(e) => handleInteraction(e, speedChartRef.current)}
          onMouseLeave={handleMouseLeave}
          onTouchEnd={handleMouseLeave}
        >
          <defs>
            <filter id="glow-speed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="speed-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--neon-cyan)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--neon-cyan)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          <line x1={paddingX} y1={paddingTop} x2={width - paddingX} y2={paddingTop} stroke="var(--border-dim)" strokeDasharray="3,3" />
          <line x1={paddingX} y1={paddingTop + chartH / 2} x2={width - paddingX} y2={paddingTop + chartH / 2} stroke="var(--border-dim)" strokeDasharray="3,3" />
          <line x1={paddingX} y1={height - paddingBottom} x2={width - paddingX} y2={height - paddingBottom} stroke="var(--border-bright)" strokeWidth="1.5" />

          {/* Speed Fill Area */}
          <path d={speedAreaPath} fill="url(#speed-area-grad)" />

          {/* Speed Line */}
          <path
            d={speedPath}
            fill="none"
            stroke="var(--neon-cyan)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow-speed)"
          />

          {/* Hover Scrubber Line */}
          {activeTelemetryIndex !== null && (
            <>
              {/* Scrubber vertical line */}
              <line
                x1={paddingX + (activeTelemetryIndex / (totalPoints - 1)) * chartW}
                y1={paddingTop - 5}
                x2={paddingX + (activeTelemetryIndex / (totalPoints - 1)) * chartW}
                y2={height - paddingBottom}
                stroke="var(--text-primary)"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              {/* Scrubber intersection dot */}
              <circle
                cx={paddingX + (activeTelemetryIndex / (totalPoints - 1)) * chartW}
                cy={height - paddingBottom - (speeds[activeTelemetryIndex] / maxSpeed) * chartH}
                r="5"
                fill="var(--neon-cyan)"
                stroke="#ffffff"
                strokeWidth="1.5"
                filter="url(#glow-speed)"
              />
            </>
          )}
        </svg>
      </div>

      {/* Chart 2: G-Force Over Time */}
      <div className="card" style={{ margin: 0, padding: '14px 12px 8px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <span style={{ color: 'var(--neon-orange)', fontWeight: 600 }}>G-Force Timeline</span>
          <span style={{ color: 'var(--text-secondary)' }}>Scale: ±{absoluteMaxG.toFixed(1)}G</span>
        </div>

        <svg
          ref={gForceChartRef}
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', overflow: 'visible', cursor: 'crosshair', touchAction: 'none' }}
          onMouseMove={(e) => handleInteraction(e, gForceChartRef.current)}
          onTouchMove={(e) => handleInteraction(e, gForceChartRef.current)}
          onMouseLeave={handleMouseLeave}
          onTouchEnd={handleMouseLeave}
        >
          <defs>
            <filter id="glow-lat" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-long" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Horizontal Gridlines */}
          <line x1={paddingX} y1={paddingTop} x2={width - paddingX} y2={paddingTop} stroke="var(--border-dim)" strokeDasharray="3,3" />
          <line x1={paddingX} y1={gCenterY} x2={width - paddingX} y2={gCenterY} stroke="var(--border-bright)" strokeWidth="1.5" />
          <line x1={paddingX} y1={height - paddingBottom} x2={width - paddingX} y2={height - paddingBottom} stroke="var(--border-dim)" strokeDasharray="3,3" />

          {/* Zero center axis label */}
          <text x={paddingX + 5} y={gCenterY - 4} fill="var(--text-muted)" fontSize="8" fontFamily="var(--mono-font)">0.0G</text>

          {/* Lateral G Line (Cornering) - Neon Orange */}
          <path
            d={latGPath}
            fill="none"
            stroke="var(--neon-orange)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow-lat)"
          />

          {/* Longitudinal G Line (Accel/Braking) - Neon Red/Green (Red on plot) */}
          <path
            d={longGPath}
            fill="none"
            stroke="var(--neon-purple)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow-long)"
          />

          {/* Legends inside chart */}
          <g transform={`translate(${width - 150}, ${paddingTop + 8})`} fontSize="8" fontFamily="var(--sans-font)">
            <circle cx="0" cy="0" r="3" fill="var(--neon-orange)" />
            <text x="8" y="2" fill="var(--text-secondary)">Lateral G (Cornering)</text>
            <circle cx="0" cy="10" r="3" fill="var(--neon-purple)" />
            <text x="8" y="12" fill="var(--text-secondary)">Longitudinal G</text>
          </g>

          {/* Hover Scrubber Line */}
          {activeTelemetryIndex !== null && (
            <>
              {/* Scrubber vertical line */}
              <line
                x1={paddingX + (activeTelemetryIndex / (totalPoints - 1)) * chartW}
                y1={paddingTop - 5}
                x2={paddingX + (activeTelemetryIndex / (totalPoints - 1)) * chartW}
                y2={height - paddingBottom}
                stroke="var(--text-primary)"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              {/* Lateral Intersection Dot */}
              <circle
                cx={paddingX + (activeTelemetryIndex / (totalPoints - 1)) * chartW}
                cy={gCenterY - (lateralGs[activeTelemetryIndex] / absoluteMaxG) * (chartH / 2)}
                r="4.5"
                fill="var(--neon-orange)"
                stroke="#ffffff"
                strokeWidth="1"
                filter="url(#glow-lat)"
              />
              {/* Longitudinal Intersection Dot */}
              <circle
                cx={paddingX + (activeTelemetryIndex / (totalPoints - 1)) * chartW}
                cy={gCenterY - (longitudinalGs[activeTelemetryIndex] / absoluteMaxG) * (chartH / 2)}
                r="4.5"
                fill="var(--neon-purple)"
                stroke="#ffffff"
                strokeWidth="1"
                filter="url(#glow-long)"
              />
            </>
          )}
        </svg>
      </div>

    </div>
  );
};
