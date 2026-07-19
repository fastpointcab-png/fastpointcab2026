import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = "h-10 w-auto"
}) => {
  return (
    <img
      src="/images/taxi-icon-512.png"
      alt="FastPointCab Logo"
      className={className}
    />
  );
};