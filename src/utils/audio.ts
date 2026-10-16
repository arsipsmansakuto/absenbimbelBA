/**
 * Audio & Voice helper for SIM BIMBEL BA
 */

export function playBeep(freq = 659, type: OscillatorType = 'sine', duration = 0.15) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio Web API error:', e);
  }
}

export function playSuccessChime() {
  playBeep(659, 'sine', 0.12);
  setTimeout(() => playBeep(988, 'sine', 0.18), 120);
}

export function playCelebrationChime() {
  playBeep(523, 'triangle', 0.1);
  setTimeout(() => playBeep(659, 'triangle', 0.1), 100);
  setTimeout(() => playBeep(784, 'triangle', 0.1), 200);
  setTimeout(() => playBeep(1046, 'triangle', 0.25), 300);
}

export function playWarningSound() {
  playBeep(260, 'sawtooth', 0.35);
}

export function playErrorSound() {
  playBeep(330, 'square', 0.25);
}

export function speakText(text: string) {
  try {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    console.warn('SpeechSynthesis error:', e);
  }
}
