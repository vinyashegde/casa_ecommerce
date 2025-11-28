// Sound Service for Notification Sounds
export interface SoundConfig {
  enabled: boolean;
  volume: number;
}

class SoundService {
  private config: SoundConfig = {
    enabled: true,
    volume: 0.7,
  };

  // Your specific notification sound
  private notificationSound = "/sounds/new-notification-022-370046.mp3";

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      const savedConfig = localStorage.getItem("notificationSoundConfig");
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      console.warn("Failed to load sound config:", error);
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(
        "notificationSoundConfig",
        JSON.stringify(this.config)
      );
    } catch (error) {
      console.warn("Failed to save sound config:", error);
    }
  }

  // Play notification sound for new orders
  async playOrderNotificationSound(): Promise<void> {
    if (!this.config.enabled || this.config.volume === 0) {
      return;
    }

    try {
      const audio = new Audio(this.notificationSound);
      audio.volume = this.config.volume;
      audio.preload = "auto";

      // Play the sound
      await audio.play();
      console.log("🔊 Playing order notification sound");
    } catch (error) {
      console.warn("Failed to play notification sound:", error);
      // Fallback: try to play a simple beep using Web Audio API
      this.playFallbackSound();
    }
  }

  private playFallbackSound(): void {
    try {
      if (typeof window === "undefined" || !("AudioContext" in window)) {
        return;
      }

      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        this.config.volume * 0.3,
        audioContext.currentTime + 0.01
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.5
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn("Fallback sound failed:", error);
    }
  }

  // Test the notification sound
  async testNotificationSound(): Promise<void> {
    await this.playOrderNotificationSound();
  }

  // Configuration methods
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveConfig();
  }

  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    this.saveConfig();
  }

  getConfig(): SoundConfig {
    return { ...this.config };
  }

  // Reset to default configuration
  resetToDefaults(): void {
    this.config = {
      enabled: true,
      volume: 0.7,
    };
    this.saveConfig();
  }
}

// Export singleton instance
export const soundService = new SoundService();
export default soundService;
