"use client";

// Text-to-Speech engine using Web Speech API
// Abstraction layer allows swapping to ElevenLabs/OpenAI later

export interface TTSOptions {
  rate?: number; // 0.5 - 2.0, default 1.0
  pitch?: number; // 0 - 2, default 1.0
  voice?: SpeechSynthesisVoice;
}

export interface TTSBoundaryEvent {
  charIndex: number;
  charLength: number;
  wordIndex: number;
}

type BoundaryCallback = (event: TTSBoundaryEvent) => void;
type EndCallback = () => void;

export class WebSpeechTTS {
  private synth: SpeechSynthesis | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private boundaryCallback: BoundaryCallback | null = null;
  private endCallback: EndCallback | null = null;
  private _rate: number = 1.0;
  private _speaking: boolean = false;
  private _paused: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.synth = window.speechSynthesis;
    }
  }

  get isSupported(): boolean {
    return this.synth !== null;
  }

  get speaking(): boolean {
    return this._speaking;
  }

  get paused(): boolean {
    return this._paused;
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  // Get a good default voice for children's content
  getBestVoice(): SpeechSynthesisVoice | undefined {
    const voices = this.getVoices();
    // Prefer high-quality voices
    const preferred = [
      "Samantha", // macOS
      "Google US English", // Chrome
      "Microsoft Aria", // Edge
      "Google UK English Female", // Chrome alternative
      "Karen", // macOS alternative
      "Moira", // macOS Irish
    ];

    for (const name of preferred) {
      const match = voices.find((v) => v.name.includes(name));
      if (match) return match;
    }

    // Fallback: any English voice
    return voices.find((v) => v.lang.startsWith("en")) || voices[0];
  }

  onBoundary(callback: BoundaryCallback): void {
    this.boundaryCallback = callback;
  }

  onEnd(callback: EndCallback): void {
    this.endCallback = callback;
  }

  speak(text: string, options: TTSOptions = {}): void {
    if (!this.synth) return;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? this._rate;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.voice = options.voice ?? this.getBestVoice() ?? null;

    // Build word index mapping
    const words = text.split(/(\s+)/);
    let charOffset = 0;
    const wordMap: { start: number; end: number; index: number }[] = [];
    let wordIndex = 0;
    for (const segment of words) {
      if (segment.trim()) {
        wordMap.push({
          start: charOffset,
          end: charOffset + segment.length,
          index: wordIndex,
        });
        wordIndex++;
      }
      charOffset += segment.length;
    }

    utterance.onboundary = (event) => {
      if (event.name === "word" && this.boundaryCallback) {
        const charIndex = event.charIndex;
        const word = wordMap.find(
          (w) => charIndex >= w.start && charIndex < w.end
        );
        this.boundaryCallback({
          charIndex: event.charIndex,
          charLength: event.charLength || 0,
          wordIndex: word?.index ?? 0,
        });
      }
    };

    utterance.onend = () => {
      this._speaking = false;
      this._paused = false;
      this.endCallback?.();
    };

    utterance.onerror = () => {
      this._speaking = false;
      this._paused = false;
    };

    this.utterance = utterance;
    this._speaking = true;
    this._paused = false;
    this.synth.speak(utterance);
  }

  pause(): void {
    if (!this.synth) return;
    this.synth.pause();
    this._paused = true;
  }

  resume(): void {
    if (!this.synth) return;
    this.synth.resume();
    this._paused = false;
  }

  stop(): void {
    if (!this.synth) return;
    this.synth.cancel();
    this._speaking = false;
    this._paused = false;
    this.utterance = null;
  }

  setRate(rate: number): void {
    this._rate = Math.max(0.5, Math.min(2.0, rate));
  }

  get rate(): number {
    return this._rate;
  }
}

// Singleton
let instance: WebSpeechTTS | null = null;
export function getTTS(): WebSpeechTTS {
  if (!instance) {
    instance = new WebSpeechTTS();
  }
  return instance;
}
