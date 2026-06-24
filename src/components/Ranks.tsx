import React, { useState, useEffect } from 'react';
import { Trip, UserProfile } from '../types';
import { Trophy, Award, Target, Zap, Shield, ArrowUp, Star } from 'lucide-react';
import { getProfiles, getTrips } from '../services/db';

interface RanksProps {
  tripsList: Trip[];
  profile: UserProfile;
}

interface LeaderboardEntry {
  name: string;
  avatarColor: string;
  isUser: boolean;
  xp: number;
  level: number;
  classRank: string;
  distance: number;
  maxSpeed: number;
}

// Helper to determine Rank Title & Colors
export const getRankDetails = (level: number) => {
  if (level >= 20) {
    return { title: 'Asphalt Legend', classRank: 'Class S', color: 'var(--neon-red)', glow: 'var(--glow-red)' };
  } else if (level >= 15) {
    return { title: 'Pro Racer', classRank: 'Class A', color: '#bd00ff', glow: '0 0 10px rgba(189, 0, 255, 0.4)' };
  } else if (level >= 10) {
    return { title: 'Apex Carver', classRank: 'Class B', color: 'var(--neon-orange)', glow: 'var(--glow-orange)' };
  } else if (level >= 6) {
    return { title: 'Telemetry Analyst', classRank: 'Class C', color: 'var(--neon-cyan)', glow: 'var(--glow-cyan)' };
  } else if (level >= 3) {
    return { title: 'Cruiser', classRank: 'Class D', color: 'var(--neon-green)', glow: 'var(--glow-green)' };
  } else {
    return { title: 'Rookie Driver', classRank: 'Class E', color: '#8e8e9f', glow: 'none' };
  }
};

