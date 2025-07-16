import { useCallback, useRef } from 'react';

/**
 * Custom hook for chess game sound effects
 * Creates and manages audio contexts for various game events
 */
export const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API not supported');
        return null;
      }
    }
    return audioContextRef.current;
  }, []);

  /**
   * Create a tone using Web Audio API
   */
  const createTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }, [getAudioContext]);

  /**
   * Create a chord (multiple tones)
   */
  const createChord = useCallback((frequencies: number[], duration: number, type: OscillatorType = 'sine') => {
    frequencies.forEach((freq, index) => {
      setTimeout(() => createTone(freq, duration, type), index * 20);
    });
  }, [createTone]);

  /**
   * Play move sound - a subtle click
   */
  const playMoveSound = useCallback(() => {
    createTone(800, 0.1, 'square');
  }, [createTone]);

  /**
   * Play capture sound - a more pronounced sound
   */
  const playCaptureSound = useCallback(() => {
    createChord([600, 400], 0.15, 'sawtooth');
  }, [createChord]);

  /**
   * Play check sound - an alert tone
   */
  const playCheckSound = useCallback(() => {
    createChord([1000, 800, 600], 0.2, 'triangle');
  }, [createChord]);

  /**
   * Play game over sound - a final chord
   */
  const playGameOverSound = useCallback(() => {
    setTimeout(() => createTone(523, 0.3), 0);   // C
    setTimeout(() => createTone(659, 0.3), 100); // E
    setTimeout(() => createTone(784, 0.3), 200); // G
    setTimeout(() => createTone(1047, 0.5), 300); // C
  }, [createTone]);

  /**
   * Play castling sound - a special sequence
   */
  const playCastlingSound = useCallback(() => {
    createTone(600, 0.1);
    setTimeout(() => createTone(800, 0.1), 100);
  }, [createTone]);

  /**
   * Play pawn promotion sound - ascending notes
   */
  const playPromotionSound = useCallback(() => {
    [523, 659, 784, 1047].forEach((freq, index) => {
      setTimeout(() => createTone(freq, 0.15), index * 50);
    });
  }, [createTone]);

  return {
    playMoveSound,
    playCaptureSound,
    playCheckSound,
    playGameOverSound,
    playCastlingSound,
    playPromotionSound
  };
};
