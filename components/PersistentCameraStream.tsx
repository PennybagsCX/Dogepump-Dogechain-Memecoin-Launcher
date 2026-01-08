import React, { useState, useRef, useEffect } from 'react';
import { X, Loader2, AlertCircle, Video, Mic, Volume2, VolumeX, Radio } from 'lucide-react';
import { streamingService, StreamInfo } from '../services/streaming';

interface PersistentCameraStreamProps {
  onBack?: () => void;
  token: any;
  showControls?: boolean;
  autoStart?: boolean;
}

export const PersistentCameraStream: React.FC<PersistentCameraStreamProps> = ({
  onBack,
  token,
  showControls = true,
  autoStart = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
    const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [localMonitoring, setLocalMonitoring] = useState(streamingService.getLocalMonitoring());

  const videoRef = useRef<HTMLVideoElement>(null);

  // Subscribe to global stream updates
  useEffect(() => {
    const unsubscribe = streamingService.subscribe((info) => {
      setStreamInfo(info);
      // Sync monitoring state when stream info updates
      setLocalMonitoring(streamingService.getLocalMonitoring());
      if (info) {
        setIsLoading(false);
        setError(null);
      }
    });

    // Get current stream info
    const currentInfo = streamingService.getStreamInfo();
    if (currentInfo) {
      setStreamInfo(currentInfo);
      setLocalMonitoring(streamingService.getLocalMonitoring());
    }

    return unsubscribe;
  }, []);

  // Register video element with streaming service
  useEffect(() => {
    if (videoRef.current) {
      streamingService.registerVideoElement(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        streamingService.unregisterVideoElement(videoRef.current);
      }
    };
  }, []);

  // Auto-start if requested and no stream is active
  useEffect(() => {
    if (autoStart && !streamingService.isStreamActive()) {
      handleStartStream();
    }
  }, [autoStart]);

  // Sync monitoring state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const currentState = streamingService.getLocalMonitoring();
      if (currentState !== localMonitoring) {
        setLocalMonitoring(currentState);
      }
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, [localMonitoring]);

  const handleStartStream = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await streamingService.startStream({
        videoEnabled: true,
        audioEnabled: true
      });
    } catch (err) {
      console.error('Failed to start stream:', err);
      setError(err instanceof Error ? err.message : 'Failed to access camera/mic');
      setIsLoading(false);
    }
  };

  const handleStopStream = () => {
    streamingService.stopStream();
  };

  const handleLocalMonitoringToggle = () => {
    const newState = !localMonitoring;
    setLocalMonitoring(newState);
    streamingService.setLocalMonitoring(newState);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isLive = streamInfo !== null;
  const duration = streamInfo ? formatDuration(streamingService.getStreamDuration()) : '0:00';

  return (
    <div className="bg-[#0A0A0A] border border-doge/20 rounded-3xl p-6 shadow-lg shadow-doge/5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-doge/50 to-transparent"></div>

      {onBack && (
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-500 hover:text-white mb-4 transition-colors">
          <X size={12} /> Back
        </button>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className={`${isLive ? 'bg-green-500/20' : 'bg-doge/20'} p-2 rounded-lg ${isLive ? 'text-green-400' : 'text-doge'}`}>
            <Video size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">
              {isLive ? 'Live Stream' : 'Camera Stream'}
            </h3>
            <p className="text-xs text-gray-500">
              {isLive ? `Duration: ${duration}` : 'Persistent across pages'}
            </p>
          </div>
        </div>
        {isLive && (
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-1">
            <Radio size={12} fill="currentColor" className="animate-pulse" />
            LIVE
          </div>
        )}
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
      {showControls && (
        <div className="space-y-4 mb-6">
          {/* Local Audio Monitoring Toggle */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
            <span className="text-white text-sm flex items-center gap-2">
              Mic Audio Monitoring
              {localMonitoring && <Volume2 size={14} />}
              {!localMonitoring && <VolumeX size={14} />}
            </span>
            <button
              onClick={handleLocalMonitoringToggle}
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
            onClick={isLive ? handleStopStream : handleStartStream}
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
      )}

      {/* Video Preview */}
      <div
        className="aspect-video bg-black rounded-xl overflow-hidden border border-white/10 relative"
        style={{
          minHeight: '240px',
          width: '100%',
          height: 'auto',
          maxWidth: '100%'
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          controls={false}
          className="w-full h-full object-cover"
          style={{ backgroundColor: '#000' }}
        />

        {/* Status Overlay */}
        {!isLive && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <div className="text-center text-white">
              <Video size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm opacity-75">
                {autoStart ? 'Starting stream...' : 'Click "Start Camera + Mic" to begin'}
              </p>
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

        {/* Dimensions Display */}
        {isLive && streamInfo && (streamInfo.dimensions.width > 0) && (
          <div className="absolute bottom-4 left-4">
            <div className="bg-black/80 text-green-400 px-2 py-1 rounded text-xs font-mono">
              {streamInfo.dimensions.width}x{streamInfo.dimensions.height}
            </div>
          </div>
        )}
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-900/50 rounded-lg text-xs text-gray-400 font-mono">
          <div>Global Stream: {streamingService.isStreamActive() ? 'ACTIVE' : 'INACTIVE'}</div>
          <div>Mic Monitoring: {localMonitoring ? 'ON (you can hear yourself)' : 'OFF'}</div>
          <div>Duration: {duration}</div>
          <div>Error: {error || 'NONE'}</div>
        </div>
      )}
    </div>
  );
};