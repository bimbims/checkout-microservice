import React from 'react';

export interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-24 h-10',
    md: 'w-32 h-12',
    lg: 'w-40 h-16'
  };
  return (
    <div className={`text-ibira-green ${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 200 80"
        className="w-full h-full"
        fill="currentColor"
      >
        <text
          x="100"
          y="50"
          textAnchor="middle"
          fontFamily="Playfair Display, serif"
          fontSize="36"
          fontWeight="600"
        >
          IBIRAHILL
        </text>
      </svg>
    </div>
  );
};

export default Logo;
