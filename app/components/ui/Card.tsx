'use client';

import React from 'react';
import { useSpring, animated } from 'react-spring';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const AnimatedDiv = animated('div');

export const Card: React.FC<CardProps> = ({
  children,
  className,
  onClick,
  hoverable = true,
}) => {
  const [springs, api] = useSpring(() => ({
    scale: 1,
    y: 0,
    shadow: 1,
  }));

  const handleMouseEnter = () => {
    if (hoverable) {
      api.start({
        scale: 1.02,
        y: -5,
        shadow: 10,
        config: { tension: 300, friction: 20 },
      });
    }
  };

  const handleMouseLeave = () => {
    if (hoverable) {
      api.start({
        scale: 1,
        y: 0,
        shadow: 1,
        config: { tension: 300, friction: 20 },
      });
    }
  };

  return (
    <AnimatedDiv
      className={twMerge(
        'bg-white rounded-xl p-6 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        transform: springs.scale.to(s => `translateY(${springs.y.get()}px) scale(${s})`),
        boxShadow: springs.shadow.to(s => `0 ${s * 2}px ${s * 3}px rgba(0, 0, 0, 0.1)`),
      }}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </AnimatedDiv>
  );
};

Card.displayName = 'Card'; 