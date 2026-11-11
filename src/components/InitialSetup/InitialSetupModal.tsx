import React, { useState } from 'react';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const InitialSetupModal: React.FC = () => {
  const { settings, points, completeInitialSetup, saveWorkPoint } = useApp();
  const [selectedFirstPoint, setSelectedFirstPoint] = useState<string>('point_a');
  const [nameA, setNameA] = useState(points.find((p) => p.id === 'point_a')?.name || 'Точка А');
  const [nameB, setNameB] = useState(points.find((p) => p.id === 'point_b')?.name || 'Точка Б');

  if (settings.initialSetupDone) return null;

  const handleStart = async () => {
    // Update point names if modified
    const pointA = points.find((p) => p.id === 'point_a');
    const pointB = points.find((p) => p.id === 'point_b');

    if (pointA && pointA.name !== nameA) {
      await saveWorkPoint({ ...pointA, name: nameA });
    }
    if (pointB && pointB.name !== nameB) {
      await saveWorkPoint({ ...pointB, name: nameB });
    }

    await completeInitialSetup(selectedFirstPoint);
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 200 }}>
      <div className="modal-sheet setup-sheet" style={{ maxWidth: '520px' }}>
        <div className="setup-hero-banner">
          <div className="setup-hero-icon">
            <Sparkles size={28} color="var(--accent-lavender-dark)" />
          </div>
          <h2 className="setup-hero-title">Добро пожаловать в ShiftFlow!</h2>
          <p className="setup-hero-desc">
            Ваш личный уютный календарь рабочих смен, личных событий и акварельных стикеров.
          </p>
        </div>

        <div className="modal-body" style={{ gap: '18px' }}>
          <div className="setup-info-box">
            <p>
              График работы: <strong>ежедневно 7/0</strong> с чередованием рабочих точек <strong>каждые 2 дня</strong> (2 дня на одной точке, 2 дня на другой).
            </p>
            <p style={{ marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Точка отсчёта графика: <strong>1 ноября 2026 г.</strong>
            </p>
          </div>

          <div>
            <label className="section-label">С какой точки вы начинаете 1 ноября?</label>
            <div className="setup-choice-cards">
              <div
                className={`setup-choice-card ${selectedFirstPoint === 'point_a' ? 'selected' : ''}`}
                onClick={() => setSelectedFirstPoint('point_a')}
              >
                <div className="choice-dot" style={{ backgroundColor: '#D9CDEB' }}>
                  {selectedFirstPoint === 'point_a' && <Check size={14} color="#4A3E59" />}
                </div>
                <div className="choice-info">
                  <div className="choice-name">{nameA}</div>
                  <div className="choice-sub">1 и 2 ноября — {nameA}</div>
                </div>
              </div>

              <div
                className={`setup-choice-card ${selectedFirstPoint === 'point_b' ? 'selected' : ''}`}
                onClick={() => setSelectedFirstPoint('point_b')}
              >
                <div className="choice-dot" style={{ backgroundColor: '#D4DFCC' }}>
                  {selectedFirstPoint === 'point_b' && <Check size={14} color="#3F4D38" />}
                </div>
                <div className="choice-info">
                  <div className="choice-name">{nameB}</div>
                  <div className="choice-sub">1 и 2 ноября — {nameB}</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="section-label">Названия рабочих точек (можно изменить сейчас или позже):</label>
            <div className="setup-inputs-row">
              <div className="setup-input-group">
                <span className="input-dot" style={{ backgroundColor: '#D9CDEB' }} />
                <input
                  type="text"
                  value={nameA}
                  onChange={(e) => setNameA(e.target.value)}
                  placeholder="Точка А"
                  className="setup-text-input"
                />
              </div>
              <div className="setup-input-group">
                <span className="input-dot" style={{ backgroundColor: '#D4DFCC' }} />
                <input
                  type="text"
                  value={nameB}
                  onChange={(e) => setNameB(e.target.value)}
                  placeholder="Точка Б"
                  className="setup-text-input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary setup-start-btn" onClick={handleStart}>
            <span>Начать использование</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

