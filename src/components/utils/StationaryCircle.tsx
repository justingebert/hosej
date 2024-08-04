import React from 'react';

interface StationaryCircleProps {
  color: string;
  size?: number;
}

const StationaryCircle: React.FC<StationaryCircleProps> = ({ color, size = 15 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: '50%',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
};

export default StationaryCircle;
