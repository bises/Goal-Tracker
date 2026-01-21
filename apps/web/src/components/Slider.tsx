import React, { useState, useEffect } from 'react';

interface SliderProps {
  value: number;
  max: number;
  onChange: (val: number) => void;
  onCommit: (val: number) => void;
  label?: string;
  step?: number;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  max,
  onChange,
  onCommit,
  label,
  step = 0.1,
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value);
    setLocalValue(newVal);
    onChange(newVal);
  };

  const handleMouseUp = () => {
    if (localValue !== value) {
      onCommit(localValue);
    }
  };

  const percentage = Math.min((localValue / max) * 100, 100);

  return (
    <div style={{ width: '100%', padding: '10px 0' }}>
      {label && (
        <div style={{ marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          {label}
        </div>
      )}
      <div style={{ position: 'relative', height: '24px', display: 'flex', alignItems: 'center' }}>
        <input
          type="range"
          min="0"
          max={max}
          step={step}
          value={localValue}
          onChange={handleChange}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          style={{
            width: '100%',
            position: 'absolute',
            zIndex: 2,
            opacity: 0,
            cursor: 'grab',
            height: '100%',
          }}
        />
        {/* Custom Track */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            left: 0,
            right: 0,
            height: '8px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
            zIndex: 1,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${percentage}%`,
              background: 'var(--gradient-primary)',
              transition: 'width 0.1s ease',
            }}
          />
        </div>

        {/* Thumb Indicator */}
        <div
          style={{
            position: 'absolute',
            left: `calc(${percentage}% - 10px)`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 0 10px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'left 0.1s ease',
          }}
        />
      </div>
    </div>
  );
};
