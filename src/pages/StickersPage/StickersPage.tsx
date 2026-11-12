import React, { useState, useMemo } from 'react';
import { Search, Calendar, Sparkles, Check, X, Heart, Edit2, Tag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { STICKERS_MANIFEST, STICKER_CATEGORIES } from '../../data/stickersManifest';
import { ACTIVITY_PRESETS } from '../../data/lifeTrackerData';
import { StickerManifestItem, StickerCategory } from '../../types';
import { getTodayString, formatFullDateRU } from '../../utils/dateUtils';
import { playBubbleTap, triggerHaptic } from '../../services/soundEffects';

export const StickersPage: React.FC = () => {
  const {
    addStickerToDate,
    placedStickers,
    setSelectedDate,
    setActiveTab,
    settings,
    toggleFavoriteSticker,
    setActivityCustomLabel
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSticker, setSelectedSticker] = useState<StickerManifestItem | null>(null);
  const [targetDate, setTargetDate] = useState<string>(getTodayString());
  const [justPlaced, setJustPlaced] = useState(false);

  // Custom labels editing state
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editLabelInput, setEditLabelInput] = useState('');

  const favoriteIds = settings.favoriteStickerIds || [];

  const handleStartEditLabel = (id: string, currentLabel: string) => {
    playBubbleTap(settings.soundEnabled !== false);
    setEditingActivityId(id);
    setEditLabelInput(settings.activityCustomLabels?.[id] || currentLabel);
  };

  const handleSaveLabel = async (id: string) => {
    if (!editLabelInput.trim()) return;
    playBubbleTap(settings.soundEnabled !== false);
    triggerHaptic(8, settings.hapticsEnabled !== false);
    await setActivityCustomLabel(id, editLabelInput.trim());
    setEditingActivityId(null);
    setEditLabelInput('');
  };

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

  // Placed count calculation
  const placedCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of placedStickers) {
      counts[s.stickerId] = (counts[s.stickerId] || 0) + 1;
    }
    return counts;
  }, [placedStickers]);

  const handlePlaceSticker = async () => {
    if (!selectedSticker) return;
    await addStickerToDate(targetDate, selectedSticker.id);
    setJustPlaced(true);
    setTimeout(() => {
      setJustPlaced(false);
      setSelectedSticker(null);
    }, 1200);
  };

  const handleGoToDate = (date: string) => {
    setSelectedDate(date);
    setActiveTab('calendar');
  };

  return (
    <div className="stickers-page">
      {/* Header Banner */}
      <div className="stickers-hero-card">
        <div className="hero-content">
          <h2 className="stickers-title">
            <Sparkles size={20} color="var(--accent-primary)" />
            <span>Стикеры и отметки календаря</span>
          </h2>
          <p className="stickers-subtitle">
            Круглые значки дня для настроения и дел, плюс 52 скрапбук-стикера. Нажми на карандаш, чтобы переименовать любой значок!
          </p>
        </div>
      </div>

      {/* SECTION: DAY ACTIVITY CIRCULAR BADGES WITH CUSTOM NAMES */}
      <div className="card activities-manager-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 className="card-title" style={{ margin: 0 }}>
            <Tag size={18} color="var(--accent-primary)" />
            <span>Отметки дня (значки активностей)</span>
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Всего значков: {ACTIVITY_PRESETS.length}
          </span>
        </div>

        <div className="activities-custom-grid">
          {ACTIVITY_PRESETS.map((act) => {
            const currentLabel = settings.activityCustomLabels?.[act.id] || act.label;
            const isEditing = editingActivityId === act.id;

            return (
              <div key={act.id} className="activity-custom-card">
                <div className="activity-custom-avatar">
                  {act.iconImage ? (
                    <img src={`./${act.iconImage}?v=circle`} alt={currentLabel} />
                  ) : (
                    <span>{act.emoji}</span>
                  )}
                </div>

                <div className="activity-custom-body">
                  {isEditing ? (
                    <div className="activity-inline-edit">
                      <input
                        type="text"
                        value={editLabelInput}
                        onChange={(e) => setEditLabelInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveLabel(act.id)}
                        autoFocus
                        className="activity-edit-input"
                      />
                      <button className="btn-icon-xs save" onClick={() => handleSaveLabel(act.id)} title="Сохранить">
                        <Check size={14} />
                      </button>
                      <button className="btn-icon-xs cancel" onClick={() => setEditingActivityId(null)} title="Отмена">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="activity-display-row">
                      <span className="activity-custom-name">{currentLabel}</span>
                      <button
                        className="btn-icon-xs edit"
                        onClick={() => handleStartEditLabel(act.id, act.label)}
                        title="Изменить название"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="stickers-filter-bar">
        <div className="stickers-search-box">
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Найти стикер по названию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        <div className="category-scroll-strip">
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

      {/* Stickers Showcase Grid */}
      <div className="stickers-showcase-grid">
        {filteredStickers.map((item) => {
          const count = placedCountMap[item.id] || 0;
          const isFav = favoriteIds.includes(item.id);
          return (
            <div
              key={item.id}
              className="sticker-showcase-card"
              onClick={() => setSelectedSticker(item)}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavoriteSticker(item.id);
                }}
                style={{
                  position: 'absolute',
                  top: '6px',
                  left: '6px',
                  background: 'rgba(255,255,255,0.85)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isFav ? '#E05D6D' : 'var(--text-muted)',
                  zIndex: 2
                }}
                title={isFav ? 'В избранном' : 'Добавить в избранное'}
              >
                <Heart size={13} fill={isFav ? 'currentColor' : 'none'} />
              </button>
              <div className="sticker-img-container">
                <img
                  src={`./${item.imagePath}?v=cutout2`}
                  alt={item.name}
                  loading="lazy"
                  className="sticker-showcase-img"
                />
                {count > 0 && (
                  <span className="sticker-placed-badge" title={`Наклеен ${count} раз`}>
                    {count}
                  </span>
                )}
              </div>
              <div className="sticker-card-info">
                <span className="sticker-card-name">{item.name}</span>
                <span className="sticker-card-category">{item.category}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticker Details & Quick Place Modal */}
      {selectedSticker && (
        <div className="modal-backdrop" onClick={() => setSelectedSticker(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  {selectedSticker.name}
                </h3>
                <button
                  type="button"
                  onClick={() => toggleFavoriteSticker(selectedSticker.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: favoriteIds.includes(selectedSticker.id) ? '#E05D6D' : 'var(--text-muted)'
                  }}
                  title={favoriteIds.includes(selectedSticker.id) ? 'В избранном' : 'Добавить в избранное'}
                >
                  <Heart size={18} fill={favoriteIds.includes(selectedSticker.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
              <button className="btn-icon" onClick={() => setSelectedSticker(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ alignItems: 'center', textAlign: 'center', gap: '16px' }}>
              <div className="sticker-modal-preview">
                <img
                  src={`./${selectedSticker.imagePath}?v=cutout2`}
                  alt={selectedSticker.name}
                  style={{ width: '140px', height: '140px', objectFit: 'contain' }}
                />
              </div>

              <div>
                <span className="badge" style={{ backgroundColor: 'var(--accent-lavender)', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {selectedSticker.category}
                </span>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  {selectedSticker.description}
                </p>
              </div>

              {/* Target date selector to place sticker */}
              <div className="place-action-box">
                <label className="section-label" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} /> Наклеить на дату:
                </label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <input
                    type="date"
                    className="date-input"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                  <button
                    className={`btn ${justPlaced ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={handlePlaceSticker}
                    disabled={justPlaced}
                  >
                    {justPlaced ? (
                      <>
                        <Check size={16} /> Наклеено!
                      </>
                    ) : (
                      'Приклеить'
                    )}
                  </button>
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'left' }}>
                  {formatFullDateRU(targetDate)}
                </div>
              </div>

              {/* Already placed on dates */}
              {placedStickers.filter(s => s.stickerId === selectedSticker.id).length > 0 && (
                <div style={{ width: '100%', textAlign: 'left', marginTop: '8px' }}>
                  <span className="section-label" style={{ fontSize: '0.8rem' }}>Уже наклеен на дни:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    {placedStickers
                      .filter(s => s.stickerId === selectedSticker.id)
                      .map(s => (
                        <button
                          key={s.id}
                          className="date-chip"
                          onClick={() => handleGoToDate(s.date)}
                        >
                          {s.date} ➔
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedSticker(null)}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
