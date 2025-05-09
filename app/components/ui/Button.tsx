import React from 'react';
import { animated, useSpring } from 'react-spring';
import { twMerge } from 'tailwind-merge';

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  isLoading?: boolean;
};

const variantClasses = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

const AnimatedButton = animated('button');

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
  fullWidth = false,
  isLoading = false,
}) => {
  const [springs, api] = useSpring(() => ({
    scale: 1,
    opacity: 1,
  }));

  const handleMouseDown = () => {
    if (!disabled) {
      api.start({
        scale: 0.95,
        config: { tension: 300, friction: 10 },
      });
    }
  };

  const handleMouseUp = () => {
    if (!disabled) {
      api.start({
        scale: 1,
        config: { tension: 300, friction: 10 },
      });
    }
  };

  const handleMouseEnter = () => {
    if (!disabled) {
      api.start({
        scale: 1.03,
        config: { tension: 300, friction: 20 },
      });
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      api.start({
        scale: 1,
        config: { tension: 300, friction: 20 },
      });
    }
  };

  return (
    <AnimatedButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        transform: springs.scale.to(scale => `scale(${scale})`),
        opacity: springs.opacity,
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      className={twMerge(
        'rounded-lg font-medium shadow-md transition-colors',
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        fullWidth && 'w-full',
        className
      )}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        </div>
      ) : (
        children
      )}
    </AnimatedButton>
  );
}; 