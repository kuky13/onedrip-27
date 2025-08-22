import { useCallback } from 'react';

export const useGameSounds = () => {
  // Simple sound effects using Web Audio API
  const playSound = useCallback((frequency: number, duration: number = 100, type: OscillatorType = 'square') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      // Silently fail if audio context is not available
      console.debug('Audio not available:', error);
    }
  }, []);

  const playBugClick = useCallback(() => {
    playSound(800, 30, 'sine');
    setTimeout(() => playSound(600, 30, 'sine'), 20);
    setTimeout(() => playSound(400, 50, 'sine'), 40);
  }, [playSound]);

  const playGameOver = useCallback(() => {
    // Game over sound sequence
    setTimeout(() => playSound(200, 200), 0);
    setTimeout(() => playSound(180, 200), 100);
    setTimeout(() => playSound(160, 300), 200);
  }, [playSound]);

  const playLevelUp = useCallback(() => {
    // Level up sound
    setTimeout(() => playSound(400, 100), 0);
    setTimeout(() => playSound(600, 100), 100);
    setTimeout(() => playSound(800, 150), 200);
  }, [playSound]);

  return {
    playBugClick,
    playGameOver,
    playLevelUp
  };
};