import { describe, it, expect, vi, beforeEach } from 'vitest';
import { playPaperRustle, playStickerPop, triggerHaptic } from './soundEffects';

describe('soundEffects service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('runs safely without crashing when AudioContext is unavailable (e.g. Node/SSR)', () => {
    expect(() => playPaperRustle(true)).not.toThrow();
    expect(() => playStickerPop(true)).not.toThrow();
  });

  it('does nothing when disabled', () => {
    expect(() => playPaperRustle(false)).not.toThrow();
    expect(() => playStickerPop(false)).not.toThrow();
  });

  it('calls navigator.vibrate when available and enabled', () => {
    const vibrateMock = vi.fn();
    vi.stubGlobal('navigator', { vibrate: vibrateMock });

    triggerHaptic(10, true);
    expect(vibrateMock).toHaveBeenCalledWith(10);

    triggerHaptic(10, false);
    expect(vibrateMock).toHaveBeenCalledTimes(1); // not called again
  });
});
