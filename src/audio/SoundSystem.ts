/**
 * Web Audio API based procedural sound system.
 * Zero external audio files required - works 100% offline with zero network failure points.
 */

// Standard DTMF frequencies for phone dialing
const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '0': [941, 1336],
  '*': [941, 1209],
  '#': [941, 1477],
};

export class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted = false;
  private keyClicksEnabled = true;
  private modemSoundActive = false;
  private activeNodes: Array<{ stop: () => void }> = [];

  constructor() {
    // Lazy init AudioContext on first user interaction
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return null;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.45;
      this.masterGain.connect(this.ctx.destination);
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.45, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setKeyClicksEnabled(enabled: boolean): void {
    this.keyClicksEnabled = enabled;
  }

  public getKeyClicksEnabled(): boolean {
    return this.keyClicksEnabled;
  }

  /**
   * Play authentic vintage PC Speaker square wave beep.
   */
  public playPcSpeaker(freq = 800, durationMs = 90): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Vintage PC speaker cutoff filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, ctx.currentTime);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // Ignore audio failure
    }
  }

  /**
   * Play SysOp paging warble chime.
   */
  public playSysopPage(): void {
    if (this.isMuted) return;
    const freqs = [880, 1174, 880, 1174, 880, 1318];
    freqs.forEach((f, idx) => {
      setTimeout(() => {
        this.playPcSpeaker(f, 90);
      }, idx * 110);
    });
  }

  /**
   * Play subtle mechanical keyboard click.
   */
  public playKeyClick(): void {
    if (this.isMuted || !this.keyClicksEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const bufferSize = ctx.sampleRate * 0.006; // 6ms click
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1400 + Math.random() * 400;
      filter.Q.value = 1.2;

      const gain = ctx.createGain();
      gain.gain.value = 0.05;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start();
    } catch {
      // Audio context might be restricted
    }
  }

  /**
   * Play procedural modem handshake sequence.
   * Returns a promise that resolves when the handshake connects.
   */
  public async playModemHandshake(phoneNumber = '555-1994', onProgress?: (msg: string) => void): Promise<void> {
    if (this.modemSoundActive) return;
    this.modemSoundActive = true;
    this.stopAllActiveSounds();

    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) {
      // If audio is muted or unavailable, just do a timed simulation
      if (onProgress) onProgress('Dialing...');
      await this.delay(1200);
      if (onProgress) onProgress('Connecting at 14400 bps...');
      await this.delay(1800);
      this.modemSoundActive = false;
      return;
    }

    try {
      // 1. Dial tone (North American standard: 350Hz + 440Hz)
      if (onProgress) onProgress('Off-hook: Dial tone...');
      await this.playDualTone(350, 440, 800);

      // 2. DTMF Dialing tones
      const digits = phoneNumber.replace(/[^0-9*#]/g, '');
      for (const char of digits) {
        const freqs = DTMF_FREQS[char];
        if (freqs) {
          await this.playDualTone(freqs[0], freqs[1], 75);
          await this.delay(45);
        }
      }

      // 3. Ringback tone (440Hz + 480Hz)
      if (onProgress) onProgress('Ringing...');
      await this.delay(400);
      await this.playDualTone(440, 480, 1100);
      await this.delay(600);

      // 4. Remote Answer Tone (CED: 2100Hz)
      if (onProgress) onProgress('Carrier detected: V.32bis handshake...');
      await this.playSingleTone(2100, 700, 0.22);
      await this.delay(80);

      // 5. V.32 / V.34 phase scrambling noise and screech
      await this.playModemScreech(2200);

      // 6. Carrier lock sync tone
      await this.playSingleTone(1800, 400, 0.15);
      await this.delay(100);

      if (onProgress) onProgress('CONNECT 14400/ARQ/V42BIS');
    } finally {
      this.modemSoundActive = false;
      this.stopAllActiveSounds();
    }
  }

  private playDualTone(f1: number, f2: number, durationMs: number): Promise<void> {
    return new Promise(resolve => {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain || this.isMuted) {
        setTimeout(resolve, durationMs);
        return;
      }

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = f1;
      osc2.frequency.value = f2;
      osc1.type = 'sine';
      osc2.type = 'sine';

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + durationMs / 1000);
      osc2.stop(ctx.currentTime + durationMs / 1000);

      const stopper = {
        stop: () => {
          try {
            osc1.stop();
            osc2.stop();
          } catch {}
        },
      };
      this.activeNodes.push(stopper);

      setTimeout(() => {
        const idx = this.activeNodes.indexOf(stopper);
        if (idx !== -1) this.activeNodes.splice(idx, 1);
        resolve();
      }, durationMs);
    });
  }

  private playSingleTone(freq: number, durationMs: number, volume = 0.15): Promise<void> {
    return new Promise(resolve => {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain || this.isMuted) {
        setTimeout(resolve, durationMs);
        return;
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = freq;
      osc.type = 'sine';

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + durationMs / 1000);

      const stopper = {
        stop: () => {
          try { osc.stop(); } catch {}
        },
      };
      this.activeNodes.push(stopper);

      setTimeout(() => {
        const idx = this.activeNodes.indexOf(stopper);
        if (idx !== -1) this.activeNodes.splice(idx, 1);
        resolve();
      }, durationMs);
    });
  }

  /**
   * Synthesize classic 90s modem noise & carrier screeching.
   */
  private playModemScreech(durationMs: number): Promise<void> {
    return new Promise(resolve => {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain || this.isMuted) {
        setTimeout(resolve, durationMs);
        return;
      }

      // Filtered noise source
      const bufferSize = ctx.sampleRate * (durationMs / 1000);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1600, ctx.currentTime);
      bandpass.frequency.linearRampToValueAtTime(2400, ctx.currentTime + durationMs / 1000);
      bandpass.Q.value = 2.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + durationMs / 1000);

      // Additional carrier tone frequency modulation
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + durationMs / 1000);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.06, ctx.currentTime);

      noise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.masterGain);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      noise.start();
      osc.start();
      noise.stop(ctx.currentTime + durationMs / 1000);
      osc.stop(ctx.currentTime + durationMs / 1000);

      const stopper = {
        stop: () => {
          try {
            noise.stop();
            osc.stop();
          } catch {}
        },
      };
      this.activeNodes.push(stopper);

      setTimeout(() => {
        const idx = this.activeNodes.indexOf(stopper);
        if (idx !== -1) this.activeNodes.splice(idx, 1);
        resolve();
      }, durationMs);
    });
  }

  public stopAllActiveSounds(): void {
    for (const node of this.activeNodes) {
      try {
        node.stop();
      } catch {}
    }
    this.activeNodes = [];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
