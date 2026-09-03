let audioCtx: AudioContext | null = null;

export function resumeAudio(): void {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (e) {
    console.warn('AudioContext error:', e);
  }
}

export function playClickTone(): void {
  try {
    if (!audioCtx) resumeAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.03);
  } catch (e) {
    console.warn('Audio error:', e);
  }
}

export function playScenarioSweep(): void {
  try {
    if (!audioCtx) resumeAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) {
    console.warn('Audio error:', e);
  }
}

export function playCriticalAlert(): void {
  try {
    if (!audioCtx) resumeAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    
    // Pulse 1: 0-80ms
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.setValueAtTime(0, audioCtx.currentTime + 0.08);
    
    // Pulse 2: 120-200ms
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime + 0.12);
    gain.gain.setValueAtTime(0, audioCtx.currentTime + 0.20);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.20);
  } catch (e) {
    console.warn('Audio error:', e);
  }
}

export function isAudioReady(): boolean {
  return audioCtx !== null && audioCtx.state === 'running';
}
