
let audioContext: AudioContext | null = null;
let isMuted = false;
let onMuteStateChange: ((muted: boolean) => void) | null = null;

// Set mute state and notify listeners
export const setMuteState = (muted: boolean) => {
  isMuted = muted;
  localStorage.setItem('dogepump_audio_muted', muted.toString());
  // Notify listeners (e.g., footer component)
  if (onMuteStateChange) {
    onMuteStateChange(muted);
  }
};

// Register callback for mute state changes
// Returns unsubscribe function
export const onMuteChange = (callback: (muted: boolean) => void) => {
  onMuteStateChange = callback;
  // Return unsubscribe function
  return () => {
    onMuteStateChange = null;
  };
};

// Initialize mute state from localStorage (default to unmuted)
const initMuteState = () => {
  // Force unmuted by default for all users
  isMuted = false;
  localStorage.setItem('dogepump_audio_muted', 'false');
};

// Initialize mute state on load
initMuteState();

const initAudio = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
};

export { initAudio };

export const toggleMute = () => {
  isMuted = !isMuted;
  localStorage.setItem('dogepump_audio_muted', isMuted.toString());
  return isMuted;
};

export const getMuteState = () => isMuted;

const vibrate = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

// Helper to decode base64 string to Uint8Array
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to convert raw PCM bytes to AudioBuffer
async function decodePcmData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const float32 = new Float32Array(dataInt16.length);
  for (let i = 0; i < dataInt16.length; i++) {
    float32[i] = dataInt16[i] / 32768.0;
  }

  const buffer = ctx.createBuffer(1, float32.length, sampleRate);
  buffer.getChannelData(0).set(float32);
  return buffer;
}

let currentTtsSource: AudioBufferSourceNode | null = null;

export const stopTtsAudio = () => {
  if (currentTtsSource) {
    try {
      currentTtsSource.stop();
    } catch (e) {}
    currentTtsSource = null;
  }
};

export const playTtsAudio = async (base64String: string, onPlay?: (analyser: AnalyserNode) => void): Promise<void> => {
  if (isMuted) return;
  
  try {
    const ctx = initAudio();
    if (!ctx) return;

    stopTtsAudio(); // Stop any currently playing TTS

    const bytes = decodeBase64(base64String);
    const audioBuffer = await decodePcmData(bytes, ctx, 24000);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    
    const gain = ctx.createGain();
    gain.gain.value = 0.8; // Slightly lower volume for speech
    
    // Create Analyser for visualization
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    source.connect(analyser);
    analyser.connect(gain);
    gain.connect(ctx.destination);
    
    if (onPlay) {
       onPlay(analyser);
    }
    
    source.start();
    currentTtsSource = source;
    
    source.onended = () => {
      if (currentTtsSource === source) {
        currentTtsSource = null;
      }
    };
  } catch (e) {
    console.error("TTS Playback Error:", e);
  }
};

export const playSound = (type: 'success' | 'error' | 'click' | 'launch' | 'hover' | 'boost') => {
  if (isMuted) return;
  
  try {
    const ctx = initAudio();
    if (!ctx) return;

    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    switch (type) {
      case 'click': {
        vibrate(10);
        // High-end mechanical switch feel
        // 1. Short noise burst (impact)
        const noise = ctx.createBufferSource();
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.01, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;
        
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.01);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(gain);
        
        noise.start(now);

        // 2. Clean Sine Pluck (Body)
        const osc = ctx.createOscillator();
        osc.connect(gain);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      
      case 'hover': {
        // Ultra subtle tech-tick
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.connect(oscGain);
        oscGain.connect(gain);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000, now);
        
        oscGain.gain.setValueAtTime(0.02, now);
        oscGain.gain.linearRampToValueAtTime(0, now + 0.015);
        
        osc.start(now);
        osc.stop(now + 0.02);
        break;
      }

      case 'success': {
        vibrate([50, 50, 50]);
        // Magical "Coin Get" shimmer with Major 7th chord
        const notes = [523.25, 659.25, 783.99, 987.77, 1046.50]; // C Major 7 + Octave
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          
          osc.connect(oscGain);
          oscGain.connect(ctx.destination);
          
          osc.type = 'triangle'; // Richer tone than sine
          osc.frequency.value = freq;
          
          // Slight detune for shimmer
          if (i > 0) osc.detune.value = Math.random() * 10 - 5;

          const start = now + i * 0.05;
          oscGain.gain.setValueAtTime(0, start);
          oscGain.gain.linearRampToValueAtTime(0.05, start + 0.02);
          oscGain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
          
          osc.start(start);
          osc.stop(start + 0.6);
        });
        break;
      }

      case 'error': {
        vibrate([30, 30, 100]);
        // Modern soft error (low thud + dissonance)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const sub = ctx.createOscillator();
        
        osc1.connect(gain);
        osc2.connect(gain);
        sub.connect(gain);
        
        osc1.type = 'sine';
        osc2.type = 'triangle';
        sub.type = 'sine';
        
        osc1.frequency.setValueAtTime(200, now);
        osc2.frequency.setValueAtTime(215, now); // Dissonant minor 2nd
        sub.frequency.setValueAtTime(60, now); // Sub bass impact
        
        osc1.frequency.linearRampToValueAtTime(100, now + 0.2);
        osc2.frequency.linearRampToValueAtTime(107, now + 0.2);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc1.start(now);
        osc2.start(now);
        sub.start(now);
        
        osc1.stop(now + 0.3);
        osc2.stop(now + 0.3);
        sub.stop(now + 0.3);
        break;
      }

      case 'launch': {
        vibrate([50, 50, 50, 50, 200]);
        // Cinematic "Level Up" Sweep
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const lfo = ctx.createOscillator();
        
        // Signal path: LFO -> Filter.detune | OSC -> Filter -> Gain
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 1.5);
        
        filter.type = 'lowpass';
        filter.Q.value = 10;
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.linearRampToValueAtTime(4000, now + 1.2);

        // Tremolo effect
        const tremolo = ctx.createGain();
        tremolo.gain.value = 0.5;
        lfo.frequency.value = 10;
        lfo.type = 'sine';
        lfo.connect(tremolo.gain);
        
        osc.connect(filter);
        filter.connect(tremolo);
        tremolo.connect(gain);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2);
        
        osc.start(now);
        lfo.start(now);
        osc.stop(now + 2);
        lfo.stop(now + 2);
        break;
      }
    }
  } catch (e) {
    // Ignore audio errors
  }
};
