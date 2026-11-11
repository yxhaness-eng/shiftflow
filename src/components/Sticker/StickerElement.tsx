import React from 'react';
import { PlacedSticker } from '../../types';
import { STICKERS_MAP } from '../../data/stickersManifest';

interface StickerElementProps {
  sticker: PlacedSticker;
  onClick?: (e: React.MouseEvent) => void;
  interactive?: boolean;
}

export const StickerElement: React.FC<StickerElementProps> = ({
  sticker,
  onClick,
  interactive = false
}) => {
  const item = STICKERS_MAP[sticker.stickerId];
  if (!item) return null;

  // Resolve base asset path (works cleanly with relative paths for GitHub/Cloudflare Pages)
  const imageSrc = `./${item.imagePath}`;

  const style: React.CSSProperties = {
    transform: `translate(${sticker.x}%, ${sticker.y}%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
    cursor: interactive ? 'pointer' : 'default',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))'
  };

  return (
    <div
      className="sticker-placed"
      style={style}
      onClick={onClick}
      title={item.name}
    >
      <img
        src={imageSrc}
        alt={item.name}
        loading="lazy"
        draggable={false}
        className="sticker-image"
      />
    </div>
  );
};

