import React, { useState, useMemo } from 'react';
import { X, Search, Heart } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { STICKERS_MANIFEST, STICKER_CATEGORIES } from '../../data/stickersManifest';
import { StickerManifestItem, StickerCategory } from '../../types';

interface StickerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSticker: (stickerId: string) => void;
  targetDateTitle?: string;
}

export const StickerPicker: React.FC<StickerPickerProps> = ({
  isOpen,
  onClose,
  onSelectSticker,
  targetDateTitle
}) => {
  const { settings, toggleFavoriteSticker } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const favoriteIds = settings.favoriteStickerIds || [];

  const filteredStickers = useMemo(() => {
    return STICKERS_MANIFEST.filter((item) => {
      let matchesCategory = true;
      if (selectedCategory === 'Избранные') {
        matchesCategory = favoriteIds.includes(item.id);
      } else if (selectedCategory !== 'Все') {
        matchesCategory = item.category === selectedCategory;
      }

      const matchesSearch =
        searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, favoriteIds]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-sheet sticker-picker-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Выбор стикера
            </h3>
            {targetDateTitle && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                для {targetDateTitle}
              </p>
            )}
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>

        {/* Search & Category Pills */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-card-subtle)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-round)',
            padding: '6px 14px',
            marginBottom: '10px'
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Поиск по названию или теме..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.85rem',
                width: '100%'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none'
          }}>
            <button
              className={`category-pill ${selectedCategory === 'Все' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('Все')}
            >
              Все ({STICKERS_MANIFEST.length})
            </button>
            <button
              className={`category-pill ${selectedCategory === 'Избранные' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('Избранные')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Heart size={12} fill={selectedCategory === 'Избранные' ? 'currentColor' : 'none'} />
              <span>Любимые ({favoriteIds.length})</span>
            </button>
            {STICKER_CATEGORIES.map((cat: StickerCategory) => (
              <button
                key={cat}
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Stickers Grid */}
        <div
          className="modal-body"
          style={{
            maxHeight: '55vh',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: '12px',
            padding: '16px'
          }}
        >
          {filteredStickers.map((item: StickerManifestItem) => {
            const isFav = favoriteIds.includes(item.id);
            return (
              <div
                key={item.id}
                className="sticker-picker-item"
                style={{ position: 'relative' }}
                onClick={() => {
                  onSelectSticker(item.id);
                  onClose();
                }}
                title={`${item.name} (${item.category})`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavoriteSticker(item.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    background: 'rgba(255,255,255,0.85)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: isFav ? '#E05D6D' : 'var(--text-muted)'
                  }}
                  title={isFav ? 'В избранном' : 'Добавить в избранное'}
                >
                  <Heart size={11} fill={isFav ? 'currentColor' : 'none'} />
                </button>
                <img
                  src={`./${item.imagePath}?v=cutout2`}
                  alt={item.name}
                  loading="lazy"
                  style={{ width: '100%', height: '64px', objectFit: 'contain' }}
                />
                <span className="sticker-picker-name">{item.name}</span>
              </div>
            );
          })}

          {filteredStickers.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
              Стикеры не найдены
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

