import React from 'react';
import { Dog } from 'lucide-react';

interface DogIconProps {
  size?: number;
  className?: string;
}

export const DogIcon: React.FC<DogIconProps> = ({ 
  size = 24, 
  className = '' 
}) => {
  return (
    <Dog 
      size={size} 
      className={className}
      fill="currentColor"
    />
  );
};
