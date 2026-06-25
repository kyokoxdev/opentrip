import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Trip, AppSettings, UserProfile, Vehicle } from '../types';
import { User, Trophy, Calendar, Compass, Shield, Clock, Zap, Bike, Car, ArrowLeft, ArrowUpDown, Camera, Wrench, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { PastTripMap } from './PastTripMap';
import { TelemetryCharts } from './TelemetryCharts';
import { ShareCard } from './ShareCard';

interface ProfileProps {
  trips: Trip[];
  settings: AppSettings;
  onUpdateProfile: (profile: UserProfile) => void;
  onLogout?: () => void;
}

const VEHICLE_DATA = {
  car: {
    name: 'Car / SUV',
    icon: Car,
    color: 'var(--neon-cyan)',
    desc: 'Passenger car telemetry profiles. Tracks speeds, standard braking, and lateral steering Gs.'
  },
  motorcycle: {
    name: 'Motorcycle',
    icon: Zap,
    color: 'var(--neon-purple)',
    desc: 'Motorized two-wheel vehicle profiles. Tracks lean angle G-forces and quick accelerations.'
  },
  bicycle: {
    name: 'Bicycle',
    icon: Bike,
    color: 'var(--neon-green)',
    desc: 'Manual cycle travel profiling. Focuses on trail routes and cardiovascular output.'
  },
  'e-scooter': {
    name: 'E-Scooter / Board',
    icon: Zap,
    color: 'var(--neon-orange)',
    desc: 'Micro-mobility dashboard presets. Tracks shocks and low-profile urban commutes.'
  },
  other: {
    name: 'Other Vehicle',
    icon: User,
    color: 'var(--text-primary)',
    desc: 'Generic travel logging. Basic speed and telemetry calculations.'
  }
};

const SPECIFIC_VEHICLES = {
  car: [
    { value: 'sedan', label: 'Sedan / Hatchback' },
    { value: 'suv', label: 'SUV / Crossover' },
    { value: 'sports_car', label: 'Sports Car / Coupe' },
    { value: 'truck', label: 'Truck / Pickup' },
    { value: 'ev', label: 'Electric Vehicle (EV)' },
    { value: 'other', label: 'Other Car' }
  ],
  motorcycle: [
    { value: 'sportbike', label: 'Sportbike / Superbike' },
    { value: 'cruiser', label: 'Cruiser / Chopper' },
    { value: 'dirtbike', label: 'Dirt Bike / Enduro' },
    { value: 'scooter', label: 'Scooter / Moped' },
    { value: 'touring', label: 'Touring / Adventure' },
    { value: 'other', label: 'Other Motorcycle' }
  ],
  bicycle: [
    { value: 'road', label: 'Road Bike' },
    { value: 'mtb', label: 'Mountain Bike (MTB)' },
    { value: 'gravel', label: 'Gravel / CX Bike' },
    { value: 'city', label: 'City / Commuter Bike' },
    { value: 'ebike', label: 'Electric Bike (E-Bike)' },
    { value: 'other', label: 'Other Bicycle' }
  ],
  'e-scooter': [
    { value: 'kick_scooter', label: 'Electric Kick Scooter' },
    { value: 'skateboard', label: 'Electric Skateboard / Onewheel' },
    { value: 'unicycle', label: 'Electric Unicycle (EUC)' },
    { value: 'other', label: 'Other E-Ride' }
  ],
  other: [
    { value: 'walking', label: 'Walking / Hiking' },
    { value: 'running', label: 'Running / Jogging' },
    { value: 'wheelchair', label: 'Wheelchair' },
    { value: 'other', label: 'Custom telemetry profile' }
  ]
};

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%238e8e9f'><circle cx='12' cy='8' r='4'/><path d='M12 14c-6.1 0-8 4-8 4h16s-1.9-4-8-4z'/></svg>";
const DEFAULT_VEHICLE_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238e8e9f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v6c0 .6.4 1 1 1h2'/><circle cx='7' cy='17' r='3'/><circle cx='17' cy='17' r='3'/></svg>";

const getSpecificVehicleLabel = (type: string, subType: string) => {
  const list = SPECIFIC_VEHICLES[type as keyof typeof SPECIFIC_VEHICLES] || [];
  const item = list.find(s => s.value === subType);
  return item ? item.label : subType;
};

const FUEL_LABELS = {
  electric: 'Electric',
  gasoline: 'Gasoline',
  diesel: 'Diesel',
  hybrid: 'Hybrid',
  human: 'Human Powered',
  other: 'Other'
};

export const Profile: React.FC<ProfileProps> = ({
  trips,
  settings,
  onUpdateProfile,
  onLogout
}) => {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [activeTelemetryIndex, setActiveTelemetryIndex] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'speed' | 'distance' | 'gforce'>('speed');
  
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vehicleImageInputRef = useRef<HTMLInputElement>(null);

  const profile = settings.userProfile;
  const activeVehicle = profile?.vehicles?.find(v => v.id === profile?.activeVehicleId) || profile?.vehicles?.[0];
  const vehicleDetail: Vehicle = activeVehicle || {
    id: 'default-vehicle-id',
    name: 'My Ride',
    type: 'car',
    specificVehicle: 'sedan',
    manufacturer: 'Unknown',
    modelYear: new Date().getFullYear().toString(),
    fuelType: 'electric',
    imageUrl: DEFAULT_VEHICLE_IMAGE,
    licensePlate: 'N/A',
    images: []
  };

  const isImperial = settings.units === 'imperial';
  const distUnit = isImperial ? 'mi' : 'km';
  const speedUnit = isImperial ? 'mph' : 'km/h';
  const speedMultiplier = isImperial ? 0.621371 : 1;

  // Edit states
  const [editVehicleType, setEditVehicleType] = useState(profile?.vehicleType || 'car');
  const [editSpecificVehicle, setEditSpecificVehicle] = useState(profile?.specificVehicle || 'sedan');
  const [vNickname, setVNickname] = useState(vehicleDetail.name || '');
  const [vManufacturer, setVManufacturer] = useState(vehicleDetail.manufacturer || '');
  const [vModelYear, setVModelYear] = useState(vehicleDetail.modelYear || '');
  const [vFuelType, setVFuelType] = useState<keyof typeof FUEL_LABELS>(vehicleDetail.fuelType as any || 'electric');
  const [vLicensePlate, setVLicensePlate] = useState(vehicleDetail.licensePlate || '');
  const [vImageUrl, setVImageUrl] = useState(vehicleDetail.imageUrl || DEFAULT_VEHICLE_IMAGE);
  
  // Detailed specs states
  const [vPurchaseDate, setVPurchaseDate] = useState(vehicleDetail.purchaseDate || '');
  const [vManufactureDate, setVManufactureDate] = useState(vehicleDetail.manufactureDate || '');
  const [vEngineDisplacement, setVEngineDisplacement] = useState(vehicleDetail.engineDisplacement || '');
  const [vNotes, setVNotes] = useState(vehicleDetail.notes || '');
  const [vImages, setVImages] = useState<string[]>(
    vehicleDetail.images || 
    (vehicleDetail.imageUrl && vehicleDetail.imageUrl !== DEFAULT_VEHICLE_IMAGE ? [vehicleDetail.imageUrl] : [])
  );
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [garageSlideIdx, setGarageSlideIdx] = useState(0);
  const [vehicleCoverIdxs, setVehicleCoverIdxs] = useState<Record<string, number>>({});
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  const sortedVehicles = useMemo(() => {
    if (!profile || !profile.vehicles) return [];
    const active = profile.vehicles.find(v => v.id === profile.activeVehicleId);
    const others = profile.vehicles.filter(v => v.id !== profile.activeVehicleId);
    return active ? [active, ...others] : others;
  }, [profile]);

  useEffect(() => {
    setGarageSlideIdx(0);
  }, [profile?.activeVehicleId]);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditingVehicle || isAddingVehicle) return;
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isEditingVehicle || isAddingVehicle) return;
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (isEditingVehicle || isAddingVehicle) return;
    if (
      touchStartX.current === null ||
      touchEndX.current === null ||
      touchStartY.current === null ||
      touchEndY.current === null
    )
      return;

    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;
    const thresholdX = 40;
    const thresholdY = 60;

    if (Math.abs(diffX) > thresholdX && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        if (garageSlideIdx < sortedVehicles.length) {
          setGarageSlideIdx(prev => prev + 1);
        }
      } else {
        if (garageSlideIdx > 0) {
          setGarageSlideIdx(prev => prev - 1);
        }
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  const handleSelectThumbnail = (vhId: string, idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setVehicleCoverIdxs(prev => ({
      ...prev,
      [vhId]: idx
    }));
  };

  // 1. Calculate General Aggregates
  const stats = useMemo(() => {
    let totalDist = 0;
    let totalTime = 0;
    let maxSpeed = 0;
    let maxDist = 0;
    let maxG = 0;

    trips.forEach(t => {
      totalDist += t.distance;
      totalTime += t.duration;
      if (t.maxSpeed > maxSpeed) maxSpeed = t.maxSpeed;
      if (t.distance > maxDist) maxDist = t.distance;
      
      const peakG = Math.max(t.maxGForce.lat, t.maxGForce.acc, t.maxGForce.brk);
      if (peakG > maxG) maxG = peakG;
    });

    return {
      totalTrips: trips.length,
      totalDistance: totalDist * speedMultiplier,
      totalDuration: totalTime,
      maxSpeed: maxSpeed * speedMultiplier,
      maxDistance: maxDist * speedMultiplier,
      maxG
    };
  }, [trips, speedMultiplier]);

  // 2. Sort trips by "Best" metric
  const sortedTrips = useMemo(() => {
    const tripsCopy = [...trips];
    return tripsCopy.sort((a, b) => {
      if (sortBy === 'speed') {
        return b.maxSpeed - a.maxSpeed;
      } else if (sortBy === 'distance') {
        return b.distance - a.distance;
      } else {
        const peakGB = Math.max(b.maxGForce.lat, b.maxGForce.acc, b.maxGForce.brk);
        const peakGA = Math.max(a.maxGForce.lat, a.maxGForce.acc, a.maxGForce.brk);
        return peakGB - peakGA;
      }
    });
  }, [trips, sortBy]);

  // 3. Process telemetry logs for selected trip
  const telemetryLogs = useMemo(() => {
    if (!selectedTrip) return [];
    if (selectedTrip.telemetryLogs && selectedTrip.telemetryLogs.length > 0) {
      return selectedTrip.telemetryLogs;
    }
    if (!selectedTrip.path || selectedTrip.path.length === 0) {
      return [];
    }

    const getHeading = (p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) => {
      const dLat = p2.lat - p1.lat;
      const dLng = p2.lng - p1.lng;
      return Math.atan2(dLng, dLat) * 180 / Math.PI;
    };

    return selectedTrip.path.map((coord, idx) => {
      let latG = 0;
      let accG = 0;
      let brkG = 0;
      
      if (idx > 0) {
        const prev = selectedTrip.path[idx - 1];
        const dt = (coord.timestamp - prev.timestamp) / 1000;
        if (dt > 0) {
          const dv = (coord.speed - prev.speed) / 3.6;
          const accel = dv / dt;
          const longG = accel / 9.81;
          if (longG > 0) {
            accG = longG;
          } else {
            brkG = Math.abs(longG);
          }

          let headingDiff = 0;
          if (coord.heading !== null && prev.heading !== null) {
            headingDiff = coord.heading - prev.heading;
          } else {
            const h1 = idx > 1 ? getHeading(selectedTrip.path[idx - 2], prev) : 0;
            const h2 = getHeading(prev, coord);
            headingDiff = h2 - h1;
          }
          if (headingDiff > 180) headingDiff -= 360;
          if (headingDiff < -180) headingDiff += 360;
          const turnRateRadSec = (headingDiff * Math.PI) / (180 * dt);
          const speedMps = coord.speed / 3.6;
          const lateralAccel = speedMps * turnRateRadSec;
          latG = lateralAccel / 9.81;
        }
      }
      
      return {
        timestamp: coord.timestamp,
        speed: coord.speed,
        gForce: {
          x: latG,
          y: accG - brkG
        }
      };
    });
  }, [selectedTrip]);

  const handleTripSelect = (trip: Trip) => {
    setSelectedTrip(trip);
    setActiveTelemetryIndex(null);
  };

  const handleBackToProfile = () => {
    setSelectedTrip(null);
    setActiveTelemetryIndex(null);
  };

  const formatDuration = (sec: number): string => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins} mins`;
  };

  const handleEditVehicleToggle = (specificVehicle?: Vehicle) => {
    if (profile) {
      const targetVehicle = specificVehicle || sortedVehicles[garageSlideIdx];
      if (!targetVehicle) return;

      // Load current profile state into edit fields
      setEditVehicleType(targetVehicle.type || 'car');
      setEditSpecificVehicle(targetVehicle.specificVehicle || 'sedan');
      setVNickname(targetVehicle.name);
      setVManufacturer(targetVehicle.manufacturer);
      setVModelYear(targetVehicle.modelYear);
      setVFuelType(targetVehicle.fuelType as any);
      setVLicensePlate(targetVehicle.licensePlate);
      setVImageUrl(targetVehicle.imageUrl || DEFAULT_VEHICLE_IMAGE);
      
      setVPurchaseDate(targetVehicle.purchaseDate || '');
      setVManufactureDate(targetVehicle.manufactureDate || '');
      setVEngineDisplacement(targetVehicle.engineDisplacement || '');
      setVNotes(targetVehicle.notes || '');
      setVImages(
        targetVehicle.images || 
        (targetVehicle.imageUrl && targetVehicle.imageUrl !== DEFAULT_VEHICLE_IMAGE ? [targetVehicle.imageUrl] : [])
      );
      setEditingVehicleId(targetVehicle.id);
      setIsEditingVehicle(true);
      setIsAddingVehicle(false);
    } else {
      setIsEditingVehicle(false);
      setEditingVehicleId(null);
    }
  };

  const handleVehicleTypeChangeInEdit = (type: 'car' | 'motorcycle' | 'bicycle' | 'e-scooter' | 'other') => {
    setEditVehicleType(type);
    setEditSpecificVehicle(SPECIFIC_VEHICLES[type][0].value);
    
    // Auto-update fuel preset
    if (type === 'bicycle') setVFuelType('human');
    else if (type === 'e-scooter') setVFuelType('electric');
  };

  const handleSaveVehicleDetails = () => {
    if (!profile || !editingVehicleId) return;
    
    const updatedVehicles = profile.vehicles.map(v => {
      if (v.id === editingVehicleId) {
        return {
          ...v,
          type: editVehicleType,
          specificVehicle: editSpecificVehicle,
          name: vNickname.trim() || 'My Ride',
          manufacturer: vManufacturer.trim() || 'Unknown',
          modelYear: vModelYear.trim() || new Date().getFullYear().toString(),
          fuelType: vFuelType,
          imageUrl: vImages[0] || DEFAULT_VEHICLE_IMAGE,
          licensePlate: vLicensePlate.trim() || 'N/A',
          purchaseDate: vPurchaseDate || undefined,
          manufactureDate: vManufactureDate || undefined,
          engineDisplacement: vEngineDisplacement.trim() || undefined,
          notes: vNotes.trim() || undefined,
          images: vImages
        };
      }
      return v;
    });

    onUpdateProfile({
      ...profile,
      vehicles: updatedVehicles
    });
    
    setIsEditingVehicle(false);
    setEditingVehicleId(null);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && profile) {
      if (file.size > 1.5 * 1024 * 1024) {
        alert('Image size must be smaller than 1.5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateProfile({
            ...profile,
            avatarUrl: event.target.result as string
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVehicleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const remainingSlots = 5 - vImages.length;
      if (files.length > remainingSlots) {
        alert(`You can upload at most 5 images (current: ${vImages.length}, selected: ${files.length}).`);
        return;
      }
      
      const fileLoadPromises = Array.from(files).map(file => {
        return new Promise<string>((resolve, reject) => {
          if (file.size > 1.5 * 1024 * 1024) {
            reject(new Error('One or more image files exceed the 1.5MB size limit.'));
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              resolve(event.target.result as string);
            } else {
              reject(new Error('Failed to convert image.'));
            }
          };
          reader.onerror = () => reject(new Error('File read error.'));
          reader.readAsDataURL(file);
        });
      });

      Promise.all(fileLoadPromises)
        .then(newBase64s => {
          setVImages(prev => {
            const updated = [...prev, ...newBase64s];
            if (updated.length > 0) {
              setVImageUrl(updated[0]);
            }
            return updated;
          });
        })
        .catch(err => {
          alert(err.message || 'Error processing vehicle images.');
        });
    }
  };

  const removeVehicleImage = (indexToRemove: number) => {
    setVImages(prev => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (updated.length > 0) {
        setVImageUrl(updated[0]);
      } else {
        setVImageUrl(DEFAULT_VEHICLE_IMAGE);
      }
      return updated;
    });
  };

  const triggerFileInput = () => fileInputRef.current?.click();
  const triggerVehicleImageInput = () => vehicleImageInputRef.current?.click();

  const handleSaveNewVehicle = () => {
    if (!profile) return;
    if (!vNickname.trim()) {
      alert('Please enter a nickname for the new vehicle.');
      return;
    }
    const newId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
    const newVehicle = {
      id: newId,
      name: vNickname.trim(),
      type: editVehicleType,
      specificVehicle: editSpecificVehicle,
      manufacturer: vManufacturer.trim() || 'Unknown',
      modelYear: vModelYear.trim() || new Date().getFullYear().toString(),
      fuelType: vFuelType,
      imageUrl: vImages[0] || DEFAULT_VEHICLE_IMAGE,
      licensePlate: vLicensePlate.trim() || 'N/A',
      purchaseDate: vPurchaseDate || undefined,
      manufactureDate: vManufactureDate || undefined,
      engineDisplacement: vEngineDisplacement.trim() || undefined,
      notes: vNotes.trim() || undefined,
      images: vImages
    };

    onUpdateProfile({
      ...profile,
      vehicles: [...(profile.vehicles || []), newVehicle],
      activeVehicleId: newId // Set the newly added vehicle as active
    });
    setIsAddingVehicle(false);
  };

  const handleDeleteVehicle = (vehicleIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selection when deleting
    if (!profile) return;
    if ((profile.vehicles || []).length <= 1) {
      alert('You must keep at least one vehicle in your garage.');
      return;
    }
    if (window.confirm('Are you sure you want to remove this vehicle from your garage?')) {
      const remainingVehicles = profile.vehicles.filter(v => v.id !== vehicleIdToDelete);
      let nextActiveId = profile.activeVehicleId;
      if (profile.activeVehicleId === vehicleIdToDelete) {
        nextActiveId = remainingVehicles[0].id;
      }
      onUpdateProfile({
        ...profile,
        vehicles: remainingVehicles,
        activeVehicleId: nextActiveId
      });
      setActiveImageIdx(0); // Reset carousel index
    }
  };

  if (!profile) return null;

  const currentVehicle = VEHICLE_DATA[vehicleDetail.type || 'car'];
  const VehicleIcon = currentVehicle.icon;

  // Render selected trip telemetry directly in the profile context
  if (selectedTrip) {
    const displayDist = isImperial ? selectedTrip.distance * 0.621371 : selectedTrip.distance;
    const displayMaxSpeed = isImperial ? selectedTrip.maxSpeed * 0.621371 : selectedTrip.maxSpeed;
    const displayAvgSpeed = isImperial ? selectedTrip.avgSpeed * 0.621371 : selectedTrip.avgSpeed;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
        <button 
          className="btn btn-outline" 
          onClick={handleBackToProfile}
          style={{ alignSelf: 'flex-start', padding: '8px 14px', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Profile</span>
        </button>

        {/* Stats card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', textTransform: 'uppercase', margin: 0 }}>Record Performance Detail</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {new Date(selectedTrip.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
              </span>
            </div>
            <div style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-bright)', background: 'var(--bg-input)', fontSize: '0.7rem', color: 'var(--neon-cyan)', fontFamily: 'var(--mono-font)' }}>
              🏆 RECORD RUN
            </div>
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

        {/* Map */}
        {selectedTrip.path && selectedTrip.path.length > 0 && (
          <div className="card" style={{ padding: '12px' }}>
            <PastTripMap 
              path={selectedTrip.path}
              mapProvider={settings.mapProvider}
              googleMapsApiKey={settings.googleMapsApiKey}
              theme={settings.theme}
              activeTelemetryIndex={activeTelemetryIndex}
            />
          </div>
        )}

        {/* Charts */}
        {telemetryLogs.length > 0 && (
          <TelemetryCharts 
            telemetryLogs={telemetryLogs}
            units={settings.units}
            activeTelemetryIndex={activeTelemetryIndex}
            setActiveTelemetryIndex={setActiveTelemetryIndex}
          />
        )}

        {/* G-Force HUD */}
        <div className="card">
          <h3 style={{ textTransform: 'uppercase', color: 'var(--text-secondary)', fontSize: '0.85rem', letterSpacing: '1px', marginBottom: '12px' }}>
            Extreme G-Force Telemetry
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
            <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-dim)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Cornering</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--gauge-font)', color: 'var(--neon-orange)', marginTop: '4px' }}>
                {selectedTrip.maxGForce.lat.toFixed(2)}G
              </div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-dim)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Acceleration</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--gauge-font)', color: 'var(--neon-cyan)', marginTop: '4px' }}>
                {selectedTrip.maxGForce.acc.toFixed(2)}G
              </div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-dim)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Braking</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--gauge-font)', color: 'var(--neon-red)', marginTop: '4px' }}>
                {selectedTrip.maxGForce.brk.toFixed(2)}G
              </div>
            </div>
          </div>
        </div>

        <ShareCard trip={selectedTrip} units={settings.units} />
      </div>
    );
  }

  // Profile View
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={24} style={{ color: 'var(--neon-cyan)' }} />
          <h2 style={{ fontSize: '1.6rem', textTransform: 'uppercase', margin: 0 }}>Driver Profile</h2>
        </div>
        {onLogout && (
          <button 
            className="btn btn-outline"
            onClick={onLogout}
            style={{ padding: '6px 14px', fontSize: '0.75rem', borderRadius: '8px' }}
          >
            Logout
          </button>
        )}
      </div>

      {/* Profile Card Info */}
      <div className="card card-glowing-cyan" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Avatar sphere */}
          <div 
            onClick={triggerFileInput}
            style={{ 
              width: '68px', 
              height: '68px', 
              minWidth: '68px',
              minHeight: '68px',
              borderRadius: '50%', 
              flexShrink: 0,
              aspectRatio: '1 / 1',
              background: `radial-gradient(circle, ${currentVehicle.color}40 0%, ${currentVehicle.color}10 100%)`, 
              border: `2px solid ${currentVehicle.color}`,
              boxShadow: `0 0 15px ${currentVehicle.color}30`,
              backgroundImage: profile.avatarUrl !== DEFAULT_AVATAR ? `url(${profile.avatarUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
            }}
            title="Click to change photo"
          >
            {profile.avatarUrl === DEFAULT_AVATAR && (
              <User size={28} style={{ color: 'var(--text-secondary)' }} />
            )}
            <div 
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                background: currentVehicle.color,
                color: '#000000',
                borderRadius: '50%',
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              <Camera size={8} />
            </div>
          </div>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h2 style={{ fontSize: '1.6rem', margin: 0, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
              {profile.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span 
                style={{ 
                  fontSize: '0.65rem', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  background: `${currentVehicle.color}25`,
                  color: currentVehicle.color,
                  border: `1px solid ${currentVehicle.color}35`
                }}
              >
                {getSpecificVehicleLabel(vehicleDetail.type, vehicleDetail.specificVehicle)}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Calendar size={10} />
                Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Global Summary Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', borderTop: '1px solid var(--border-dim)', paddingTop: '14px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Runs</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--gauge-font)', color: 'var(--text-primary)', marginTop: '2px' }}>
              {stats.totalTrips}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Odometer</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--gauge-font)', color: 'var(--text-primary)', marginTop: '2px' }}>
              {stats.totalDistance.toFixed(1)}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '1px' }}>{distUnit}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Drive Time</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--gauge-font)', color: 'var(--text-primary)', marginTop: '2px' }}>
              {formatDuration(stats.totalDuration)}
            </div>
          </div>
        </div>
      </div>

      {/* All-Time Trophies Records */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
        {/* Speed Trophy */}
        <div className="card" style={{ padding: '10px', textAlign: 'center', margin: 0, borderColor: 'rgba(0, 229, 255, 0.15)' }}>
          <Trophy size={18} style={{ color: 'var(--neon-cyan)', filter: 'drop-shadow(0 0 4px rgba(0, 229, 255, 0.4))' }} />
          <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '6px' }}>Max Speed</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--gauge-font)', color: 'var(--text-primary)', marginTop: '2px' }}>
            {Math.round(stats.maxSpeed)}
            <span style={{ fontSize: '0.7rem', color: 'var(--neon-cyan)' }}> {speedUnit}</span>
          </div>
        </div>

        {/* Distance Trophy */}
        <div className="card" style={{ padding: '10px', textAlign: 'center', margin: 0, borderColor: 'rgba(0, 255, 102, 0.15)' }}>
          <Compass size={18} style={{ color: 'var(--neon-green)', filter: 'drop-shadow(0 0 4px rgba(0, 255, 102, 0.4))' }} />
          <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '6px' }}>Longest Run</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--gauge-font)', color: 'var(--text-primary)', marginTop: '2px' }}>
            {stats.maxDistance.toFixed(1)}
            <span style={{ fontSize: '0.7rem', color: 'var(--neon-green)' }}> {distUnit}</span>
          </div>
        </div>

        {/* G Force Trophy */}
        <div className="card" style={{ padding: '10px', textAlign: 'center', margin: 0, borderColor: 'rgba(255, 159, 0, 0.15)' }}>
          <Shield size={18} style={{ color: 'var(--neon-orange)', filter: 'drop-shadow(0 0 4px rgba(255, 159, 0, 0.4))' }} />
          <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '6px' }}>Peak Force</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--gauge-font)', color: 'var(--text-primary)', marginTop: '2px' }}>
            {stats.maxG.toFixed(2)}
            <span style={{ fontSize: '0.7rem', color: 'var(--neon-orange)' }}> G</span>
          </div>
        </div>
      </div>

      {/* Unified Swipeable My Garage & Active Ride Carousel Card */}
      <div 
        className="card" 
        style={{ 
          margin: 0, 
          padding: '16px', 
          position: 'relative', 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ textTransform: 'uppercase', color: 'var(--text-secondary)', fontSize: '0.85rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <Wrench size={14} style={{ color: 'var(--neon-cyan)' }} />
            <span>My Garage & Active Ride</span>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              disabled={garageSlideIdx === 0}
              onClick={() => setGarageSlideIdx(prev => Math.max(0, prev - 1))}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-dim)',
                borderRadius: '6px',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: garageSlideIdx === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: garageSlideIdx === 0 ? 'default' : 'pointer',
                opacity: garageSlideIdx === 0 ? 0.3 : 1,
                transition: 'all 0.2s',
                padding: 0
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--mono-font)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px' }}>
              {garageSlideIdx + 1} / {sortedVehicles.length + 1}
            </span>
            <button
              type="button"
              disabled={garageSlideIdx === sortedVehicles.length}
              onClick={() => setGarageSlideIdx(prev => Math.min(sortedVehicles.length, prev + 1))}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-dim)',
                borderRadius: '6px',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: garageSlideIdx === sortedVehicles.length ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: garageSlideIdx === sortedVehicles.length ? 'default' : 'pointer',
                opacity: garageSlideIdx === sortedVehicles.length ? 0.3 : 1,
                transition: 'all 0.2s',
                padding: 0
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Carousel Outer Viewport */}
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden', padding: '12px 0' }}>
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              display: 'flex',
              transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: `translateX(-${garageSlideIdx * 100}%)`,
              width: '100%'
            }}
          >
            {/* Slide List: Existing Vehicles */}
            {sortedVehicles.map((vh) => {
              const isActive = vh.id === profile.activeVehicleId;
              const isEditing = isEditingVehicle && editingVehicleId === vh.id;
              const VehicleIcon = VEHICLE_DATA[vh.type || 'car']?.icon || Car;
              const themeColor = VEHICLE_DATA[vh.type || 'car']?.color || 'var(--neon-cyan)';
              
              // Images logic
              const vehicleImages = vh.images && vh.images.length > 0
                ? vh.images
                : (vh.imageUrl && vh.imageUrl !== DEFAULT_VEHICLE_IMAGE ? [vh.imageUrl] : []);
              const coverIdx = vehicleCoverIdxs[vh.id] || 0;
              const primaryImage = vehicleImages[coverIdx] || DEFAULT_VEHICLE_IMAGE;

              return (
                <div 
                  key={vh.id} 
                  style={{ 
                    width: '100%', 
                    flexShrink: 0, 
                    boxSizing: 'border-box', 
                    padding: 0
                  }}
                >
                  {isEditing ? (
                    /* Inline Editing Form */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.8rem', color: themeColor, textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Edit {vh.name} Specs
                        </span>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => {
                            setIsEditingVehicle(false);
                            setEditingVehicleId(null);
                          }}
                          style={{ padding: '3px 8px', fontSize: '0.65rem', borderRadius: '4px' }}
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Category */}
                      <div>
                        <label className="form-label">Category</label>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {(['car', 'motorcycle', 'bicycle', 'e-scooter', 'other'] as const).map(type => {
                            const vpreset = VEHICLE_DATA[type];
                            return (
                              <button
                                key={type}
                                type="button"
                                className="btn"
                                onClick={() => handleVehicleTypeChangeInEdit(type)}
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '0.65rem',
                                  borderColor: editVehicleType === type ? vpreset.color : 'var(--border-dim)',
                                  background: editVehicleType === type ? `${vpreset.color}15` : 'var(--bg-input)',
                                  color: editVehicleType === type ? vpreset.color : 'var(--text-primary)'
                                }}
                              >
                                {vpreset.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Classification */}
                      <div>
                        <label className="form-label">Classification Preset</label>
                        <select
                          className="input-field"
                          value={editSpecificVehicle}
                          onChange={(e) => setEditSpecificVehicle(e.target.value)}
                          style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        >
                          {SPECIFIC_VEHICLES[editVehicleType].map((sub) => (
                            <option key={sub.value} value={sub.value} style={{ background: 'var(--bg-card)' }}>
                              {sub.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Nickname */}
                      <div>
                        <label className="form-label">Vehicle Nickname</label>
                        <input 
                          type="text"
                          className="input-field"
                          value={vNickname}
                          onChange={(e) => setVNickname(e.target.value)}
                          placeholder="Nickname (e.g. My Cruiser)"
                        />
                      </div>

                      {/* Manufacturer & Model Year */}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <label className="form-label">Manufacturer</label>
                          <input 
                            type="text"
                            className="input-field"
                            value={vManufacturer}
                            onChange={(e) => setVManufacturer(e.target.value)}
                            placeholder="Manufacturer"
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="form-label">Model Year</label>
                          <input 
                            type="text"
                            className="input-field"
                            value={vModelYear}
                            onChange={(e) => setVModelYear(e.target.value)}
                            placeholder="Year"
                          />
                        </div>
                      </div>

                      {/* Fuel Type & Plate */}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <label className="form-label">Fuel Type</label>
                          <select
                            className="input-field"
                            value={vFuelType}
                            onChange={(e) => setVFuelType(e.target.value as any)}
                            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                          >
                            {Object.entries(FUEL_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="form-label">Plate / Registration</label>
                          <input 
                            type="text"
                            className="input-field"
                            value={vLicensePlate}
                            onChange={(e) => setVLicensePlate(e.target.value)}
                            placeholder="Plate code"
                          />
                        </div>
                      </div>

                      {/* Power */}
                      <div>
                        <label className="form-label">Engine / Motor Power</label>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="e.g. 2.0L, 250cc, 300 kW"
                          value={vEngineDisplacement}
                          onChange={(e) => setVEngineDisplacement(e.target.value)}
                          maxLength={30}
                        />
                      </div>

                      {/* Dates */}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <label className="form-label">Manufacture Date</label>
                          <input 
                            type="date" 
                            className="input-field" 
                            value={vManufactureDate}
                            onChange={(e) => setVManufactureDate(e.target.value)}
                            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', colorScheme: 'dark' }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="form-label">Purchase Date</label>
                          <input 
                            type="date" 
                            className="input-field" 
                            value={vPurchaseDate}
                            onChange={(e) => setVPurchaseDate(e.target.value)}
                            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', colorScheme: 'dark' }}
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="form-label">Vehicle Notes / Modifications</label>
                        <textarea 
                          className="input-field" 
                          placeholder="Describe mods, tire compound, custom notes..."
                          value={vNotes}
                          onChange={(e) => setVNotes(e.target.value)}
                          rows={3}
                          style={{ 
                            background: 'var(--bg-input)', 
                            color: 'var(--text-primary)',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            padding: '10px'
                          }}
                        />
                      </div>

                      {/* Photos Upload inside Edit slide */}
                      <div>
                        <label className="form-label">Vehicle Photos (Up to 5 images)</label>
                        {vImages.length > 0 ? (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {vImages.map((img, idx) => (
                              <div 
                                key={idx}
                                style={{
                                  position: 'relative',
                                  width: '60px',
                                  height: '45px',
                                  borderRadius: '6px',
                                  backgroundImage: `url(${img})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  border: idx === 0 ? `2px solid ${themeColor}` : '1px solid var(--border-dim)'
                                }}
                              >
                                {idx === 0 && (
                                  <span style={{
                                    position: 'absolute',
                                    bottom: '1px',
                                    left: '1px',
                                    background: themeColor,
                                    color: '#000',
                                    fontSize: '0.4rem',
                                    fontWeight: 'bold',
                                    padding: '0 3px',
                                    borderRadius: '2px',
                                    textTransform: 'uppercase'
                                  }}>
                                    Cover
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeVehicleImage(idx)}
                                  style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    background: 'var(--neon-red)',
                                    color: '#fff',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            {vImages.length < 5 && (
                              <div 
                                onClick={triggerVehicleImageInput}
                                style={{
                                  width: '60px',
                                  height: '45px',
                                  borderRadius: '6px',
                                  border: '2px dashed var(--border-bright)',
                                  background: 'var(--bg-input)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>+</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div 
                            onClick={triggerVehicleImageInput}
                            style={{
                              width: '100%',
                              height: '60px',
                              borderRadius: '8px',
                              border: '2px dashed var(--border-bright)',
                              background: 'var(--bg-input)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              gap: '4px'
                            }}
                          >
                            <Camera size={16} style={{ color: 'var(--text-secondary)' }} />
                            <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>UPLOAD VEHICLE PHOTOS (UP TO 5)</span>
                          </div>
                        )}
                        <input 
                          type="file"
                          ref={vehicleImageInputRef}
                          onChange={handleVehicleImagesUpload}
                          accept="image/*"
                          multiple
                          style={{ display: 'none' }}
                        />
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSaveVehicleDetails}
                        style={{ padding: '10px', marginTop: '6px' }}
                      >
                        Save Vehicle Details
                      </button>
                    </div>
                  ) : (
                    /* Read-Only Spec Layout */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                      
                      {/* Vehicle Image block */}
                      <div style={{ 
                        position: 'relative', 
                        height: '180px', 
                        width: '100%', 
                        borderRadius: '12px', 
                        overflow: 'hidden', 
                        border: '1px solid var(--border-dim)', 
                        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                        background: 'rgba(255, 255, 255, 0.02)'
                      }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            width: '100%', 
                            backgroundImage: `url(${primaryImage})`, 
                            backgroundSize: primaryImage === DEFAULT_VEHICLE_IMAGE ? '64px' : 'cover', 
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            transition: 'background-image 0.25s ease',
                            opacity: primaryImage === DEFAULT_VEHICLE_IMAGE ? 0.35 : 1
                          }} 
                        />
                        
                        {/* Glowing Mode Indicator */}
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          background: isActive ? 'var(--neon-green)' : 'rgba(22, 22, 28, 0.8)',
                          backdropFilter: 'blur(4px)',
                          color: isActive ? '#000' : '#ffffff',
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          border: isActive ? 'none' : '1px solid var(--border-bright)',
                          boxShadow: isActive ? '0 0 10px var(--neon-green)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {isActive && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#000', animation: 'pulse 1.5s infinite' }} />}
                          {isActive ? 'Active Ride' : 'Garage Ride'}
                        </div>
                      </div>

                      {/* Photo Gallery Selector (interactive thumbnails swapping header to avoid gesture conflicts) */}
                      {vehicleImages.length > 1 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '-4px' }}>
                          {vehicleImages.map((img, imgIdx) => (
                            <div
                              key={imgIdx}
                              onClick={(e) => handleSelectThumbnail(vh.id, imgIdx, e)}
                              style={{
                                width: '42px',
                                height: '32px',
                                borderRadius: '4px',
                                backgroundImage: `url(${img})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                cursor: 'pointer',
                                border: imgIdx === coverIdx ? `2px solid ${themeColor}` : '1px solid var(--border-dim)',
                                boxShadow: imgIdx === coverIdx ? `0 0 6px ${themeColor}` : 'none',
                                transition: 'all 0.2s'
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Name & Basic Details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <VehicleIcon size={18} style={{ color: themeColor, filter: `drop-shadow(0 0 3px ${themeColor})` }} />
                          <span style={{ fontWeight: 800, fontSize: '1.3rem', color: themeColor, textTransform: 'uppercase', fontFamily: 'var(--gauge-font)' }}>
                            {vh.name}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px' }}>
                          <span style={{ fontWeight: 600 }}>{vh.manufacturer}</span>
                          <span style={{ color: 'var(--text-muted)' }}>·</span>
                          <span>Model Year {vh.modelYear}</span>
                        </div>
                      </div>

                      {/* Telemetry preset categories cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-dim)', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Classification</div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {getSpecificVehicleLabel(vh.type || 'car', vh.specificVehicle || 'sedan')}
                          </div>
                        </div>

                        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-dim)', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Power Unit</div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {FUEL_LABELS[vh.fuelType as keyof typeof FUEL_LABELS] || vh.fuelType}
                          </div>
                        </div>

                        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-dim)', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Registration</div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {vh.licensePlate || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Technical specifications */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
                        {vh.engineDisplacement && (
                          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Engine / Motor</div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                              {vh.engineDisplacement}
                            </div>
                          </div>
                        )}

                        {vh.manufactureDate && (
                          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Manufacture Date</div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                              {new Date(vh.manufactureDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </div>
                          </div>
                        )}

                        {vh.purchaseDate && (
                          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Purchase Date</div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                              {new Date(vh.purchaseDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Custom notes / mods list */}
                      {vh.notes && (
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-dim)', borderRadius: '8px' }}>
                          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Notes & Modifications</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                            {vh.notes}
                          </div>
                        </div>
                      )}

                      {/* Card Operations Footer Actions */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        {!isActive && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                              onUpdateProfile({
                                ...profile,
                                activeVehicleId: vh.id
                              });
                            }}
                            style={{ flex: 1.5, padding: '8px', fontSize: '0.72rem' }}
                          >
                            Activate Ride
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => handleEditVehicleToggle(vh)}
                          style={{ flex: 1, padding: '8px', fontSize: '0.72rem' }}
                        >
                          Edit Details
                        </button>
                        {profile.vehicles.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={(e) => handleDeleteVehicle(vh.id, e)}
                            style={{ borderColor: 'rgba(255, 0, 85, 0.25)', color: 'var(--neon-red)', padding: '8px', fontSize: '0.72rem', flex: 0.8 }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Slide Card: Add Another Ride (or inline add form) */}
            <div style={{ width: '100%', flexShrink: 0, boxSizing: 'border-box', padding: 0 }}>
              {isAddingVehicle ? (
                /* Inline Add Form */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--neon-green)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Add New Vehicle Preset
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        setIsAddingVehicle(false);
                        setGarageSlideIdx(Math.max(0, sortedVehicles.length - 1));
                      }}
                      style={{ padding: '3px 8px', fontSize: '0.65rem', borderRadius: '4px' }}
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Category Type */}
                  <div>
                    <label className="form-label">Category</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {(['car', 'motorcycle', 'bicycle', 'e-scooter', 'other'] as const).map(type => {
                        const vpreset = VEHICLE_DATA[type];
                        return (
                          <button
                            key={type}
                            type="button"
                            className="btn"
                            onClick={() => handleVehicleTypeChangeInEdit(type)}
                            style={{
                              padding: '5px 10px',
                              fontSize: '0.65rem',
                              borderColor: editVehicleType === type ? vpreset.color : 'var(--border-dim)',
                              background: editVehicleType === type ? `${vpreset.color}15` : 'var(--bg-input)',
                              color: editVehicleType === type ? vpreset.color : 'var(--text-primary)'
                            }}
                          >
                            {vpreset.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preset Classification */}
                  <div>
                    <label className="form-label">Classification Preset</label>
                    <select
                      className="input-field"
                      value={editSpecificVehicle}
                      onChange={(e) => setEditSpecificVehicle(e.target.value)}
                      style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    >
                      {SPECIFIC_VEHICLES[editVehicleType].map((sub) => (
                        <option key={sub.value} value={sub.value} style={{ background: 'var(--bg-card)' }}>
                          {sub.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nickname */}
                  <div>
                    <label className="form-label">Vehicle Nickname</label>
                    <input 
                      type="text"
                      className="input-field"
                      value={vNickname}
                      onChange={(e) => setVNickname(e.target.value)}
                      placeholder="e.g. Blue Streak"
                    />
                  </div>

                  {/* Manufacturer & Year */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Manufacturer</label>
                      <input 
                        type="text"
                        className="input-field"
                        value={vManufacturer}
                        onChange={(e) => setVManufacturer(e.target.value)}
                        placeholder="e.g. Honda"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Model Year</label>
                      <input 
                        type="text"
                        className="input-field"
                        value={vModelYear}
                        onChange={(e) => setVModelYear(e.target.value)}
                        placeholder="e.g. 2022"
                      />
                    </div>
                  </div>

                  {/* Fuel & License Plate */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Fuel Type</label>
                      <select
                        className="input-field"
                        value={vFuelType}
                        onChange={(e) => setVFuelType(e.target.value as any)}
                        style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                      >
                        {Object.entries(FUEL_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Plate / Registration</label>
                      <input 
                        type="text"
                        className="input-field"
                        value={vLicensePlate}
                        onChange={(e) => setVLicensePlate(e.target.value)}
                        placeholder="e.g. AB-1234"
                      />
                    </div>
                  </div>

                  {/* Power displacement */}
                  <div>
                    <label className="form-label">Engine / Motor Power</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. 2.0L, 250cc, 300 kW"
                      value={vEngineDisplacement}
                      onChange={(e) => setVEngineDisplacement(e.target.value)}
                      maxLength={30}
                    />
                  </div>

                  {/* Manufacture & Purchase dates */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Manufacture Date</label>
                      <input 
                        type="date" 
                        className="input-field" 
                        value={vManufactureDate}
                        onChange={(e) => setVManufactureDate(e.target.value)}
                        style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', colorScheme: 'dark' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Purchase Date</label>
                      <input 
                        type="date" 
                        className="input-field" 
                        value={vPurchaseDate}
                        onChange={(e) => setVPurchaseDate(e.target.value)}
                        style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', colorScheme: 'dark' }}
                      />
                    </div>
                  </div>

                  {/* Notes / modifications */}
                  <div>
                    <label className="form-label">Vehicle Notes / Modifications</label>
                    <textarea 
                      className="input-field" 
                      placeholder="Tire specifications, engine mods, custom accessories..."
                      value={vNotes}
                      onChange={(e) => setVNotes(e.target.value)}
                      rows={3}
                      style={{ 
                        background: 'var(--bg-input)', 
                        color: 'var(--text-primary)',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        padding: '10px'
                      }}
                    />
                  </div>

                  {/* Photo Uploader */}
                  <div>
                    <label className="form-label">Vehicle Photos (Up to 5 images)</label>
                    {vImages.length > 0 ? (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {vImages.map((img, idx) => (
                          <div 
                            key={idx}
                            style={{
                              position: 'relative',
                              width: '60px',
                              height: '45px',
                              borderRadius: '6px',
                              backgroundImage: `url(${img})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              border: idx === 0 ? '2px solid var(--neon-green)' : '1px solid var(--border-dim)'
                            }}
                          >
                            {idx === 0 && (
                              <span style={{
                                position: 'absolute',
                                bottom: '1px',
                                left: '1px',
                                background: 'var(--neon-green)',
                                color: '#000',
                                fontSize: '0.4rem',
                                fontWeight: 'bold',
                                padding: '0 3px',
                                borderRadius: '2px',
                                textTransform: 'uppercase'
                              }}>
                                Cover
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeVehicleImage(idx)}
                              style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                background: 'var(--neon-red)',
                                color: '#fff',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        {vImages.length < 5 && (
                          <div 
                            onClick={triggerVehicleImageInput}
                            style={{
                              width: '60px',
                              height: '45px',
                              borderRadius: '6px',
                              border: '2px dashed var(--border-bright)',
                              background: 'var(--bg-input)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>+</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div 
                        onClick={triggerVehicleImageInput}
                        style={{
                          width: '100%',
                          height: '60px',
                          borderRadius: '8px',
                          border: '2px dashed var(--border-bright)',
                          background: 'var(--bg-input)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          gap: '4px'
                        }}
                      >
                        <Camera size={16} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>UPLOAD PHOTOS (UP TO 5)</span>
                      </div>
                    )}
                    <input 
                      type="file"
                      ref={vehicleImageInputRef}
                      onChange={handleVehicleImagesUpload}
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveNewVehicle}
                    style={{ padding: '10px', marginTop: '6px' }}
                  >
                    Add Vehicle to Garage
                  </button>
                </div>
              ) : (
                /* Dashed "+" add card */
                <div
                  onClick={() => {
                    // Initialize empty fields for adding vehicle
                    setEditVehicleType('car');
                    setEditSpecificVehicle('sedan');
                    setVNickname('');
                    setVManufacturer('');
                    setVModelYear('');
                    setVFuelType('electric');
                    setVLicensePlate('');
                    setVImageUrl(DEFAULT_VEHICLE_IMAGE);
                    setVPurchaseDate('');
                    setVManufactureDate('');
                    setVEngineDisplacement('');
                    setVNotes('');
                    setVImages([]);
                    
                    setIsAddingVehicle(true);
                    setIsEditingVehicle(false);
                  }}
                  style={{
                    width: '100%',
                    minHeight: '260px',
                    border: '2px dashed var(--border-bright)',
                    background: 'rgba(255,255,255,0.01)',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    gap: '12px',
                    padding: '24px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    color: 'var(--text-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--neon-green)';
                    e.currentTarget.style.color = 'var(--neon-green)';
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 102, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-bright)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontSize: '2.5rem', fontWeight: 300, color: 'var(--neon-green)', filter: 'drop-shadow(0 0 4px rgba(0,255,102,0.4))' }}>+</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px' }}>ADD ANOTHER RIDE</span>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0, textAlign: 'center', maxWidth: '200px' }}>
                    Expand your garage by adding another telemetry vehicle preset.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Carousel Slide Indicators / Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
          {Array.from({ length: sortedVehicles.length + 1 }).map((_, dIdx) => (
            <button
              key={dIdx}
              type="button"
              onClick={() => setGarageSlideIdx(dIdx)}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                border: 'none',
                padding: 0,
                background: dIdx === garageSlideIdx ? 'var(--neon-cyan)' : 'var(--text-muted)',
                opacity: dIdx === garageSlideIdx ? 1 : 0.35,
                boxShadow: dIdx === garageSlideIdx ? '0 0 8px var(--neon-cyan)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            />
          ))}
        </div>
      </div>

      {/* Leaderboard/Best Runs View */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ textTransform: 'uppercase', color: 'var(--text-secondary)', fontSize: '0.85rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trophy size={14} style={{ color: 'var(--neon-orange)' }} />
            <span>Personal Leaderboard</span>
          </h3>
          
          {/* Sorting selection buttons */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-dim)' }}>
            <button
              onClick={() => setSortBy('speed')}
              style={{
                background: sortBy === 'speed' ? 'var(--bg-card)' : 'transparent',
                color: sortBy === 'speed' ? 'var(--neon-cyan)' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.65rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              SPEED
            </button>
            <button
              onClick={() => setSortBy('distance')}
              style={{
                background: sortBy === 'distance' ? 'var(--bg-card)' : 'transparent',
                color: sortBy === 'distance' ? 'var(--neon-green)' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.65rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              DIST
            </button>
            <button
              onClick={() => setSortBy('gforce')}
              style={{
                background: sortBy === 'gforce' ? 'var(--bg-card)' : 'transparent',
                color: sortBy === 'gforce' ? 'var(--neon-orange)' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.65rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              FORCE
            </button>
          </div>
        </div>

        {/* Trips list */}
        {sortedTrips.length === 0 ? (
          <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            No runs recorded yet. Start driving to post scores on your board!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedTrips.map((trip, idx) => {
              const displayDist = isImperial ? trip.distance * 0.621371 : trip.distance;
              const displayMaxSpeed = isImperial ? trip.maxSpeed * 0.621371 : trip.maxSpeed;
              const peakG = Math.max(trip.maxGForce.lat, trip.maxGForce.acc, trip.maxGForce.brk);

              let rankColor = 'var(--text-muted)';
              if (idx === 0) rankColor = 'var(--neon-orange)'; // Gold
              else if (idx === 1) rankColor = 'var(--neon-cyan)'; // Silver
              else if (idx === 2) rankColor = 'var(--neon-green)'; // Bronze

              return (
                <div
                  key={trip.id}
                  className="card"
                  onClick={() => handleTripSelect(trip)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    margin: 0,
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-gradient-end) 100%)'
                  }}
                >
                  {/* Rank Placement */}
                  <div 
                    style={{ 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '8px', 
                      background: 'rgba(255, 255, 255, 0.03)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontWeight: 800,
                      fontFamily: 'var(--gauge-font)',
                      color: rankColor,
                      border: idx < 3 ? `1px solid ${rankColor}30` : '1px solid transparent'
                    }}
                  >
                    #{idx + 1}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(trip.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {displayDist.toFixed(2)}{distUnit} · {formatDuration(trip.duration)}
                    </span>
                  </div>

                  {/* Top Stats based on Sort */}
                  <div style={{ textAlign: 'right' }}>
                    {sortBy === 'speed' && (
                      <div>
                        <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Top Speed</div>
                        <div style={{ fontFamily: 'var(--gauge-font)', fontWeight: 700, color: 'var(--neon-cyan)', fontSize: '1.1rem' }}>
                          {Math.round(displayMaxSpeed)}
                          <span style={{ fontSize: '0.75rem', fontWeight: 500 }}> {speedUnit}</span>
                        </div>
                      </div>
                    )}
                    {sortBy === 'distance' && (
                      <div>
                        <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Distance</div>
                        <div style={{ fontFamily: 'var(--gauge-font)', fontWeight: 700, color: 'var(--neon-green)', fontSize: '1.1rem' }}>
                          {displayDist.toFixed(2)}
                          <span style={{ fontSize: '0.75rem', fontWeight: 500 }}> {distUnit}</span>
                        </div>
                      </div>
                    )}
                    {sortBy === 'gforce' && (
                      <div>
                        <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Max Force</div>
                        <div style={{ fontFamily: 'var(--gauge-font)', fontWeight: 700, color: 'var(--neon-orange)', fontSize: '1.1rem' }}>
                          {peakG.toFixed(2)}
                          <span style={{ fontSize: '0.75rem', fontWeight: 500 }}> G</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
