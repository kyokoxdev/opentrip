import React from 'react';
import { Trip } from '../types';
import { Share2, Download } from 'lucide-react';

interface ShareCardProps {
  trip: Trip;
  units: 'metric' | 'imperial';
}

export const ShareCard: React.FC<ShareCardProps> = ({ trip, units }) => {
  const isImperial = units === 'imperial';
  const displayDist = isImperial ? trip.distance * 0.621371 : trip.distance;
  const displayMaxSpeed = isImperial ? trip.maxSpeed * 0.621371 : trip.maxSpeed;
  const displayAvgSpeed = isImperial ? trip.avgSpeed * 0.621371 : trip.avgSpeed;

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

  // HTML5 Canvas generation for downloading
  const handleDownloadImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw Background
    ctx.fillStyle = '#16161c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Accent line at the bottom
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(0, canvas.height - 8, canvas.width, 8);

    // 2. Draw Title Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Rajdhani, system-ui';
    ctx.fillText('OPENTRIP PERFORMANCE CARD', 30, 45);

    ctx.fillStyle = '#8e8e9f';
    ctx.font = '14px Inter, system-ui';
    ctx.fillText(new Date(trip.date).toLocaleDateString(undefined, { dateStyle: 'long' }), 30, 70);

    // 3. Draw Telemetry Stats
    const drawStat = (label: string, value: string, unit: string, x: number, y: number) => {
      ctx.fillStyle = '#8e8e9f';
      ctx.font = '600 11px Inter, system-ui';
      ctx.fillText(label.toUpperCase(), x, y);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Rajdhani, system-ui';
      const textWidth = ctx.measureText(value).width;
      ctx.fillText(value, x, y + 36);

      ctx.fillStyle = '#00e5ff';
      ctx.font = '600 14px Rajdhani, system-ui';
      ctx.fillText(unit, x + textWidth + 4, y + 36);
    };

    drawStat('Distance', displayDist.toFixed(1), distUnit, 30, 110);
    drawStat('Duration', formatDuration(trip.duration), '', 30, 195);
    drawStat('Top Speed', Math.round(displayMaxSpeed).toString(), speedUnit, 30, 280);
    
    // G-Forces Column
    ctx.fillStyle = '#8e8e9f';
    ctx.font = '600 11px Inter, system-ui';
    ctx.fillText('MAX G-FORCES', 220, 110);

    const drawGStat = (gLabel: string, val: number, color: string, x: number, y: number) => {
      ctx.fillStyle = color;
      ctx.font = 'bold 22px Rajdhani, system-ui';
      ctx.fillText(`${val.toFixed(2)}G`, x, y);
      ctx.fillStyle = '#8e8e9f';
      ctx.font = '12px Inter, system-ui';
      ctx.fillText(gLabel, x + 70, y - 4);
    };

    drawGStat('Lateral', trip.maxGForce.lat, '#ff9f00', 220, 145);
    drawGStat('Accel', trip.maxGForce.acc, '#00e5ff', 220, 190);
    drawGStat('Braking', trip.maxGForce.brk, '#ff0055', 220, 235);

    // 4. Draw Scaled Map Path
    if (trip.path && trip.path.length > 1) {
      const mapX = 400;
      const mapY = 110;
      const mapW = 170;
      const mapH = 170;

      // Draw map bounding box
      ctx.fillStyle = '#0c0c0e';
      ctx.fillRect(mapX, mapY, mapW, mapH);
      ctx.strokeStyle = '#262632';
      ctx.lineWidth = 1;
      ctx.strokeRect(mapX, mapY, mapW, mapH);

      // Find min/max lat/lng to scale coordinate track to fit box
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
      trip.path.forEach(pt => {
        if (pt.lat < minLat) minLat = pt.lat;
        if (pt.lat > maxLat) maxLat = pt.lat;
        if (pt.lng < minLng) minLng = pt.lng;
        if (pt.lng > maxLng) maxLng = pt.lng;
      });

      const dLat = maxLat - minLat;
      const dLng = maxLng - minLng;
      const maxDelta = Math.max(dLat, dLng, 0.0001); // avoid division by zero

      // Centered margins
      const margin = 15;
      const innerW = mapW - margin * 2;
      const innerH = mapH - margin * 2;

      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      trip.path.forEach((pt, idx) => {
        // Normalize
        const xNorm = dLng === 0 ? 0.5 : (pt.lng - minLng) / maxDelta;
        const yNorm = dLat === 0 ? 0.5 : (pt.lat - minLat) / maxDelta;

        // Position on canvas (Y coordinates in canvas space go from top to bottom, so invert y)
        const pxX = mapX + margin + xNorm * innerW;
        const pxY = mapY + margin + (1 - yNorm) * innerH;

        if (idx === 0) {
          ctx.moveTo(pxX, pxY);
        } else {
          ctx.lineTo(pxX, pxY);
        }
      });
      ctx.stroke();

      // Start/End points
      const startPt = trip.path[0];
      const endPt = trip.path[trip.path.length - 1];

      const getCanvasPos = (pt: typeof startPt) => {
        const xNorm = dLng === 0 ? 0.5 : (pt.lng - minLng) / maxDelta;
        const yNorm = dLat === 0 ? 0.5 : (pt.lat - minLat) / maxDelta;
        return {
          x: mapX + margin + xNorm * innerW,
          y: mapY + margin + (1 - yNorm) * innerH
        };
      };

      const startPos = getCanvasPos(startPt);
      const endPos = getCanvasPos(endPt);

      // Start circle green
      ctx.fillStyle = '#00ff66';
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // End circle red
      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.arc(endPos.x, endPos.y, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Map placeholder text
      ctx.fillStyle = '#0c0c0e';
      ctx.fillRect(400, 110, 170, 170);
      ctx.fillStyle = '#57576c';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('No Path Logged', 485, 200);
      ctx.textAlign = 'left';
    }

    // 5. Download Trigger
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `OpenTrip-Summary-${trip.id.substring(0, 5)}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="card card-glowing-cyan" style={{ textAlign: 'left', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Trip Summary Card</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {new Date(trip.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        </div>
        <button className="btn btn-primary" onClick={handleDownloadImage} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
          <Download size={16} />
          <span>Save PNG</span>
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {/* Statistics highlights */}
        <div style={{ flex: 1, minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ borderLeft: '3px solid var(--neon-cyan)', paddingLeft: '8px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Distance</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--gauge-font)' }}>
              {displayDist.toFixed(2)} <span style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)' }}>{distUnit}</span>
            </div>
          </div>
          <div style={{ borderLeft: '3px solid var(--neon-cyan)', paddingLeft: '8px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Duration</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--gauge-font)' }}>
              {formatDuration(trip.duration)}
            </div>
          </div>
          <div style={{ borderLeft: '3px solid var(--neon-cyan)', paddingLeft: '8px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Max Speed</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--gauge-font)' }}>
              {Math.round(displayMaxSpeed)} <span style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)' }}>{speedUnit}</span>
            </div>
          </div>
        </div>

        {/* Max G Force statistics */}
        <div style={{ flex: 1, minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ borderLeft: '3px solid var(--neon-orange)', paddingLeft: '8px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Max Cornering</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--gauge-font)', color: 'var(--neon-orange)' }}>
              {trip.maxGForce.lat.toFixed(2)}G
            </div>
          </div>
          <div style={{ borderLeft: '3px solid var(--neon-green)', paddingLeft: '8px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Max Accel</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--gauge-font)', color: 'var(--neon-green)' }}>
              {trip.maxGForce.acc.toFixed(2)}G
            </div>
          </div>
          <div style={{ borderLeft: '3px solid var(--neon-red)', paddingLeft: '8px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Max Braking</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--gauge-font)', color: 'var(--neon-red)' }}>
              {trip.maxGForce.brk.toFixed(2)}G
            </div>
          </div>
        </div>

        {/* Route Shape Drawing inside share card (SVG path renderer) */}
        {trip.path && trip.path.length > 1 && (
          <div 
            style={{
              width: '120px',
              height: '120px',
              background: 'var(--bg-deep)',
              border: '1px solid var(--border-dim)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            <span style={{ position: 'absolute', top: '4px', left: '6px', fontSize: '0.6rem', color: 'var(--text-muted)' }}>ROUTE</span>
            <svg width="100" height="100" viewBox="-5 -5 110 110">
              {(() => {
                let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
                trip.path.forEach(pt => {
                  if (pt.lat < minLat) minLat = pt.lat;
                  if (pt.lat > maxLat) maxLat = pt.lat;
                  if (pt.lng < minLng) minLng = pt.lng;
                  if (pt.lng > maxLng) maxLng = pt.lng;
                });
                const dLat = maxLat - minLat;
                const dLng = maxLng - minLng;
                const delta = Math.max(dLat, dLng, 0.0001);

                const points = trip.path.map(pt => {
                  const xNorm = dLng === 0 ? 50 : ((pt.lng - minLng) / delta) * 100;
                  const yNorm = dLat === 0 ? 50 : (1 - (pt.lat - minLat) / delta) * 100; // invert y
                  return `${xNorm},${yNorm}`;
                });

                return (
                  <>
                    <polyline
                      fill="none"
                      stroke="var(--neon-green)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={points.join(' ')}
                    />
                    {/* Start dot green */}
                    <circle cx={points[0].split(',')[0]} cy={points[0].split(',')[1]} r="5" fill="var(--neon-green)" />
                    {/* End dot red */}
                    <circle cx={points[points.length - 1].split(',')[0]} cy={points[points.length - 1].split(',')[1]} r="6" fill="var(--neon-red)" />
                  </>
                );
              })()}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
