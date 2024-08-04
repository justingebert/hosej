import React from 'react';
import './PulsatingCircle.css';

interface PulsatingCircleProps {
  color: string;
}

const PulsatingCircle: React.FC<PulsatingCircleProps> = ({ color }) => {
  return (
    <div className="ring-container">
      <div className="ringring" style={{ borderColor: color }}></div>
      <div className="circle" style={{ backgroundColor: color }}></div>
    </div>
  );
};

export default PulsatingCircle;
