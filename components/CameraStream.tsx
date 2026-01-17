import React, { useState, useRef, useEffect } from 'react';
import { X, Loader2, AlertCircle, CheckCircle, Video, Mic, Volume2, VolumeX, Radio, AlertTriangle } from 'lucide-react';
import { playSound } from '../services/audio';

interface CameraStreamProps {
  onBack?: () => void;
  token: any;
}

export const CameraStream: React.FC<CameraStreamProps> = ({ onBack, token }) => {
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [localMonitoring, setLocalMonitoring] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false); // Prevent multiple simultaneous starts

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream('Component unmounting');
    };
  }, []);

  const stopStream = (reason?: string) => {
    console.log('Stopping stream...', reason ? `Reason: ${reason}` : '');
    if (reason) {
      console.trace('Stack trace for stopStream call:');
    }
    isStartingRef.current = false; // Reset starting flag

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log(`Stopping ${track.kind} track: ${track.label}`);
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsLive(false);
    setVideoDimensions({ width: 0, height: 0 });
    setError(null);
    console.log('Stream stopped');
  };

  const startCameraStream = async () => {
    // Prevent multiple simultaneous starts
    if (isStartingRef.current) {
      console.log('Stream already starting, ignoring duplicate call');
      return;
    }

    setIsLoading(true);
    setError(null);
    isStartingRef.current = true;
    console.log('Starting camera + mic stream...');

    try {
      // Stop any existing stream
      if (streamRef.current) {
        console.log('Stopping existing stream before starting new one...');
        stopStream('Starting new stream - cleaning up old one');
      }

      console.log('Requesting camera + mic with simple constraints...');

      // Simple, direct getUserMedia call
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user'
        },
        audio: micEnabled
      });

      console.log('Stream obtained:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        active: stream.active
      });

      // Log track details
      stream.getTracks().forEach(track => {
        console.log(`${track.kind} track:`, {
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          settings: track.getSettings ? track.getSettings() : 'N/A'
        });
      });

      // Store stream
      streamRef.current = stream;

      // Direct video assignment
      if (videoRef.current) {
        console.log('Assigning stream to video element...');

        // Clear any existing srcObject
        videoRef.current.srcObject = null;

        // Assign stream directly
        videoRef.current.srcObject = stream;
        videoRef.current.muted = !localMonitoring; // Allow local monitoring if enabled
        videoRef.current.controls = false;
        videoRef.current.playsInline = true;
        videoRef.current.style.width = '100%';
        videoRef.current.style.height = '100%';
        videoRef.current.style.objectFit = 'cover';

        console.log('Stream assigned, waiting for video to load...');

        // Wait for video to load
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded:', {
            videoWidth: videoRef.current?.videoWidth,
            videoHeight: videoRef.current?.videoHeight,
            readyState: videoRef.current?.readyState,
            currentTime: videoRef.current?.currentTime
          });

          const width = videoRef.current?.videoWidth || 0;
          const height = videoRef.current?.videoHeight || 0;

          setVideoDimensions({ width, height });

          if (width > 0 && height > 0) {
            console.log('Valid video dimensions:', { width, height });

            // Start playback
            videoRef.current?.play().then(() => {
              console.log('Video playback started');
              setIsLive(true);
              setIsLoading(false);
              playSound('success');
            }).catch(e => {
              console.error('Video play failed:', e);
              setError(`Video playback failed: ${e.message}`);
              setIsLoading(false);
            });
          } else {
            console.error('Invalid video dimensions:', { width, height });
            setError(`Invalid video dimensions: ${width}x${height}`);
            setIsLoading(false);
          }
        };

        // Handle video errors
        videoRef.current.onerror = (e) => {
          console.error('Video element error:', e);
          setError('Video element error occurred');
          setIsLoading(false);
        };

        // Set up video dimensions monitoring
        const checkDimensions = setInterval(() => {
          if (videoRef.current && videoRef.current.videoWidth > 0) {
            setVideoDimensions({
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight
            });
          }
        }, 100);

        // Clear interval after 10 seconds
        setTimeout(() => clearInterval(checkDimensions), 10000);

      } else {
        setError('Video element not found');
        setIsLoading(false);
      }

    } catch (err) {
      console.error('Stream acquisition failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to access camera/mic');
      setIsLoading(false);
    } finally {
      isStartingRef.current = false;
    }
  };

  return (
    <div className="bg-[#0A0A0A] border border-doge/20 rounded-3xl p-6 shadow-lg shadow-doge/5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-doge/50 to-transparent"></div>

      {onBack && (
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-500 hover:text-white mb-4 transition-colors">
          <X size={12} /> Back to Projects
        </button>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-doge/20 p-2 rounded-lg text-doge">
            <Video size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Camera Stream</h3>
            <p className="text-xs text-gray-500">Direct camera + microphone</p>
          </div>
        </div>
      </div>

      {/* Status */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="space-y-4 mb-6">
        {/* Mic Toggle */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
          <span className="text-white text-sm">Microphone</span>
          <button
            onClick={() => setMicEnabled(!micEnabled)}
            disabled={isLive}
            className={`w-12 h-6 rounded-full transition-colors ${
              micEnabled ? 'bg-green-500' : 'bg-gray-600'
            } ${isLive ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              micEnabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {/* Local Audio Monitoring Toggle */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
          <span className="text-white text-sm">Local Audio Monitoring</span>
          <button
            onClick={() => setLocalMonitoring(!localMonitoring)}
            disabled={!isLive}
            className={`w-12 h-6 rounded-full transition-colors ${
              localMonitoring ? 'bg-blue-500' : 'bg-gray-600'
            } ${!isLive ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              localMonitoring ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {/* Start/Stop Button */}
        <button
          onClick={() => isLive ? stopStream('User clicked stop button') : startCameraStream()}
          disabled={isLoading}
          className={`w-full p-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
            isLoading
              ? 'bg-gray-600 cursor-wait'
              : isLive
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-doge hover:bg-doge/80 text-black'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Starting...
            </>
          ) : isLive ? (
            <>
              <X size={20} />
              Stop Stream
            </>
          ) : (
            <>
              <Video size={20} />
              Start Camera + Mic
            </>
          )}
        </button>
      </div>

      {/* Video Preview */}
      <div
        className="aspect-video bg-black rounded-xl overflow-hidden border border-white/10 relative"
        style={{
          minHeight: '480px',
          width: '100%',
          height: '480px',
          maxWidth: '100%'
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          controls={false}
          className="w-full h-full object-cover"
          style={{ backgroundColor: '#000' }}
        />

        {/* Status Overlay */}
        {!isLive && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <div className="text-center text-white">
              <Video size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm opacity-75">Click "Start Camera + Mic" to begin</p>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <div className="text-center text-white">
              <Loader2 size={48} className="mx-auto mb-2 animate-spin" />
              <p className="text-sm opacity-75">Accessing camera...</p>
            </div>
          </div>
        )}

        {/* Live Indicator */}
        {isLive && (
          <div className="absolute top-4 left-4">
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-1">
              <Radio size={12} fill="currentColor" className="animate-pulse" />
              LIVE
            </div>
          </div>
        )}

        {/* Dimensions Display */}
        {isLive && (videoDimensions.width > 0 || videoDimensions.height > 0) && (
          <div className="absolute bottom-4 left-4">
            <div className="bg-black/80 text-green-400 px-2 py-1 rounded text-xs font-mono">
              {videoDimensions.width}x{videoDimensions.height}
            </div>
          </div>
        )}

        {/* Black screen indicator if video should be showing but isn't */}
        {isLive && videoDimensions.width === 0 && videoDimensions.height === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="text-yellow-400 text-sm bg-black/80 px-3 py-2 rounded flex items-center gap-2">
              <AlertTriangle size={14} />
              Loading video...
            </div>
          </div>
        )}
      </div>

      {/* Debug Info */}
      {import.meta.env.DEV && (
        <div className="mt-4 p-3 bg-gray-900/50 rounded-lg text-xs text-gray-400 font-mono">
          <div>Status: {isLive ? 'LIVE' : 'STOPPED'}</div>
          <div>Loading: {isLoading ? 'YES' : 'NO'}</div>
          <div>Mic: {micEnabled ? 'ENABLED' : 'DISABLED'}</div>
          <div>Local Monitoring: {localMonitoring ? 'ON (you can hear yourself)' : 'OFF (muted to prevent feedback)'}</div>
          <div>Video: {videoDimensions.width}x{videoDimensions.height}</div>
          <div>Error: {error || 'NONE'}</div>
        </div>
      )}
    </div>
  );
};
