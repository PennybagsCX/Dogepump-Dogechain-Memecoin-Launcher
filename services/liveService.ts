
// This service has been stripped of AI functionality.

export interface LiveConfig {
  model: string;
  systemInstruction: string;
  voiceName?: string;
}

export interface LiveCallbacks {
  onOpen: () => void;
  onClose: (event: CloseEvent) => void;
  onAudioData: (data: ArrayBuffer) => void;
  onError: (error: Error | ErrorEvent) => void;
  onToolCall?: (name: string, args: any) => Promise<any>;
  onVolumeUpdate?: (vol: number) => void;
  onAiVolumeUpdate?: (vol: number) => void;
  onCaption?: (text: string) => void;
}

export class DogeLiveClient {
  constructor(apiKey: string) {}

  async connect(config: LiveConfig, callbacks: LiveCallbacks) {
    // No-op or throw error
    callbacks.onError(new Error("Live service disabled"));
  }

  async startVideo(videoEl: HTMLVideoElement) {
    // No-op
  }

  stopVideo() {
    // No-op
  }

  disconnect() {
    // No-op
  }

  getTranscript() {
     return [];
  }
}
