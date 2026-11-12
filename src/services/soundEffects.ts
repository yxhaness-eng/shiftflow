/**
 * ShiftFlow Cozy Sound Effects & Haptics Engine
 * Pure Web Audio API synthesis - zero external audio assets required!
 * Aesthetic: Gentle soft paper rustle and cute bubbly pop.
 */

let audioCtx: AudioContext | null = null;

/**
 * Lazily initialize and resume the Web Audio Context upon user interaction.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }

    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {
        // Silently ignore browser autoplay policy denials
      });
    }

    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Synthesizes a cozy soft paper rustle sound (reminiscent of turning a scrapbook page).
 * Built with bandpass-filtered noise + gentle envelope.
 */
export function playPaperRustle(enabled = true): void {
  if (!enabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const duration = 0.14; // seconds
    const sampleRate = ctx.sampleRate;
    const frameCount = Math.floor(sampleRate * duration);

    // Create a short burst of noise
    const noiseBuffer = ctx.createBuffer(1, frameCount, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      // Pinkish/brownish weighted noise for warm soft paper sound
      output[i] = (Math.random() * 2 - 1) * 0.7;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    // Filter to simulate paper friction (muffled bandpass around 1200Hz - 2200Hz)
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + duration);
    filter.Q.setValueAtTime(1.1, now);

    // Gain envelope with soft organic attack and exponential decay
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.07, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + duration);
  } catch (err) {
    console.debug('Failed to play paper rustle sound:', err);
  }
}

/**
 * Synthesizes a cute gentle tactile pop (reminiscent of placing a vinyl sticker).
 * Built with a friendly frequency pitch sweep and soft decay.
 */
export function playStickerPop(enabled = true): void {
  if (!enabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const duration = 0.09; // seconds

    // Primary cute pitch oscillator
    const osc = ctx.createOscillator();
    osc.type = 'sine';

    // Cheerful bubbly sweep from ~380Hz to 760Hz, then settling down softly
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.035);
    osc.frequency.exponentialRampToValueAtTime(540, now + duration);

    // Soft click-free envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.14, now + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Subtle low-pass filter to keep sound cozy and rounded rather than sharp
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, now);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch (err) {
    console.debug('Failed to play sticker pop sound:', err);
  }
}

/**
 * Synthesizes a crisp, super satisfying tactile click / bubble tap sound
 * for buttons, pills, checkboxes, and badge toggles ("звук тыкания").
 */
export function playBubbleTap(enabled = true): void {
  if (!enabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const duration = 0.04;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + duration);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch (err) {
    console.debug('Failed to play bubble tap sound:', err);
  }
}

/**
 * Triggers subtle haptic feedback on mobile devices supporting Navigator.vibrate.
 * @param duration Duration in milliseconds (default 10ms for ultra-gentle tactile feel)
 * @param enabled Whether haptics is enabled by user preference
 */
export function triggerHaptic(duration = 10, enabled = true): void {
  if (!enabled) return;

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(duration);
    }
  } catch {
    // Ignore environments where vibration API is unavailable or restricted
  }
}