export const Ranks: React.FC<RanksProps> = ({ tripsList, profile }) => {
  // 1. Calculate user's dynamic XP & Level based on trips history
  const totalDistance = tripsList.reduce((sum, t) => sum + t.distance, 0);
  const totalTrips = tripsList.length;
  const totalDurationSec = tripsList.reduce((sum, t) => sum + t.duration, 0);
  const userMaxSpeed = tripsList.reduce((max, t) => Math.max(max, t.maxSpeed), 0);

  // Math XP formula: 100 XP per km + 250 XP per trip completed + 10 XP per minute driving
  const totalXP = Math.floor(totalDistance * 100) + (totalTrips * 250) + Math.floor(totalDurationSec / 60) * 10;
  
  // Level Formula: Level = Math.floor(Math.sqrt(XP / 100)) + 1
  const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;

  // XP benchmarks
  const currentLevelBenchmark = (level - 1) * (level - 1) * 100;
  const nextLevelBenchmark = level * level * 100;
  const xpIntoCurrentLevel = totalXP - currentLevelBenchmark;
  const xpNeededForNextLevel = nextLevelBenchmark - currentLevelBenchmark;
  const levelProgressPct = Math.min(100, Math.max(0, (xpIntoCurrentLevel / xpNeededForNextLevel) * 100));

  const rank = getRankDetails(level);

  // 2. Setup dynamic local drivers from database (no mock/fake data)
  const [leaderboardList, setLeaderboardList] = useState<LeaderboardEntry[]>([]);
  const [userLeaderboardRank, setUserLeaderboardRank] = useState<number>(1);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoadingLeaderboard(true);
        const allProfiles = await getProfiles();
        const allTrips = await getTrips();

        const entries: LeaderboardEntry[] = allProfiles.map((p: UserProfile) => {
          // Filter trips for this profile.
          // Map legacy trips (no driverName) to the active profile if this is the active user.
          const pTrips = allTrips.filter(t => {
            if (p.name === profile.name) {
              return !t.driverName || t.driverName === p.name;
            }
            return t.driverName === p.name;
          });

          const pDistance = pTrips.reduce((sum, t) => sum + t.distance, 0);
          const pTripsCount = pTrips.length;
          const pDurationSec = pTrips.reduce((sum, t) => sum + t.duration, 0);
          const pMaxSpeed = pTrips.reduce((max, t) => Math.max(max, t.maxSpeed), 0);

          // Calculate XP & Level
          const pXP = Math.floor(pDistance * 100) + (pTripsCount * 250) + Math.floor(pDurationSec / 60) * 10;
          const pLevel = Math.floor(Math.sqrt(pXP / 100)) + 1;
          const pRank = getRankDetails(pLevel);

          return {
            name: p.name,
            avatarColor: pRank.color,
            isUser: p.name === profile.name,
            xp: pXP,
            level: pLevel,
            classRank: pRank.classRank,
            distance: Math.round(pDistance * 10) / 10,
            maxSpeed: Math.round(pMaxSpeed)
          };
        });

        // Ensure active profile is always present
        const hasActiveProfile = entries.some(e => e.isUser);
        if (!hasActiveProfile) {
          const userEntry: LeaderboardEntry = {
            name: profile.name,
            avatarColor: rank.color,
            isUser: true,
            xp: totalXP,
            level: level,
            classRank: rank.classRank,
            distance: Math.round(totalDistance * 10) / 10,
            maxSpeed: Math.round(userMaxSpeed)
          };
          entries.push(userEntry);
        }

        // Sort by XP descending
        entries.sort((a, b) => b.xp - a.xp);

        setLeaderboardList(entries);
        const rankIdx = entries.findIndex(e => e.isUser) + 1;
        setUserLeaderboardRank(rankIdx);
      } catch (err) {
        console.error('Failed to compile dynamic leaderboard:', err);
      } finally {
        setLoadingLeaderboard(false);
      }
    }

    loadLeaderboard();
  }, [profile.name, tripsList]);

  // 3. Structured Ranks list for Progression Map
  const RANK_LADDER = [
    { classRank: 'Class S', title: 'Asphalt Legend', minLevel: 20, desc: 'Master driver with exceptional telemetry metrics.', color: 'var(--neon-red)' },
    { classRank: 'Class A', title: 'Pro Racer', minLevel: 15, desc: 'Professional track driving skills and precision cornering.', color: '#bd00ff' },
    { classRank: 'Class B', title: 'Apex Carver', minLevel: 10, desc: 'Handles high lateral G-forces with ease.', color: 'var(--neon-orange)' },
    { classRank: 'Class C', title: 'Telemetry Analyst', minLevel: 6, desc: 'Understand speed limits and alert tracking patterns.', color: 'var(--neon-cyan)' },
    { classRank: 'Class D', title: 'Cruiser', minLevel: 3, desc: 'Completes longer journeys and builds driver stamina.', color: 'var(--neon-green)' },
    { classRank: 'Class E', title: 'Rookie Driver', minLevel: 1, desc: 'Starting point. Learn tracking and G-Force dynamics.', color: '#8e8e9f' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '24px' }}>
      
      {/* Dynamic Profile Progress Card */}
      <div className={`card card-glowing-cyan`} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Driver Rank</span>
            <h2 style={{ margin: 0, textTransform: 'uppercase', fontWeight: 800, fontSize: '1.5rem', color: rank.color, textShadow: rank.glow }}>
              {rank.title}
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{rank.classRank} · Rank #{userLeaderboardRank} Globally</span>
          </div>

          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: 'rgba(0, 229, 255, 0.03)',
            border: `1px solid ${rank.color}`,
            boxShadow: rank.glow,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Level</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--gauge-font)', color: 'var(--text-primary)', lineHeight: '1' }}>{level}</span>
          </div>
        </div>

        {/* Progress bar to next level */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            <span>{totalXP.toLocaleString()} XP Total</span>
            <span>{Math.max(0, nextLevelBenchmark - totalXP).toLocaleString()} XP to Level {level + 1}</span>
          </div>

          {/* Glowing bar */}
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${levelProgressPct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--neon-cyan) 0%, var(--neon-green) 100%)',
              boxShadow: '0 0 8px var(--neon-cyan)',
              borderRadius: '4px',
              transition: 'width 0.5s ease-out'
            }} />
          </div>
        </div>

        {/* Dynamic driver statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderTop: '1px solid var(--border-dim)',
          paddingTop: '12px',
          marginTop: '4px',
          textAlign: 'center',
          gap: '8px'
        }}>
          <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Trips Logged</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--gauge-font)' }}>{totalTrips}</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-dim)', borderRight: '1px solid var(--border-dim)' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Distance</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--gauge-font)' }}>
              {totalDistance.toFixed(1)} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>km</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Personal Best</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--neon-orange)', fontFamily: 'var(--gauge-font)' }}>
              {Math.round(userMaxSpeed)} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Leaderboard Section */}
      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-dim)', paddingBottom: '8px', marginBottom: '4px' }}>
          <Trophy size={18} style={{ color: 'var(--neon-orange)' }} />
          <h3 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-primary)' }}>
            Global Leaderboard
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-dim)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px', fontSize: '0.65rem', textTransform: 'uppercase' }}>Rank</th>
                <th style={{ padding: '8px', fontSize: '0.65rem', textTransform: 'uppercase' }}>Driver</th>
                <th style={{ padding: '8px', fontSize: '0.65rem', textTransform: 'uppercase' }}>Tier</th>
                <th style={{ padding: '8px', fontSize: '0.65rem', textTransform: 'uppercase', textAlign: 'right' }}>Distance</th>
                <th style={{ padding: '8px', fontSize: '0.65rem', textTransform: 'uppercase', textAlign: 'right' }}>Level</th>
                <th style={{ padding: '8px', fontSize: '0.65rem', textTransform: 'uppercase', textAlign: 'right' }}>XP</th>
              </tr>
            </thead>
            <tbody>
              {loadingLeaderboard ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    Loading global leaderboard rankings...
                  </td>
                </tr>
              ) : leaderboardList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No drivers logged on this device.
                  </td>
                </tr>
              ) : (
                leaderboardList.map((entry, idx) => {
                  const rankNum = idx + 1;
                  return (
                    <tr 
                      key={entry.name}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.02)',
                        background: entry.isUser ? 'rgba(0, 229, 255, 0.05)' : 'transparent',
                        color: entry.isUser ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: entry.isUser ? 700 : 400,
                        boxShadow: entry.isUser ? 'inset 0 0 10px rgba(0, 229, 255, 0.05)' : 'none'
                      }}
                    >
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {rankNum === 1 && <Star size={14} style={{ color: 'var(--neon-orange)', fill: 'var(--neon-orange)' }} />}
                          {rankNum === 2 && <Star size={14} style={{ color: '#bd00ff', fill: '#bd00ff' }} />}
                          {rankNum === 3 && <Star size={14} style={{ color: 'var(--neon-cyan)', fill: 'var(--neon-cyan)' }} />}
                          <span>#{rankNum}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: entry.avatarColor,
                            boxShadow: `0 0 6px ${entry.avatarColor}`
                          }} />
                          <span>{entry.name} {entry.isUser && <span style={{ fontSize: '0.65rem', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>(You)</span>}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{ fontSize: '0.75rem', color: entry.avatarColor }}>{entry.classRank}</span>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--gauge-font)' }}>
                        {entry.distance.toFixed(1)} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>km</span>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', fontFamily: 'var(--gauge-font)' }}>
                        {entry.level}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--gauge-font)', color: entry.isUser ? 'var(--neon-cyan)' : 'var(--text-primary)' }}>
                        {entry.xp.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Progression Ladder */}
      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-dim)', paddingBottom: '8px', marginBottom: '4px' }}>
          <Award size={18} style={{ color: 'var(--neon-green)' }} />
          <h3 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-primary)' }}>
            Driver Ranks & Progression
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {RANK_LADDER.map((ladderItem) => {
            const isUnlocked = level >= ladderItem.minLevel;
            return (
              <div 
                key={ladderItem.classRank}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: isUnlocked ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.1)',
                  border: isUnlocked ? `1px solid rgba(255, 255, 255, 0.03)` : '1px dashed rgba(255, 255, 255, 0.05)',
                  opacity: isUnlocked ? 1 : 0.45
                }}
              >
                {/* Level Unlock Indicator */}
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  background: isUnlocked ? 'rgba(255,255,255,0.02)' : 'transparent',
                  border: `1.5px solid ${isUnlocked ? ladderItem.color : 'var(--text-muted)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: isUnlocked ? `0 0 10px rgba(${ladderItem.color.includes('red') ? '255,0,85' : ladderItem.color.includes('green') ? '0,255,102' : ladderItem.color.includes('orange') ? '255,140,0' : '0,229,255'}, 0.15)` : 'none'
                }}>
                  <span style={{ fontSize: '0.55rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>LVL</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: isUnlocked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{ladderItem.minLevel}</span>
                </div>

                {/* Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: ladderItem.color }}>{ladderItem.classRank}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>·</span>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ladderItem.title}</span>
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {ladderItem.desc}
                  </p>
                </div>

                {/* Lock Status Icon */}
                <div style={{ flexShrink: 0, color: isUnlocked ? ladderItem.color : 'var(--text-muted)' }}>
                  {isUnlocked ? (
                    <Zap size={16} fill={ladderItem.color} style={{ filter: `drop-shadow(0 0 4px ${ladderItem.color})` }} />
                  ) : (
                    <Shield size={16} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
};
