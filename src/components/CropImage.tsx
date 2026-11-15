import React, { useState } from 'react';
import { getCropIcon, getCropEmoji } from '../data/initialData';

export interface CropImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallbackEmoji?: boolean;
}

const SIZE_MAP = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
};

export const CropImage: React.FC<CropImageProps> = ({
  name,
  size,
  className = '',
  fallbackEmoji = true,
  alt,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const iconSrc = getCropIcon(name);
  const emoji = getCropEmoji(name);

  if ((!iconSrc || hasError) && fallbackEmoji) {
    return (
      <span
        className={`inline-flex items-center justify-center leading-none select-none ${className}`}
        title={name}
      >
        {emoji}
      </span>
    );
  }

  const sizeClass = size ? SIZE_MAP[size] : '';

  return (
    <img
      src={iconSrc}
      alt={alt || name}
      title={name}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`object-contain select-none shrink-0 ${sizeClass} ${className}`}
      {...props}
    />
  );
};
