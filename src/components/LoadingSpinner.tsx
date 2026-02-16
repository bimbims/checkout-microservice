import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Carregando...', 
  size = 'md' 
}) => {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32
  };
  
  const iconSize = typeof size === 'number' ? size : sizeMap[size];
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <Loader2 size={iconSize} className="animate-spin text-ibira-green/40" />
      <p className="text-xs uppercase tracking-widest text-ibira-green/60 font-semibold">
        {message}
      </p>
    </div>
  );
};

export default LoadingSpinner;
