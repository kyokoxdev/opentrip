import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { Car, Bike, Zap, User, Award, Check, Camera, Image, Wrench } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  onCancel?: () => void;
}

const VEHICLES = [
  {
    type: 'car' as const,
    name: 'Car / SUV',
    icon: Car,
    desc: 'Automotive driving. Records speed, braking, and passenger cornering Gs.',
    color: 'var(--neon-cyan)',
    glow: 'var(--glow-cyan)'
  },
  {
    type: 'motorcycle' as const,
    name: 'Motorcycle',
    icon: Zap,
    desc: 'Motorized two-wheeler. Tracks leaning Gs and rapid acceleration.',
    color: 'var(--neon-purple)',
    glow: 'var(--glow-purple)'
  },
  {
    type: 'bicycle' as const,
    name: 'Bicycle',
    icon: Bike,
    desc: 'Eco commuting. Tracks human-powered velocities, trails, and physical endurance.',
    color: 'var(--neon-green)',
    glow: 'var(--glow-green)'
  },
  {
    type: 'e-scooter' as const,
    name: 'E-Scooter / Board',
    icon: Zap,
    desc: 'Light electric vehicle. Captures urban micro-mobility and shock vibrations.',
    color: 'var(--neon-orange)',
    glow: 'var(--glow-orange)'
  },
  {
    type: 'other' as const,
    name: 'Other / Custom',
    icon: User,
    desc: 'Walking, running, or custom telemetry logs without predefined presets.',
    color: 'var(--text-primary)',
    glow: 'none'
  }
];

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

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onCancel }) => {
  // Driver states
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);
  const [errorMsg, setErrorMsg] = useState('');

  // Vehicle states
  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle' | 'bicycle' | 'e-scooter' | 'other'>('car');
  const [specificVehicle, setSpecificVehicle] = useState('sedan');
  
  // Detailed Vehicle Specs states
  const [vNickname, setVNickname] = useState('');
  const [vManufacturer, setVManufacturer] = useState('');
  const [vModelYear, setVModelYear] = useState('');
  const [vFuelType, setVFuelType] = useState<'electric' | 'gasoline' | 'diesel' | 'hybrid' | 'human' | 'other'>('electric');
  const [vLicensePlate, setVLicensePlate] = useState('');
  const [vImageUrl, setVImageUrl] = useState(DEFAULT_VEHICLE_IMAGE);
  
  // Detailed fields
  const [vPurchaseDate, setVPurchaseDate] = useState('');
  const [vManufactureDate, setVManufactureDate] = useState('');
  const [vEngineDisplacement, setVEngineDisplacement] = useState('');
  const [vNotes, setVNotes] = useState('');
  const [vImages, setVImages] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const vehicleImageInputRef = useRef<HTMLInputElement>(null);

  const handleVehicleTypeChange = (type: 'car' | 'motorcycle' | 'bicycle' | 'e-scooter' | 'other') => {
    setVehicleType(type);
    setSpecificVehicle(SPECIFIC_VEHICLES[type][0].value);
    
    // Auto-update default fuel types based on categories
    if (type === 'bicycle') {
      setVFuelType('human');
    } else if (type === 'e-scooter') {
      setVFuelType('electric');
    } else {
      setVFuelType('electric');
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        setErrorMsg('Avatar image size must be smaller than 1.5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
          setErrorMsg('');
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
        setErrorMsg(`You can upload at most 5 images (current: ${vImages.length}, selected: ${files.length}).`);
        return;
      }
      
      let hasError = false;
      const fileLoadPromises = Array.from(files).map(file => {
        return new Promise<string>((resolve, reject) => {
          if (file.size > 1.5 * 1024 * 1024) {
            hasError = true;
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
          setErrorMsg('');
        })
        .catch(err => {
          setErrorMsg(err.message || 'Error processing vehicle images.');
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

  const triggerAvatarInput = () => fileInputRef.current?.click();
  const triggerVehicleImageInput = () => vehicleImageInputRef.current?.click();

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (currentStep < 4) {
      handleNextStep();
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Please enter a driver name to compile your telemetry card.');
      return;
    }
    if (!vNickname.trim()) {
      setErrorMsg('Please enter a nickname for your vehicle.');
      return;
    }

    const vehicleId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
    const newVehicle = {
      id: vehicleId,
      name: vNickname.trim(),
      type: vehicleType,
      specificVehicle,
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

    onComplete({
      name: name.trim(),
      avatarUrl,
      createdAt: new Date().toISOString(),
      vehicles: [newVehicle],
      activeVehicleId: vehicleId,
      // Legacy fields for older components:
      vehicleType,
      specificVehicle,
      vehicleDetail: newVehicle
    });
  };

  // Step navigation state
  const [currentStep, setCurrentStep] = useState(1);

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!name.trim()) {
        setErrorMsg('Please enter a driver name to compile your telemetry card.');
        return;
      }
      setErrorMsg('');
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setErrorMsg('');
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!vNickname.trim()) {
        setErrorMsg('Please enter a nickname for your vehicle.');
        return;
      }
      setErrorMsg('');
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: 'Profile' },
      { num: 2, label: 'Category' },
      { num: 3, label: 'Vehicle' },
      { num: 4, label: 'Specs' }
    ];

    const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;

    return (
      <div style={{ position: 'relative', height: '48px', marginBottom: '16px', padding: '0 10px' }}>
        {/* Background Track Line */}
        <div style={{
          position: 'absolute',
          top: '14px',
          left: '20px',
          right: '20px',
          height: '2px',
          background: 'var(--border-dim)',
          zIndex: 1
        }} />
        
        {/* Active Progress Line */}
        <div style={{
          position: 'absolute',
          top: '14px',
          left: '20px',
          width: `calc(${progressPercent}% - 0px)`,
          height: '2px',
          background: 'var(--neon-cyan)',
          boxShadow: 'var(--glow-cyan)',
          transition: 'width 0.3s ease',
          zIndex: 2
        }} />

        {/* Steps Circles & Labels Container */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          position: 'relative',
          zIndex: 3
        }}>
          {steps.map((s) => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;
            return (
              <div 
                key={s.num}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isCompleted ? 'pointer' : 'default',
                  width: '60px'
                }}
                onClick={() => {
                  if (isCompleted) {
                    setCurrentStep(s.num);
                    setErrorMsg('');
                  }
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isActive ? 'var(--neon-cyan)' : isCompleted ? 'rgba(0, 229, 255, 0.1)' : 'var(--bg-input)',
                  border: isActive ? '1px solid var(--neon-cyan)' : isCompleted ? '1px solid var(--neon-cyan)' : '1px solid var(--border-dim)',
                  color: isActive ? '#000' : isCompleted ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  boxShadow: isActive ? 'var(--glow-cyan)' : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  {s.num}
                </div>
                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: isActive || isCompleted ? 'bold' : 'normal',
                  color: isActive ? 'var(--neon-cyan)' : 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStep1 = () => (
    <>
      <h2 style={{ fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-dim)', paddingBottom: '6px' }}>
        <User size={16} style={{ color: 'var(--neon-cyan)' }} />
        <span>Step 1: Driver Profile Setup</span>
      </h2>

      {/* Driver Photo Upload */}
      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <span className="form-label" style={{ alignSelf: 'flex-start', width: '100%' }}>Driver Photo</span>
        <div 
          onClick={triggerAvatarInput}
          style={{
            width: '72px',
            height: '72px',
            minWidth: '72px',
            minHeight: '72px',
            borderRadius: '50%',
            flexShrink: 0,
            aspectRatio: '1 / 1',
            border: '2px dashed var(--border-bright)',
            background: 'var(--bg-input)',
            backgroundImage: avatarUrl !== DEFAULT_AVATAR ? `url(${avatarUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.2s ease',
            boxShadow: avatarUrl !== DEFAULT_AVATAR ? 'var(--glow-cyan)' : 'none',
            borderColor: avatarUrl !== DEFAULT_AVATAR ? 'var(--neon-cyan)' : 'var(--border-bright)'
          }}
        >
          {avatarUrl === DEFAULT_AVATAR && (
            <Camera size={24} style={{ color: 'var(--text-secondary)' }} />
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleAvatarUpload}
          accept="image/*"
          style={{ display: 'none' }}
        />
      </div>

      {/* Driver Name Input */}
      <div className="form-group">
        <label className="form-label">Driver Name</label>
        <input 
          type="text" 
          className="input-field" 
          placeholder="e.g. Lewis Hamilton"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrorMsg('');
          }}
          maxLength={25}
        />
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <h2 style={{ fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-dim)', paddingBottom: '6px' }}>
        <Car size={16} style={{ color: 'var(--neon-cyan)' }} />
        <span>Step 2: Select Vehicle Category</span>
      </h2>

      {/* Vehicle Category Selector */}
      <div className="form-group" style={{ marginBottom: '12px' }}>
        <label className="form-label">Vehicle Type</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {VEHICLES.map((vh) => {
            const isSelected = vehicleType === vh.type;
            const IconComponent = vh.icon;
            const isOther = vh.type === 'other';
            return (
              <div
                key={vh.type}
                onClick={() => handleVehicleTypeChange(vh.type)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: isSelected ? vh.color : 'var(--border-dim)',
                  background: isSelected ? `${vh.color}15` : 'var(--bg-input)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  gridColumn: isOther ? 'span 2' : 'span 1',
                  justifyContent: 'flex-start'
                }}
              >
                <div 
                  style={{ 
                    padding: '6px', 
                    borderRadius: '6px', 
                    background: isSelected ? vh.color : 'var(--border-bright)',
                    color: isSelected ? '#000000' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isSelected ? vh.glow : 'none',
                    flexShrink: 0
                  }}
                >
                  <IconComponent size={14} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? vh.color : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {vh.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected description display */}
      <div style={{
        padding: '6px 10px',
        borderRadius: '8px',
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px solid var(--border-dim)',
        fontSize: '0.68rem',
        color: 'var(--text-secondary)',
        lineHeight: '1.4',
        marginBottom: '12px'
      }}>
        {VEHICLES.find(v => v.type === vehicleType)?.desc}
      </div>

      {/* Specific Model dropdown */}
      <div className="form-group">
        <label className="form-label">Classification Category</label>
        <select
          className="input-field"
          value={specificVehicle}
          onChange={(e) => setSpecificVehicle(e.target.value)}
          style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
        >
          {SPECIFIC_VEHICLES[vehicleType].map((sub) => (
            <option key={sub.value} value={sub.value}>
              {sub.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );

  const renderStep3 = () => (
    <>
      <h2 style={{ fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-dim)', paddingBottom: '6px' }}>
        <Wrench size={16} style={{ color: 'var(--neon-cyan)' }} />
        <span>Step 3: Vehicle Identification</span>
      </h2>

      {/* Vehicle Nickname input */}
      <div className="form-group">
        <label className="form-label">Vehicle Nickname</label>
        <input 
          type="text" 
          className="input-field" 
          placeholder="e.g. Silver Bullet, My Model 3"
          value={vNickname}
          onChange={(e) => {
            setVNickname(e.target.value);
            setErrorMsg('');
          }}
          maxLength={25}
        />
      </div>

      {/* Brand/Manufacturer & Year */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Manufacturer</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="e.g. Tesla, Honda, Giant"
            value={vManufacturer}
            onChange={(e) => setVManufacturer(e.target.value)}
            maxLength={20}
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Model Year</label>
          <input 
            type="number" 
            className="input-field" 
            placeholder="e.g. 2024"
            value={vModelYear}
            onChange={(e) => setVModelYear(e.target.value)}
            min="1900"
            max="2030"
          />
        </div>
      </div>

      {/* Fuel type & License Plate */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Fuel / Power Type</label>
          <select
            className="input-field"
            value={vFuelType}
            onChange={(e) => setVFuelType(e.target.value as any)}
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
          >
            <option value="electric">Electric</option>
            <option value="gasoline">Gasoline</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="human">Human Powered</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Registration / Plate</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="e.g. OPENTRIP"
            value={vLicensePlate}
            onChange={(e) => setVLicensePlate(e.target.value)}
            maxLength={12}
          />
        </div>
      </div>
    </>
  );

  const renderStep4 = () => (
    <>
      <h2 style={{ fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-dim)', paddingBottom: '6px' }}>
        <Camera size={16} style={{ color: 'var(--neon-cyan)' }} />
        <span>Step 4: Detailed Specifications & Photos</span>
      </h2>

      {/* Detailed Specs: Engine & Dates */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div className="form-group" style={{ flex: 1, marginBottom: '8px' }}>
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
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
        <div className="form-group" style={{ flex: 1, marginBottom: '8px' }}>
          <label className="form-label">Manufacture Date</label>
          <input 
            type="date" 
            className="input-field" 
            value={vManufactureDate}
            onChange={(e) => setVManufactureDate(e.target.value)}
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', colorScheme: 'dark', padding: '8px 10px' }}
          />
        </div>
        <div className="form-group" style={{ flex: 1, marginBottom: '8px' }}>
          <label className="form-label">Purchase Date</label>
          <input 
            type="date" 
            className="input-field" 
            value={vPurchaseDate}
            onChange={(e) => setVPurchaseDate(e.target.value)}
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', colorScheme: 'dark', padding: '8px 10px' }}
          />
        </div>
      </div>

      {/* Vehicle Notes / Specs / Mods */}
      <div className="form-group" style={{ marginBottom: '8px' }}>
        <label className="form-label">Vehicle Notes / Modifications</label>
        <input 
          type="text"
          className="input-field" 
          placeholder="Describe modifications, custom notes..."
          value={vNotes}
          onChange={(e) => setVNotes(e.target.value)}
          maxLength={100}
        />
      </div>

      {/* Vehicle Photos Gallery Uploader */}
      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
        <label className="form-label">Vehicle Photos (Up to 5 images)</label>
        
        {vImages.length > 0 ? (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                  border: idx === 0 ? '2px solid var(--neon-cyan)' : '1px solid var(--border-dim)',
                  boxShadow: idx === 0 ? 'var(--glow-cyan)' : 'none'
                }}
              >
                {idx === 0 && (
                  <span style={{
                    position: 'absolute',
                    bottom: '1px',
                    left: '1px',
                    background: 'var(--neon-cyan)',
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
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
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
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  gap: '2px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Image size={14} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.45rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>+ ADD</span>
              </div>
            )}
          </div>
        ) : (
          <div 
            onClick={triggerVehicleImageInput}
            style={{
              width: '100%',
              height: '46px',
              borderRadius: '8px',
              border: '2px dashed var(--border-bright)',
              background: 'var(--bg-input)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              gap: '6px',
              borderColor: 'var(--border-bright)'
            }}
          >
            <Camera size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              UPLOAD PHOTOS (UP TO 5 IMAGES)
            </span>
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
    </>
  );

  const renderNavigation = () => {
    if (currentStep === 1) {
      return (
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          {onCancel && (
            <button 
              key="onboarding-cancel-btn"
              type="button" 
              className="btn btn-outline"
              onClick={onCancel}
              style={{ flex: 1, padding: '14px', borderRadius: '12px' }}
            >
              <span>CANCEL</span>
            </button>
          )}
          <button 
            key="onboarding-next-btn-1"
            type="button" 
            className="btn btn-primary"
            onClick={handleNextStep}
            style={{ flex: onCancel ? 2 : 1, padding: '14px', borderRadius: '12px' }}
          >
            <span>NEXT STEP</span>
          </button>
        </div>
      );
    }

    if (currentStep < 4) {
      return (
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button 
            key={`onboarding-back-btn-${currentStep}`}
            type="button" 
            className="btn btn-outline"
            onClick={handlePrevStep}
            style={{ flex: 1, padding: '14px', borderRadius: '12px' }}
          >
            <span>BACK</span>
          </button>
          <button 
            key={`onboarding-next-btn-${currentStep}`}
            type="button" 
            className="btn btn-primary"
            onClick={handleNextStep}
            style={{ flex: 2, padding: '14px', borderRadius: '12px' }}
          >
            <span>NEXT STEP</span>
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button 
          key="onboarding-back-btn-4"
          type="button" 
          className="btn btn-outline"
          onClick={handlePrevStep}
          style={{ flex: 1, padding: '14px', borderRadius: '12px' }}
        >
          <span>BACK</span>
        </button>
        <button 
          key="onboarding-launch-btn"
          type="button" 
          className="btn btn-primary"
          onClick={handleSubmit}
          style={{ flex: 2, padding: '14px', borderRadius: '12px' }}
        >
          <span>LAUNCH APPLICATION</span>
        </button>
      </div>
    );
  };

  return (
    <div 
      style={{ 
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'flex-start', 
        alignItems: 'stretch',
        padding: '16px',
        textAlign: 'left',
        background: 'linear-gradient(135deg, var(--bg-deep) 0%, #060608 100%)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <h1 className="app-wordmark" style={{ fontSize: '1.8rem', marginBottom: '2px' }}><span className="word-open">Open</span><span className="word-trip">Trip</span></h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0 }}>
          Open-Source driving telemetry, G-Force logs & alerts
        </p>
      </div>

      <div className="card card-glowing-cyan" style={{ margin: '0 0 10px 0', padding: '16px' }}>
        {renderStepIndicator()}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {errorMsg && (
            <div style={{ color: 'var(--neon-red)', fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold' }}>
              {errorMsg}
            </div>
          )}

          {renderNavigation()}
        </form>
      </div>
    </div>
  );
};
