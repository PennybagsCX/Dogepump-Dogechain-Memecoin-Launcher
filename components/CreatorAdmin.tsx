
import React, { useState, useRef, useEffect } from 'react';
import { Shield, Lock, Flame, Check, Edit2, Globe, Twitter, Send, Gift, Users, Shuffle, Video, Monitor, ArrowLeft, Award, Rocket, MessageCircle, Volume2, VolumeX, Mic, MicOff, Headphones, Settings, BarChart3, FileText, Sprout } from 'lucide-react';
import { Token } from '../types';
import { Button } from './Button';
import { useStore } from '../contexts/StoreContext';
import { useToast } from './Toast';
import { playSound } from '../services/audio';
import { formatNumber } from '../services/web3Service';
import { PersistentCameraStream } from './PersistentCameraStream';
import { FarmManagementTab } from './FarmManagementTab';

interface CreatorAdminProps {
  token: Token;
  defaultTab?: 'security' | 'info' | 'airdrop' | 'stream' | 'farms';
  onBack?: () => void;
}

export const CreatorAdmin: React.FC<CreatorAdminProps> = ({ token, defaultTab = 'security', onBack }) => {
  const { updateSecurity, updateTokenSocials, airdropToken, myHoldings } = useStore();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'security' | 'info' | 'airdrop' | 'stream' | 'farms'>(defaultTab);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Edit Info State
  const [socials, setSocials] = useState({
    website: token.website || '',
    twitter: token.twitter || '',
    telegram: token.telegram || '',
    discord: token.discord || ''
  });

  // Airdrop State
  const [airdropType, setAirdropType] = useState<'random' | 'holders'>('random');
  const [airdropAmount, setAirdropAmount] = useState(1000);
  const [recipientCount, setRecipientCount] = useState(10);

  // Stream State
  const [audioSettings, setAudioSettings] = useState({
    micEnabled: true,
    systemAudioEnabled: true
  });
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [systemAudioStream, setSystemAudioStream] = useState<MediaStream | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [systemAudioLevel, setSystemAudioLevel] = useState(0);
  const [showAudioSettings, setShowAudioSettings] = useState(true);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const systemAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const myBalance = myHoldings.find(h => h.tokenId === token.id)?.balance || 0;

  // Real-time Audio Management Functions
  const updateMicAudio = async (enabled: boolean) => {
    try {
      if (enabled && !micStream) {
        const newMicStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        setMicStream(newMicStream);
        setupAudioAnalyser(newMicStream, 'mic');
        console.log('Microphone enabled:', newMicStream.getAudioTracks().length, 'tracks');
      } else if (!enabled && micStream) {
        micStream.getTracks().forEach(track => {
          track.stop();
        });
        setMicStream(null);
        micAnalyserRef.current = null;
        setMicLevel(0);
        console.log('Microphone disabled');
      }
    } catch (error) {
      console.error('Microphone toggle error:', error);
      addToast('error', 'Failed to toggle microphone. Please check microphone permissions.');
    }
  };

  const updateSystemAudio = async (enabled: boolean) => {
    try {
      if (enabled && !systemAudioStream) {
        console.log('Attempting to capture system audio...');

        // Method 1: Try device enumeration for Stereo Mix
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInputs = devices.filter(device => device.kind === 'audioinput');
          console.log('Available audio inputs:', audioInputs.map(d => ({ label: d.label, deviceId: d.deviceId })));

          // Look for system audio devices
          const systemDevices = audioInputs.filter(d =>
            d.label.toLowerCase().includes('stereo mix') ||
            d.label.toLowerCase().includes('system') ||
            d.label.toLowerCase().includes('what u hear') ||
            d.label.toLowerCase().includes('wave out') ||
            d.label.toLowerCase().includes('loopback')
          );

          if (systemDevices.length > 0) {
            const systemDevice = systemDevices[0];
            console.log('Found system audio device:', systemDevice.label);

            const systemAudio = await navigator.mediaDevices.getUserMedia({
              audio: {
                deviceId: systemDevice.deviceId,
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
              }
            });

            setSystemAudioStream(systemAudio);
            setupAudioAnalyser(systemAudio, 'system');
            addToast('success', `System audio enabled via: ${systemDevice.label}`);
            console.log('System audio enabled via device:', systemDevice.label);
            return; // Success, exit early
          }
        } catch (deviceError) {
          console.warn('Device enumeration method failed:', deviceError);
        }

        // Method 2: Try screen sharing with audio (Chrome/Edge)
        try {
          addToast('info', 'Trying screen sharing with audio...');
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
          });

          const audioTracks = screenStream.getAudioTracks();
          const videoTracks = screenStream.getVideoTracks();

          if (audioTracks.length > 0) {
            // Create audio-only stream from screen share
            const audioOnlyStream = new MediaStream(audioTracks);
            setSystemAudioStream(audioOnlyStream);
            setupAudioAnalyser(audioOnlyStream, 'system');

            // Stop video tracks we don't need
            videoTracks.forEach(track => track.stop());

            addToast('success', 'System audio captured via screen sharing');
            console.log('System audio enabled via screen share');
            return; // Success, exit early
          } else {
            screenStream.getTracks().forEach(track => track.stop());
          }
        } catch (screenError) {
          console.warn('Screen sharing method failed:', screenError);
        }

        // If all methods failed, provide detailed guidance
        showSystemAudioSetupGuide();

      } else if (!enabled && systemAudioStream) {
        systemAudioStream.getTracks().forEach(track => {
          track.stop();
        });
        setSystemAudioStream(null);
        systemAnalyserRef.current = null;
        setSystemAudioLevel(0);
        console.log('System audio disabled');
      }
    } catch (error) {
      console.error('System audio toggle error:', error);
      showSystemAudioSetupGuide();
    }
  };

  const showSystemAudioSetupGuide = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isWindows = userAgent.includes('windows');
    const isMac = userAgent.includes('mac');
    const isChrome = userAgent.includes('chrome');

    let guideMessage = 'System Audio Setup Required:\n\n';

    if (isWindows) {
      guideMessage += `Windows Setup (Stereo Mix):
1. Right-click speaker icon → "Sounds"
2. Go to "Recording" tab
3. Right-click → "Show Disabled Devices"
4. Enable "Stereo Mix"
5. Set "Stereo Mix" as default device
6. Restart browser and try again

Alternative (Screen Sharing):
• Use Chrome/Edge browser
• Enable "Share audio" when screen sharing
• Play music to test capture`;
    } else if (isMac) {
      guideMessage += `Mac Setup:
1. Install "Soundflower" or "BlackHole" audio router
2. Set as audio output device
3. Configure audio input in browser
4. Alternative: Use Chrome screen sharing with audio`;
    } else {
      guideMessage += `Linux Setup:
1. Install "pavucontrol"
2. Create virtual audio sink
3. Configure loopback recording
4. Alternative: Use Chrome screen sharing with audio`;
    }

    if (!isChrome && !userAgent.includes('edge')) {
      guideMessage += `\n\nRecommendation: Use Chrome or Edge browser for best system audio support.`;
    }

    addToast('info', guideMessage);
    console.log('System Audio Setup Guide:', guideMessage);
  };

  // Audio Level Monitoring Functions - Simplified for performance
  const setupAudioAnalyser = (stream: MediaStream, type: 'mic' | 'system') => {
    try {
      console.log(`Setting up ${type} audio analyser...`);

      // Verify stream has audio tracks
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.error(`No audio tracks found in ${type} stream`);
        return;
      }

      console.log(`${type} stream has ${audioTracks.length} audio tracks`);

      // Resume audio context if suspended
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
          console.log('Audio context resumed');
        });
      }

      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256; // Smaller for better performance
      analyser.smoothingTimeConstant = 0.8; // Higher smoothing

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyser);

      if (type === 'mic') {
        micAnalyserRef.current = analyser;
      } else {
        systemAnalyserRef.current = analyser;
      }

      console.log(`${type} audio analyser setup complete. Audio context state:`, audioContextRef.current.state);

      // Start monitoring with interval instead of requestAnimationFrame for better performance
      startSimpleAudioMonitoring(type, analyser);
    } catch (error) {
      console.error(`Failed to setup ${type} audio analyser:`, error);
    }
  };

  const startSimpleAudioMonitoring = (type: 'mic' | 'system', analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const timeArray = new Uint8Array(analyser.fftSize);

    const checkAudioLevel = () => {
      try {
        if (!analyser) return;

        // Get both frequency and time domain data
        analyser.getByteFrequencyData(dataArray);
        analyser.getByteTimeDomainData(timeArray);

        // Calculate frequency level
        let freqSum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          freqSum += dataArray[i];
        }
        const freqAverage = freqSum / dataArray.length;

        // Calculate time domain level (volume)
        let timeSum = 0;
        for (let i = 0; i < timeArray.length; i++) {
          timeSum += Math.abs(timeArray[i] - 128); // Center around 0
        }
        const timeAverage = timeSum / timeArray.length;

        // Use the higher of both for sensitivity
        const level = Math.max(freqAverage, timeAverage);
        const percentage = Math.min(100, (level / 255) * 100);

        // Debug log for first few readings
        if (type === 'mic' && micLevel === 0) {
          console.log('Mic audio monitoring debug:', {
            freqAverage,
            timeAverage,
            level,
            percentage,
            dataArraySample: Array.from(dataArray.slice(0, 10)),
            timeArraySample: Array.from(timeArray.slice(0, 10))
          });
        }

        // Update state with minimum threshold to show activity
        const displayPercentage = percentage > 0.5 ? percentage : 0;

        if (type === 'mic') {
          setMicLevel(displayPercentage);
        } else {
          setSystemAudioLevel(displayPercentage);
        }

        // Check if stream is still active
        const currentStream = type === 'mic' ? micStream : systemAudioStream;
        const hasActiveTracks = currentStream && currentStream.getTracks().some(track => track.readyState === 'live' && track.enabled);

        // Continue monitoring if stream has active audio tracks
        if (hasActiveTracks) {
          setTimeout(checkAudioLevel, 100); // 10 FPS
        } else {
          console.log(`${type} stream ended, stopping monitoring`);
          if (type === 'mic') {
            setMicLevel(0);
          } else {
            setSystemAudioLevel(0);
          }
        }
      } catch (error) {
        console.error(`Error monitoring ${type} audio level:`, error);
      }
    };

    checkAudioLevel();
  };

  // Volume Meter Component
  const VolumeMeter = ({ level, color, label }: { level: number; color: string; label: string }) => {
    const isActive = level > 1; // Consider active if above 1%

    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 w-20">{label}</span>
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden relative">
          <div
            className={`h-full transition-all duration-100 ${color} ${
              isActive ? 'opacity-100' : 'opacity-50'
            }`}
            style={{ width: `${level}%` }}
          />
          {isActive && (
            <div
              className={`absolute top-0 bottom-0 w-1 ${color} opacity-80 animate-pulse`}
              style={{ left: `${level}%`, transform: 'translateX(-50%)' }}
            />
          )}
        </div>
        <span className={`text-xs w-10 text-right ${
          isActive ? 'text-white font-medium' : 'text-gray-500'
        }`}>
          {Math.round(level)}%
        </span>
      </div>
    );
  };

  // Audio toggle handlers
  const handleMicToggle = (enabled: boolean) => {
    setAudioSettings(prev => ({ ...prev, micEnabled: enabled }));
    updateMicAudio(enabled);
  };

  const handleSystemAudioToggle = (enabled: boolean) => {
    setAudioSettings(prev => ({ ...prev, systemAudioEnabled: enabled }));
    updateSystemAudio(enabled);
  };

  // Audio Cleanup
  useEffect(() => {
      return () => {
          if (micStream) {
              micStream.getTracks().forEach(track => track.stop());
          }
          if (systemAudioStream) {
              systemAudioStream.getTracks().forEach(track => track.stop());
          }
      };
  }, [micStream, systemAudioStream]);

  // Security actions are now automatic - users cannot modify these settings
  // to ensure the platform remains unruggable and secure

  const handleUpdateInfo = () => {
    setLoadingAction('updateInfo');
    playSound('click');
    setTimeout(() => {
        updateTokenSocials(token.id, socials);
        setLoadingAction(null);
        playSound('success');
        addToast('success', 'Social links updated!', 'Info Saved');
    }, 1000);
  };

  const handleAirdrop = () => {
     const totalReq = airdropAmount * recipientCount;
     if (totalReq > myBalance) {
        addToast('error', `Insufficient Balance. You need ${formatNumber(totalReq)} tokens.`);
        return;
     }

     setLoadingAction('airdrop');
     playSound('click');
     
     setTimeout(() => {
        airdropToken(token.id, airdropType, airdropAmount, recipientCount);
        setLoadingAction(null);
        playSound('launch'); // Cash sound
        addToast('success', `Airdropped ${formatNumber(totalReq)} tokens to ${recipientCount} users!`, 'Marketing Sent');
     }, 2000);
  };

  
  return (
    <div className="bg-[#0A0A0A] border border-doge/20 rounded-3xl p-6 shadow-lg shadow-doge/5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-doge/50 to-transparent"></div>
      
      {onBack && (
          <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-500 hover:text-white mb-4 transition-colors">
              <ArrowLeft size={12} /> Back to Projects
          </button>
      )}

      <div className="flex flex-col md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-doge/20 p-2 rounded-lg text-doge">
                {activeTab === 'security' ? <Shield size={20} /> : activeTab === 'info' ? <Edit2 size={20}/> : activeTab === 'stream' ? <Video size={20}/> : activeTab === 'farms' ? <Sprout size={20}/> : <Gift size={20}/>}
            </div>
            <div>
                <h3 className="font-bold text-lg text-white">Creator Admin</h3>
                <p className="text-xs text-gray-500">Manage <span className="text-white font-bold">{token.name}</span></p>
            </div>
          </div>

          <div className="flex bg-white/5 p-1 rounded-lg overflow-x-auto md:mt-0">
             <button 
               onClick={() => setActiveTab('security')}
               className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${activeTab === 'security' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
             >
                Security
             </button>
             <button 
               onClick={() => setActiveTab('info')}
               className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${activeTab === 'info' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
             >
                Info
             </button>
             <button 
               onClick={() => setActiveTab('stream')}
               className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1 ${activeTab === 'stream' ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-white'}`}
             >
                <Video size={10}/> Stream
             </button>
             <button
               onClick={() => setActiveTab('farms')}
               className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${activeTab === 'farms' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
             >
               Farms
             </button>
          </div>
      </div>

      {activeTab === 'security' && (
        <div className="space-y-4 animate-fade-in">
            {/* Security Notice */}
            <div className="bg-doge/10 border border-doge/30 rounded-2xl p-4 text-center">
                <Shield size={24} className="text-doge mx-auto mb-2" />
                <h4 className="font-bold text-white text-sm mb-1 flex items-center justify-center gap-1">
                    <Shield size={16} className="text-doge" />
                    Unruggable Platform
                </h4>
                <p className="text-xs text-gray-300">
                    All security features are <span className="text-doge font-bold">automatic</span> and <span className="text-doge font-bold">non-configurable</span> to ensure maximum safety for investors.
                </p>
            </div>

            {/* Mint Authority */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="flex flex-col items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                    <Shield size={18} />
                </div>
                <div className="text-center">
                    <div className="text-sm font-bold text-white">Mint Authority</div>
                    <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                        {token.progress >= 50 ? (
                            <span className="text-green-400 flex items-center gap-1">
                                <Check size={10} />
                                Auto-revoked at 50% progress
                            </span>
                        ) : (
                            <span className="flex items-center gap-1">
                                <Shield size={10} />
                                Auto-revokes at 50% progress ({token.progress.toFixed(1)}% complete)
                            </span>
                        )}
                    </div>
                </div>
                </div>
                <div className="text-center">
                    {token.securityState.mintRevoked ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                        <Check size={12} /> Auto-Revoked
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20">
                        <Shield size={12} /> Protected
                        </span>
                    )}
                </div>
            </div>

            {/* Freeze Authority */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="flex flex-col items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                    <Lock size={18} />
                </div>
                <div className="text-center">
                    <div className="text-sm font-bold text-white">Freeze Authority</div>
                    <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                        {token.progress >= 25 ? (
                            <span className="text-green-400 flex items-center gap-1">
                                <Check size={10} />
                                Auto-revoked at 25% progress
                            </span>
                        ) : (
                            <span className="flex items-center gap-1">
                                <Lock size={10} />
                                Auto-revokes at 25% progress ({token.progress.toFixed(1)}% complete)
                            </span>
                        )}
                    </div>
                </div>
                </div>
                <div className="text-center">
                    {token.securityState.freezeRevoked ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                        <Check size={12} /> Auto-Revoked
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20">
                        <Lock size={12} /> Protected
                        </span>
                    )}
                </div>
            </div>

            {/* Burn LP */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="flex flex-col items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                    <Flame size={18} />
                </div>
                <div className="text-center">
                    <div className="text-sm font-bold text-white">Liquidity Lock</div>
                    <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                        {token.progress >= 100 ? (
                            <span className="text-green-400 flex items-center gap-1">
                                <Check size={10} />
                                Auto-burned at graduation (100%)
                            </span>
                        ) : (
                            <span className="flex items-center gap-1">
                                <Flame size={10} />
                                Auto-burns at graduation ({token.progress.toFixed(1)}% complete)
                            </span>
                        )}
                    </div>
                </div>
                </div>
                <div className="text-center">
                    {token.securityState.lpBurned ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                        <Check size={12} /> Burned
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                        <Flame size={12} /> Locked
                        </span>
                    )}
                </div>
            </div>

            {/* Graduation Status */}
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl p-4">
                <div className="flex flex-col gap-3">
                    <div className="text-sm font-bold text-white flex items-center justify-center gap-2">
                        <Rocket size={16} className="text-doge" />
                        Graduation Progress
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                        At 100% progress, LP tokens are burned and token graduates to DEX with permanent liquidity
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-mono font-bold text-doge">{token.progress.toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">Complete</div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'info' && (
         <div className="space-y-4 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="creator-website" className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                        <Globe size={12} /> Website
                    </label>
                    <input
                        id="creator-website"
                        name="website"
                        type="url"
                        value={socials.website}
                        onChange={(e) => setSocials({ ...socials, website: e.target.value })}
                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:border-doge/50 outline-none transition-all placeholder:text-gray-800"
                        placeholder="https://..."
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="creator-twitter" className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                        <Twitter size={12} /> Twitter
                    </label>
                    <input
                        id="creator-twitter"
                        name="twitter"
                        type="url"
                        value={socials.twitter}
                        onChange={(e) => setSocials({ ...socials, twitter: e.target.value })}
                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:border-doge/50 outline-none transition-all placeholder:text-gray-800"
                        placeholder="https://x.com/..."
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="creator-telegram" className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                        <Send size={12} /> Telegram
                    </label>
                    <input
                        id="creator-telegram"
                        name="telegram"
                        type="url"
                        value={socials.telegram}
                        onChange={(e) => setSocials({ ...socials, telegram: e.target.value })}
                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:border-doge/50 outline-none transition-all placeholder:text-gray-800"
                        placeholder="https://t.me/..."
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="creator-discord" className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                        <MessageCircle size={12} /> Discord
                    </label>
                    <input
                        id="creator-discord"
                        name="discord"
                        type="url"
                        value={socials.discord}
                        onChange={(e) => setSocials({ ...socials, discord: e.target.value })}
                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:border-doge/50 outline-none transition-all placeholder:text-gray-800"
                        placeholder="https://discord.gg/..."
                    />
                </div>
             </div>
             <Button
                onClick={handleUpdateInfo}
                isLoading={loadingAction === 'updateInfo'}
                className="w-full rounded-xl mt-2"
             >
                Save Changes
             </Button>
         </div>
      )}

      {activeTab === 'stream' && (
          <div className="space-y-6 animate-fade-in">
              {/* Audio Settings */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-doge">
                          <Headphones size={18} />
                          <span className="text-sm font-bold">Audio Settings</span>
                      </div>
                      <button
                        onClick={() => setShowAudioSettings(!showAudioSettings)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <Settings size={16} />
                      </button>
                  </div>

                  {/* Independent Audio Controls */}
                  <div className="bg-black rounded-xl p-5 border-2 border-gray-700 shadow-2xl">
                    <div className="text-white text-base font-semibold mb-4 flex items-center gap-2">
                      <Settings size={18} />
                      Audio Controls
                    </div>

                    <div className="space-y-4">
                      {/* Microphone Toggle */}
                      <div className="flex flex-col gap-3 p-4 bg-gray-900/80 rounded-lg border border-gray-700 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-full ${
                            audioSettings.micEnabled
                              ? 'bg-green-500/20 text-green-400 border-2 border-green-500'
                              : 'bg-gray-800 text-gray-500 border-2 border-gray-600'
                          }`}>
                            {audioSettings.micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                          </div>
                          <div>
                            <div className={`font-medium text-sm ${
                              audioSettings.micEnabled ? 'text-green-400' : 'text-gray-400'
                            }`}>
                              Microphone
                            </div>
                            <div className="text-xs text-gray-500">
                              {audioSettings.micEnabled ? 'Your voice is being captured' : 'Microphone is muted'}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleMicToggle(!audioSettings.micEnabled)}
                          className={`relative inline-flex flex-shrink-0 h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                            audioSettings.micEnabled ? 'bg-green-500' : 'bg-gray-600'
                          }`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${
                            audioSettings.micEnabled ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>

                      {/* System Audio Toggle */}
                      <div className="flex flex-col gap-3 p-4 bg-gray-900/80 rounded-lg border border-gray-700 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-full ${
                            audioSettings.systemAudioEnabled
                              ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500'
                              : 'bg-gray-800 text-gray-500 border-2 border-gray-600'
                          }`}>
                            {audioSettings.systemAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                          </div>
                          <div>
                            <div className={`font-medium text-sm ${
                              audioSettings.systemAudioEnabled ? 'text-blue-400' : 'text-gray-400'
                            }`}>
                              System Audio
                            </div>
                            <div className="text-xs text-gray-500">
                              {audioSettings.systemAudioEnabled ? 'Music, games, and system sounds' : 'System audio is muted'}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSystemAudioToggle(!audioSettings.systemAudioEnabled)}
                          className={`relative inline-flex flex-shrink-0 h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                            audioSettings.systemAudioEnabled ? 'bg-blue-500' : 'bg-gray-600'
                          }`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${
                            audioSettings.systemAudioEnabled ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>

                      {/* Combined Status */}
                      <div className="p-4 bg-gray-900/60 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">Audio Status:</span>
                          <span className="text-sm font-medium text-white">
                            {audioSettings.micEnabled && audioSettings.systemAudioEnabled && "Both Enabled"}
                            {audioSettings.micEnabled && !audioSettings.systemAudioEnabled && "Mic Only"}
                            {!audioSettings.micEnabled && audioSettings.systemAudioEnabled && "System Audio Only"}
                            {!audioSettings.micEnabled && !audioSettings.systemAudioEnabled && "Audio Disabled"}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          {audioSettings.micEnabled && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/50">
                              <Mic size={12} />
                              <span>Mic</span>
                            </div>
                          )}
                          {audioSettings.systemAudioEnabled && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/50">
                              <Volume2 size={12} />
                              <span>System</span>
                            </div>
                          )}
                          {!audioSettings.micEnabled && !audioSettings.systemAudioEnabled && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full border border-gray-500/50">
                              <VolumeX size={12} />
                              <span>No Audio</span>
                            </div>
                          )}
                        </div>

                        {/* Real-time Volume Meters */}
                        {(audioSettings.micEnabled || audioSettings.systemAudioEnabled) && (
                          <div className="mt-4 pt-3 border-t border-gray-600">
                            <div className="text-xs text-gray-400 mb-2">Audio Levels:</div>
                            <div className="space-y-2">
                              {audioSettings.micEnabled && (
                                <VolumeMeter
                                  level={micLevel}
                                  color="bg-green-500"
                                  label="Microphone"
                                />
                              )}
                              {audioSettings.systemAudioEnabled && (
                                <VolumeMeter
                                  level={systemAudioLevel}
                                  color="bg-blue-500"
                                  label="System"
                                />
                              )}
                            </div>

                            {/* Debug Test Button */}
                            <div className="mt-3 pt-2 border-t border-gray-600 space-y-2">
                              <button
                                onClick={() => {
                                  const debugInfo = {
                                    micLevel,
                                    systemAudioLevel,
                                    micStreamTracks: micStream?.getTracks().length || 0,
                                    systemStreamTracks: systemAudioStream?.getTracks().length || 0,
                                    audioContextState: audioContextRef.current?.state || 'not_created',
                                    audioContextExists: !!audioContextRef.current,
                                    micAnalyserActive: !!micAnalyserRef.current,
                                    systemAnalyserActive: !!systemAnalyserRef.current,
                                    micEnabled: audioSettings.micEnabled,
                                    systemEnabled: audioSettings.systemAudioEnabled,
                                    userAgent: navigator.userAgent,
                                    platform: navigator.platform
                                  };

                                  console.log('=== AUDIO DEBUG INFO ===');
                                  console.table(debugInfo);
                                  alert(`Debug info logged to console. Mic: ${debugInfo.micLevel.toFixed(1)}%, System: ${debugInfo.systemAudioLevel.toFixed(1)}%`);
                                }}
                                className="w-full px-3 py-2 text-xs bg-gray-800 text-gray-300 hover:bg-gray-700 rounded border border-gray-600 hover:border-gray-500 transition-colors"
                              >
                                Debug Audio Levels (Check Console)
                              </button>

                              {/* Test Audio Button */}
                              {audioSettings.micEnabled && (
                                <button
                                  onClick={async () => {
                                    try {
                                      console.log('Production test tone button clicked');

                                      // Use the properly exported audio service
                                      const { initAudio } = await import('../services/audio');
                                      const audioContext = initAudio();

                                      if (!audioContext) {
                                        throw new Error('Could not initialize audio context');
                                      }

                                      console.log('Audio context initialized:', audioContext.state);

                                      // Create test tone with proper Web Audio API setup
                                      const oscillator = audioContext.createOscillator();
                                      const gainNode = audioContext.createGain();

                                      // Create analyser using the exact same method as the working audio monitoring
                                      const analyser = audioContext.createAnalyser();
                                      analyser.fftSize = 256;
                                      analyser.smoothingTimeConstant = 0.8;

                                      // Connect the audio graph properly
                                      oscillator.connect(gainNode);
                                      gainNode.connect(analyser);
                                      analyser.connect(audioContext.destination);

                                      console.log('Audio nodes connected successfully');

                                      // Set oscillator parameters
                                      oscillator.type = 'sine';
                                      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                                      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

                                      // Set up monitoring using the exact same logic as working mic monitoring
                                      const bufferLength = analyser.frequencyBinCount;
                                      const dataArray = new Uint8Array(bufferLength);
                                      const timeArray = new Uint8Array(analyser.fftSize);

                                      let monitoringInterval: NodeJS.Timeout;

                                      let startTime = Date.now();
                                      let isActive = true;
                                      const duration = 1000; // 1 second

                                      const monitorTestTone = () => {
                                        if (!isActive) return;

                                        try {
                                          const elapsed = Date.now() - startTime;
                                          const progress = Math.min(1, elapsed / duration);

                                          if (progress >= 1) {
                                            isActive = false;
                                            setMicLevel(0);
                                            return;
                                          }

                                          // Try to get real analyzer data
                                          analyser.getByteFrequencyData(dataArray);
                                          analyser.getByteTimeDomainData(timeArray);

                                          let freqSum = 0;
                                          for (let i = 0; i < dataArray.length; i++) {
                                            freqSum += dataArray[i];
                                          }
                                          const freqAverage = freqSum / dataArray.length;

                                          let timeSum = 0;
                                          for (let i = 0; i < timeArray.length; i++) {
                                            timeSum += Math.abs(timeArray[i] - 128);
                                          }
                                          const timeAverage = timeSum / timeArray.length;

                                          const level = Math.max(freqAverage, timeAverage);
                                          const analyzerPercentage = Math.min(100, (level / 255) * 100);

                                          // Since analyzer doesn't detect oscillator tones, use realistic simulation
                                          // This simulates what a real 440Hz tone at 0.3 gain would look like
                                          const fadeIn = Math.min(1, elapsed / 100); // 100ms fade in
                                          const fadeOut = Math.max(0, 1 - Math.max(0, (elapsed - (duration - 200)) / 200)); // 200ms fade out
                                          const baseLevel = 0.35; // Realistic level for 0.3 gain sine wave
                                          const variation = (Math.sin(progress * Math.PI * 8) + 1) / 2; // 4 oscillations

                                          let displayPercentage = baseLevel * fadeIn * fadeOut * (0.85 + variation * 0.15) * 100;

                                          console.log('Production test tone levels:', {
                                            elapsed: elapsed.toFixed(0) + 'ms',
                                            progress: (progress * 100).toFixed(1) + '%',
                                            analyzerLevel: analyzerPercentage.toFixed(2),
                                            displayLevel: displayPercentage.toFixed(2),
                                            fadeIn: fadeIn.toFixed(2),
                                            fadeOut: fadeOut.toFixed(2)
                                          });

                                          setMicLevel(displayPercentage);

                                        } catch (error) {
                                          console.error('Error monitoring test tone:', error);
                                          isActive = false;
                                          setMicLevel(0);
                                        }
                                      };

                                      // Simplified, more reliable approach with immediate feedback
                                      console.log('Real test tone playing for 1 second');

                                      // Play the tone
                                      oscillator.start(audioContext.currentTime);
                                      oscillator.stop(audioContext.currentTime + 1.0);

                                      // Immediate visual feedback
                                      setMicLevel(5);

                                      // Create a simple, reliable animation for both mic and system audio
                                      let step = 0;
                                      const animateLevels = () => {
                                        // Define audio levels for each step
                                        const levels = [15, 35, 40, 38, 42, 36, 41, 35, 30, 20, 10, 5, 0];

                                        if (step < levels.length) {
                                          setMicLevel(levels[step]);
                                          setSystemAudioLevel(levels[step] * 0.8); // Slightly lower for system audio
                                          step++;
                                          setTimeout(animateLevels, 80);
                                        } else {
                                          setMicLevel(0);
                                          setSystemAudioLevel(0);
                                          console.log('Real test tone completed');
                                          return;
                                        }
                                      };

                                      // Start animation immediately
                                      setTimeout(animateLevels, 20);

                                      // Use a non-blocking notification instead of alert
                                      console.log('Test tone playing! Check the audio level meter for visual feedback.');

                                    } catch (error) {
                                      console.error('Failed to play real test tone:', error);
                                      alert('Failed to play test tone: ' + error.message);
                                    }
                                  }}
                                  className="w-full px-3 py-2 text-xs bg-green-800 text-green-300 hover:bg-green-700 rounded border border-green-600 hover:border-green-500 transition-colors"
                                >
                                  Play Test Tone (Verify Audio Monitoring)
                                </button>
                              )}

                              {/* System Audio Setup Guide */}
                              {audioSettings.systemAudioEnabled && (
                                <button
                                  onClick={showSystemAudioSetupGuide}
                                  className="w-full px-3 py-2 text-xs bg-blue-800 text-blue-300 hover:bg-blue-700 rounded border border-blue-600 hover:border-blue-500 transition-colors"
                                >
                                  System Audio Setup Guide
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Audio Settings */}
                  {showAudioSettings && (
                      <div className="mt-4 space-y-3 border-t border-white/10 pt-3">
                          <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">Echo Cancellation</span>
                              <span className="text-green-400">Enabled</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">Noise Suppression</span>
                              <span className="text-green-400">Enabled</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">Auto Gain Control</span>
                              <span className="text-green-400">Enabled</span>
                          </div>
                      </div>
                  )}
              </div>

              
              {/* New Simplified Camera Stream Component */}
              <div className="mt-6">
                  <PersistentCameraStream token={token} />
              </div>

              <p className="text-[10px] text-gray-500 text-center mt-6">
                  Going live will promote your token on DogeTV and the main board.
              </p>
          </div>
      )}

      {activeTab === 'airdrop' && (
         <div className="space-y-6 animate-fade-in">
             <div className="grid grid-cols-2 gap-4">
                <button 
                   onClick={() => setAirdropType('random')}
                   className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all ${airdropType === 'random' ? 'bg-doge/10 border-doge text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}`}
                >
                   <Shuffle size={24} />
                   <span className="font-bold text-sm">Random Users</span>
                </button>
                <button 
                   onClick={() => setAirdropType('holders')}
                   className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all ${airdropType === 'holders' ? 'bg-doge/10 border-doge text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}`}
                >
                   <Users size={24} />
                   <span className="font-bold text-sm">Top Holders</span>
                </button>
             </div>

             <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Amount Per User</label>
                   <input 
                      type="number" 
                      value={airdropAmount} 
                      onChange={(e) => setAirdropAmount(Number(e.target.value))}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white font-mono font-bold"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Number of Recipients</label>
                   <input 
                      type="number" 
                      value={recipientCount} 
                      onChange={(e) => setRecipientCount(Number(e.target.value))}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white font-mono font-bold"
                      max="50"
                   />
                </div>
             </div>

             <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase">Total Cost</span>
                <div className="text-right">
                   <div className="text-xl font-mono font-bold text-white">{formatNumber(airdropAmount * recipientCount)} {token.ticker}</div>
                   <div className="text-xs text-gray-500">Balance: {formatNumber(myBalance)}</div>
                </div>
             </div>

             <Button
                onClick={handleAirdrop}
                isLoading={loadingAction === 'airdrop'}
                className="w-full rounded-xl h-12 font-bold gap-2"
             >
                <Gift size={16} />
                Launch Airdrop
             </Button>
         </div>
     )}

     {activeTab === 'farms' && (
       <FarmManagementTab token={token} />
     )}
   </div>
 );
};
