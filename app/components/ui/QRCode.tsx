'use client';

import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useSpring, animated } from 'react-spring';
import { twMerge } from 'tailwind-merge';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
  title?: string;
}

const AnimatedDiv = animated('div');

export const QRCode: React.FC<QRCodeProps> = ({
  value,
  size = 256,
  className,
  title,
}) => {
  const [springs, api] = useSpring(() => ({
    scale: 1,
    rotate: 0,
  }));

  const handleMouseEnter = () => {
    api.start({
      scale: 1.05,
      config: { tension: 200, friction: 15 },
    });
  };

  const handleMouseLeave = () => {
    api.start({
      scale: 1,
      config: { tension: 200, friction: 15 },
    });
  };

  return (
    <div className={twMerge('flex flex-col items-center', className)}>
      {title && (
        <h3 className="text-lg font-medium mb-4 text-center">{title}</h3>
      )}
      <AnimatedDiv
        style={{
          transform: springs.scale.to(s => `scale(${s})`),
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="bg-white p-3 rounded-lg shadow-md"
      >
        <QRCodeCanvas
          value={value}
          size={size}
          bgColor="#FFFFFF"
          fgColor="#000000"
          level="H"
          includeMargin
        />
      </AnimatedDiv>
    </div>
  );
};

QRCode.displayName = 'QRCode'; 