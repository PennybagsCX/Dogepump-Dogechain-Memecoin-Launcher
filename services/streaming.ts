/**
 * Global Streaming Service
 * Maintains camera/mic stream across navigation and component lifecycle
 */

import { playSound } from './audio';

export interface StreamInfo {
  stream: MediaStream;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  dimensions: { width: number; height: number };
  startTime: number;
}

class StreamingService {
  private stream: MediaStream | null = null;
  private streamInfo: StreamInfo | null = null;
  private listeners: Set<(info: StreamInfo | null) => void> = new Set();
  private localMonitoring = false;
  private videoElements: Set<HTMLVideoElement> = new Set();

  // Get current stream info
  getStreamInfo(): StreamInfo | null {
    return this.streamInfo;
  }

  // Subscribe to stream updates
  subscribe(callback: (info: StreamInfo | null) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.streamInfo));
  }

  // Start camera + mic stream
  async startStream(options: {
    videoEnabled?: boolean;
    audioEnabled?: boolean;
    videoConstraints?: MediaTrackConstraints;
  } = {}): Promise<StreamInfo> {
    const { videoEnabled = true, audioEnabled = true, videoConstraints } = options;

    // Stop existing stream if any
    if (this.stream) {
      this.stopStream();
    }

    console.log('🚀 Starting global camera + mic stream...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled ? (videoConstraints || {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30, min: 15 }
        }) : false,
        audio: audioEnabled ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      });

      console.log('✅ Stream obtained:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        active: stream.active
      });

      // Store stream
      this.stream = stream;
      this.streamInfo = {
        stream,
        isVideoEnabled: stream.getVideoTracks().some(t => t.enabled),
        isAudioEnabled: stream.getAudioTracks().some(t => t.enabled),
        dimensions: { width: 0, height: 0 }, // Will be updated when video loads
        startTime: Date.now()
      };

      // Update all video elements
      this.updateAllVideoElements();

      // Get video dimensions after metadata loads
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        this.streamInfo.dimensions = {
          width: settings.width || 0,
          height: settings.height || 0
        };
      }

      // Play success sound (handle potential errors)
      try {
        playSound('success');
      } catch (err) {
        console.log('⚠️ Sound playback failed:', err);
      }

      this.notifyListeners();

      console.log('✅ Stream started successfully:', this.streamInfo);
      return this.streamInfo;

    } catch (error) {
      console.error('❌ Failed to start stream:', error);

      // Ensure clean state on failure
      this.streamInfo = null;
      this.notifyListeners();

      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Camera/Mic access failed: ${error.message}`);
      } else {
        throw new Error('Camera/Mic access failed: Unknown error');
      }
    }
  }

  // Stop current stream
  stopStream() {
    console.log('🛑 Stopping global stream...');

    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        console.log(`⏹️ Stopping ${track.kind} track: ${track.label}`);
        track.stop();
      });
      this.stream.getTracks().forEach(track => {
        this.stream!.removeTrack(track);
      });
      this.stream = null;
    }

    // Clear all video elements
    this.videoElements.forEach(element => {
      element.srcObject = null;
    });
    this.videoElements.clear();

    this.streamInfo = null;
    this.localMonitoring = false;
    this.notifyListeners();

    console.log('✅ Stream stopped');
  }

  // Toggle local audio monitoring
  setLocalMonitoring(enabled: boolean) {
    this.localMonitoring = enabled;
    this.updateAllVideoElements();
    console.log(`🔊 Local monitoring ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  // Register a video element to display the stream
  registerVideoElement(element: HTMLVideoElement) {
    this.videoElements.add(element);
    this.updateVideoElement(element);
  }

  // Unregister a video element
  unregisterVideoElement(element: HTMLVideoElement) {
    this.videoElements.delete(element);
    element.srcObject = null;
  }

  // Update a single video element
  private updateVideoElement(element: HTMLVideoElement) {
    // Clear previous stream first
    if (element.srcObject) {
      element.srcObject = null;
    }

    if (this.stream) {
      element.srcObject = this.stream;
      element.muted = !this.localMonitoring;
      element.controls = false;
      element.playsInline = true;

      // Force video reload
      element.load();

      // Attempt to play the video
      element.play().catch(err => {
        console.log('⚠️ Video autoplay prevented:', err);
      });
    }
  }

  // Update all registered video elements
  private updateAllVideoElements() {
    this.videoElements.forEach(element => this.updateVideoElement(element));
  }

  // Check if stream is active
  isStreamActive(): boolean {
    return this.stream !== null && this.stream.active;
  }

  // Get stream duration
  getStreamDuration(): number {
    return this.streamInfo ? Date.now() - this.streamInfo.startTime : 0;
  }

  // Get local monitoring state
  getLocalMonitoring(): boolean {
    return this.localMonitoring;
  }
}

export const streamingService = new StreamingService();