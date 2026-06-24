import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { getProfiles, deleteProfile } from '../services/db';
import { User, Trash2, Plus, LogIn } from 'lucide-react';

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%238e8e9f'><circle cx='12' cy='8' r='4'/><path d='M12 14c-6.1 0-8 4-8 4h16s-1.9-4-8-4z'/></svg>";

interface ProfileLoginProps {
  onLogin: (profile: UserProfile) => void;
  onCreateNew: () => void;
}

export const ProfileLogin: React.FC<ProfileLoginProps> = ({ onLogin, onCreateNew }) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Load existing profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const data = await getProfiles();
      setProfiles(data);
    } catch (err) {
      console.error('Error fetching driver profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, name: string) => {
    e.stopPropagation(); // Prevent logging in when clicking delete
    if (window.confirm(`Are you sure you want to delete driver profile "${name}"? All associated settings will be removed from this profile slot.`)) {
      try {
        await deleteProfile(name);
        await loadProfiles();
      } catch (err) {
        console.error('Error deleting profile:', err);
        alert('Failed to delete profile.');
      }
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: 0,
      background: 'linear-gradient(135deg, var(--bg-deep) 0%, var(--bg-card) 100%)',
      padding: '24px',
      color: 'var(--text-primary)',
      fontFamily: 'var(--sans-font), sans-serif',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Header Title */}
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(0, 229, 255, 0.05)',
            border: '1.5px solid var(--neon-cyan)',
            boxShadow: 'var(--glow-cyan)',
            marginBottom: '16px',
            color: 'var(--neon-cyan)'
          }}>
            <User size={32} />
          </div>
          <h1 style={{
            fontSize: '1.8rem',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '3px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            textShadow: '0 0 10px rgba(0, 229, 255, 0.3)'
          }}>
            OpenTrip
          </h1>
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginTop: '6px',
            display: 'block',
            fontWeight: 600
          }}>
            Driver Portal
          </span>
        </div>

        {/* Profiles Card List */}
        <div className="card card-glowing-cyan" style={{
          padding: '24px',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'var(--text-secondary)',
            borderBottom: '1px solid var(--border-dim)',
            paddingBottom: '8px'
          }}>
            Select Driver Profile
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Loading driver directory...
            </div>
          ) : profiles.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: 'var(--text-secondary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px dashed var(--border-bright)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)'
              }}>
                <User size={20} />
              </div>
              <span style={{ fontSize: '0.85rem' }}>No driver profiles found on this device.</span>
              <button 
                className="btn btn-primary"
                onClick={onCreateNew}
                style={{ padding: '12px 20px', fontSize: '0.85rem', width: '100%', marginTop: '8px', borderRadius: '12px' }}
              >
                <Plus size={16} />
                <span>Create First Driver</span>
              </button>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '300px',
              overflowY: 'auto',
              paddingRight: '4px'
            }}>
              {profiles.map((profile) => (
                <div 
                  key={profile.name}
                  onClick={() => onLogin(profile)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-dim)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--neon-cyan)';
                    e.currentTarget.style.background = 'var(--bg-card-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-dim)';
                    e.currentTarget.style.background = 'var(--bg-input)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Avatar */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-dim)',
                      backgroundImage: profile.avatarUrl && profile.avatarUrl !== DEFAULT_AVATAR ? `url(${profile.avatarUrl})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)'
                    }}>
                      {(!profile.avatarUrl || profile.avatarUrl === DEFAULT_AVATAR) && <User size={18} />}
                    </div>

                    {/* Meta */}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{profile.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Garage: {profile.vehicles?.length || 0} vehicle{(profile.vehicles?.length || 0) === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      className="btn"
                      style={{
                        padding: '6px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--neon-red)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      onClick={(e) => handleDelete(e, profile.name)}
                      title="Delete Profile"
                    >
                      <Trash2 size={16} />
                    </button>
                    <LogIn size={16} style={{ color: 'var(--neon-cyan)', opacity: 0.7 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {profiles.length > 0 && (
            <button 
              className="btn btn-outline"
              onClick={onCreateNew}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.85rem',
                borderStyle: 'dashed',
                borderColor: 'var(--border-bright)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px',
                borderRadius: '12px'
              }}
            >
              <Plus size={16} />
              <span>Create New Driver</span>
            </button>
          )}
        </div>

        {/* Footer info */}
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
          OpenTrip local database mode. Profiles are securely stored on this device.
        </span>
      </div>
    </div>
  );
};
