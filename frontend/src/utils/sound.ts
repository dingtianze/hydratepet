// Sound utility for notifications
// Uses Web Audio API to generate simple tones

class SoundManager {
  private audioContext: AudioContext | null = null;
  private isEnabled = true;
  private volume = 0.5;

  constructor() {
    // Check for stored preferences
    const storedVolume = localStorage.getItem('hydratepet-sound-volume');
    if (storedVolume) {
      this.volume = parseFloat(storedVolume);
    }
    
    const storedEnabled = localStorage.getItem('hydratepet-sound-enabled');
    if (storedEnabled !== null) {
      this.isEnabled = storedEnabled === 'true';
    }
  }

  private initAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Play a simple "drop" sound
  playDropSound(): void {
    if (!this.isEnabled) return;
    
    try {
      const ctx = this.initAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (error) {
      console.error('[Sound] Failed to play drop sound:', error);
    }
  }

  // Play a "success" sound
  playSuccessSound(): void {
    if (!this.isEnabled) return;

    try {
      const ctx = this.initAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Play a pleasant major third chord arpeggio
      const now = ctx.currentTime;
      oscillator.type = 'sine';
      
      oscillator.frequency.setValueAtTime(523.25, now); // C5
      oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5

      gainNode.gain.setValueAtTime(this.volume * 0.2, now);
      gainNode.gain.setValueAtTime(this.volume * 0.2, now + 0.1);
      gainNode.gain.setValueAtTime(this.volume * 0.2, now + 0.2);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      oscillator.start(now);
      oscillator.stop(now + 0.5);
    } catch (error) {
      console.error('[Sound] Failed to play success sound:', error);
    }
  }

  // Play a "notification" sound
  playNotificationSound(): void {
    if (!this.isEnabled) return;

    try {
      const ctx = this.initAudioContext();
      
      // Create two oscillators for a more pleasant sound
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.type = 'sine';
      osc2.type = 'triangle';

      const now = ctx.currentTime;
      
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(440, now + 0.3);
      
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.exponentialRampToValueAtTime(220, now + 0.3);

      gainNode.gain.setValueAtTime(this.volume * 0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.3);
    } catch (error) {
      console.error('[Sound] Failed to play notification sound:', error);
    }
  }

  // Play an "error" sound
  playErrorSound(): void {
    if (!this.isEnabled) return;

    try {
      const ctx = this.initAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sawtooth';
      
      const now = ctx.currentTime;
      oscillator.frequency.setValueAtTime(200, now);
      oscillator.frequency.linearRampToValueAtTime(150, now + 0.2);

      gainNode.gain.setValueAtTime(this.volume * 0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      oscillator.start(now);
      oscillator.stop(now + 0.2);
    } catch (error) {
      console.error('[Sound] Failed to play error sound:', error);
    }
  }

  // Enable/disable sound
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('hydratepet-sound-enabled', String(enabled));
  }

  isSoundEnabled(): boolean {
    return this.isEnabled;
  }

  // Set volume (0-1)
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('hydratepet-sound-volume', String(this.volume));
  }

  getVolume(): number {
    return this.volume;
  }

  // Resume audio context (required for some browsers)
  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

// Hook for React components
export function useSound() {
  return {
    playDropSound: () => soundManager.playDropSound(),
    playSuccessSound: () => soundManager.playSuccessSound(),
    playNotificationSound: () => soundManager.playNotificationSound(),
    playErrorSound: () => soundManager.playErrorSound(),
    setEnabled: (enabled: boolean) => soundManager.setEnabled(enabled),
    isEnabled: soundManager.isSoundEnabled(),
    setVolume: (volume: number) => soundManager.setVolume(volume),
    getVolume: soundManager.getVolume(),
    resume: () => soundManager.resume(),
  };
}

export default soundManager;
