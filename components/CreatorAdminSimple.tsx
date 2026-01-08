import React, { useState, useRef } from 'react';
import { X, Loader2, AlertCircle, CheckCircle, Video, Mic, Volume2, VolumeX, Shield, Edit2, Gift, ArrowLeft, Radio } from 'lucide-react';
import { playSound } from '../services/audio';

// Simplified component - remove all complex logic
export const CreatorAdminSimple: React.FC<{ token: any; onBack?: () => void }> = ({ token, onBack }) => {
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioSettings, setAudioSettings] = useState({
    micEnabled: true,
    systemAudioEnabled: false
  });
  const [micLevel, setMicLevel] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const myBalance = 0; // Simplified

  const startStream = async (mode: 'camera' | 'screen') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      console.log('Starting stream with mode:', mode);

      let videoStream: MediaStream | null = null;
      let audioTracks: MediaStreamTrack[] = [];

      // Simple camera request
      if (mode === 'camera') {
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30, min: 15 }
          },
          audio: false
        });
        console.log('Camera stream obtained');
      } else {
        // Screen sharing
        videoStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        console.log('Screen stream obtained');
      }

      // Simple microphone request
      if (audioSettings.micEnabled) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: true
          });
          audioTracks = micStream.getAudioTracks();
          console.log('Microphone obtained');
        } catch (err) {
          console.warn('Mic failed:', err);
        }
      }

      // Combine streams
      if (videoStream) {
        const allTracks = [...videoStream.getTracks(), ...audioTracks];
        const combinedStream = new MediaStream(allTracks);
        streamRef.current = combinedStream;

        // Set video element
        if (videoRef.current) {
          videoRef.current.srcObject = combinedStream;
          videoRef.current.muted = true;
          videoRef.current.onloadedmetadata = () => {
            console.log('Video loaded:', {
              width: videoRef.current?.videoWidth,
              height: videoRef.current?.videoHeight
            });
            videoRef.current?.play().catch(e => console.error('Play failed:', e));
          };
        }

        setIsLive(true);
        playSound('success');
      }

    } catch (err) {
      console.error('Stream error:', err);
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsLive(false);
    setIsMuted(false);
    playSound('click');
  };

  return (
    <div className="bg-[#0A0A0A] border border-doge/20 rounded-3xl p-6 shadow-lg shadow-doge/5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-doge/50 to-transparent"></div>

      {onBack && (
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-500 hover:text-white mb-4 transition-colors">
          <ArrowLeft size={12} /> Back to Projects
        </button>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-doge/20 p-2 rounded-lg text-doge">
            <Video size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Creator Admin</h3>
            <p className="text-xs text-gray-500">Manage {token.name}</p>
          </div>
        </div>
      </div>

      {/* Stream Controls */}
      <div className="space-y-4">
        {/* Simple Stream Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => startStream('camera')}
            disabled={isLive}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
              isLive ? 'opacity-50 cursor-not-allowed border-white/10 bg-white/5' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-doge/50'
            }`}
          >
            <Video size={24} className="text-doge" />
            <span className="text-xs font-bold text-white">Camera + Mic</span>
          </button>
        </div>

        {/* Video Preview */}
        <div className="aspect-video bg-black rounded-xl overflow-hidden border border-white/10 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            controls={false}
            className="w-full h-full object-cover"
            style={{ backgroundColor: isLive ? '#001100' : '#000000' }}
          />

          {/* Status Overlay */}
          {!isLive && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
              <div className="text-center text-white">
                <Video size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm opacity-75">Click Camera + Mic to start streaming</p>
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

          {/* Dimensions */}
          {isLive && videoRef.current && videoRef.current.videoWidth > 0 && (
            <div className="absolute bottom-4 left-4">
              <div className="bg-black/80 text-green-400 px-2 py-1 rounded text-xs font-mono">
                {videoRef.current.videoWidth}x{videoRef.current.videoHeight}
              </div>
            </div>
          )}
        </div>

        {/* Audio Settings */}
        <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium">Audio Settings</span>
            <div className="text-xs text-gray-400">
              {audioSettings.micEnabled ? 'Microphone On' : 'Microphone Off'}
            </div>
          </div>

          {/* Mic Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-white text-sm">Microphone</span>
            <button
              onClick={() => setAudioSettings({...audioSettings, micEnabled: !audioSettings.micEnabled})}
              className={`w-12 h-6 rounded-full transition-colors ${
                audioSettings.micEnabled ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                audioSettings.micEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};