import React, { forwardRef } from 'react';
import { animated, useSpring } from 'react-spring';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const AnimatedInput = animated('input');

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, fullWidth = false, ...props }, ref) => {
    const [springs, api] = useSpring(() => ({
      scale: 1,
      borderColor: 'rgb(203, 213, 225)', // gray-300
    }));

    const handleFocus = () => {
      api.start({
        scale: 1.01,
        borderColor: error
          ? 'rgb(239, 68, 68)' // red-500
          : 'rgb(59, 130, 246)', // blue-500
        config: { tension: 300, friction: 10 },
      });
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      api.start({
        scale: 1,
        borderColor: error
          ? 'rgb(239, 68, 68)' // red-500
          : 'rgb(203, 213, 225)', // gray-300
        config: { tension: 300, friction: 10 },
      });

      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    return (
      <div className={twMerge('flex flex-col mb-4', fullWidth && 'w-full')}>
        {label && (
          <label className="text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <AnimatedInput
          className={twMerge(
            'px-4 py-2 rounded-lg border focus:outline-none',
            error ? 'border-red-500' : 'border-gray-300',
            fullWidth && 'w-full',
            className
          )}
          style={{
            transform: springs.scale.to(scale => `scale(${scale})`),
            borderColor: springs.borderColor,
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          ref={ref}
          {...props}
        />
        {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input'; 