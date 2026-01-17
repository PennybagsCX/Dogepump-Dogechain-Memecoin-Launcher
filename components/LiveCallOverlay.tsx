
import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff, PhoneOff, Video, VideoOff, Camera, Loader2, MessageSquare, Send } from 'lucide-react';
import { Token } from '../types';
import { DogeLiveClient } from '../services/liveService';
import { useToast } from './Toast';
import { useStore } from '../contexts/StoreContext';
import { generateCallRecap } from '../services/aiService';
import { Button } from './Button';
import { playSound } from '../services/audio';

interface LiveCallOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token;
}

export const LiveCallOverlay: React.FC<LiveCallOverlayProps> = ({ isOpen, onClose, token }) => {
  const { addToast } = useToast();
  const { buyToken, sellToken, addComment } = useStore();
  const [view, setView] = useState<'call' | 'summary'>('call');
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  
  const [userVolume, setUserVolume] = useState(0);
  const [aiVolume, setAiVolume] = useState(0);
  const [caption, setCaption] = useState('');
  
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  const clientRef = useRef<DogeLiveClient | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const captionTimeoutRef = useRef<any>(null);
  
  // Check API Key Availability
  const checkKey = async () => {
     const aistudio = (window as any).aistudio;
     if (aistudio && await aistudio.hasSelectedApiKey()) {
        return true;
     }
     return false;
  };

  useEffect(() => {
    if (isOpen) {
      setView('call');
      startCall();
    } else {
      endCall(false); // Force close without summary if unmounting/closing externally
    }
    return () => endCall(false);
  }, [isOpen]);

  // Toggle Video Stream
  const toggleVideo = async () => {
    if (isVideoEnabled) {
      // Turn OFF
      setIsVideoEnabled(false);
      clientRef.current?.stopVideo();
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
        videoStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } else {
      // Turn ON
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
        videoStreamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          
          // Wait a bit for video to start before sending frames
          setTimeout(() => {
             if (videoRef.current && clientRef.current) {
                clientRef.current.startVideo(videoRef.current);
             }
          }, 1000);
        }
        setIsVideoEnabled(true);
      } catch (e) {
        addToast('error', 'Could not access camera', 'Permission Denied');
        console.error(e);
      }
    }
  };

  const startCall = async () => {
    setStatus('connecting');
    setCaption('');
    setSummary(null);
    
    const hasKey = await checkKey();
    if (!hasKey) {
       addToast('error', 'API Key Required', 'Please connect your API key in settings or the media tab first.');
       setStatus('error');
       return;
    }

    clientRef.current = new DogeLiveClient(import.meta.env.VITE_GEMINI_API_KEY || '');

    await clientRef.current.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      systemInstruction: `You are the AI Persona of the cryptocurrency token "${token.name}" ($${token.ticker}). 
      Your personality description: ${token.aiPersona || 'A chaotic but friendly crypto enthusiast'}. 
      Current Price: $${token.price}. 
      Speak succinctly, use some crypto slang, be funny. 
      You are in a real-time video call. You can see the user if they turn their camera on.
      If the user shows you something, react to it visually in your speech.
      You are talking to a potential investor. Convince them (or roast them).`,
      voiceName: 'Kore' // Energetic voice
    }, {
      onOpen: () => setStatus('connected'),
      onClose: () => { setStatus('ended'); },
      onError: (err) => { console.error(err); setStatus('error'); addToast('error', 'Connection Lost'); },
      onAudioData: () => {},
      onVolumeUpdate: (vol) => setUserVolume(vol),
      onAiVolumeUpdate: (vol) => setAiVolume(vol),
      onCaption: (text) => {
         setCaption(prev => {
            // Keep last 100 chars or clear if it was empty
            const newVal = prev.length > 100 ? text : prev + text;
            return newVal;
         });
         
         if (captionTimeoutRef.current) clearTimeout(captionTimeoutRef.current);
         captionTimeoutRef.current = setTimeout(() => setCaption(''), 3000); // Clear after 3s silence
      },
      onToolCall: async (name, args) => {
         addToast('info', 'AI Executing Order...', `${name.toUpperCase()}`);
         if (name === 'tradeToken') {
            if (args.action === 'buy') buyToken(token.id, Number(args.amount) || 100);
            if (args.action === 'sell') sellToken(token.id, Number(args.amount) || 100);
            return "Order Executed Successfully";
         }
         return "Unknown Tool";
      }
    });
  };

  const endCall = (showSummary = true) => {
    const transcript = clientRef.current?.getTranscript();
    clientRef.current?.disconnect();
    clientRef.current = null;
    
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
      videoStreamRef.current = null;
    }
    setUserVolume(0);
    setAiVolume(0);
    setIsVideoEnabled(false);
    setCaption('');

    if (showSummary && transcript && transcript.length > 0) {
       setView('summary');
       generateSummary(transcript);
    } else if (!isOpen) {
       // If already closed or forced close
    } else {
       onClose();
    }
  };

  const generateSummary = async (transcript: any[]) => {
     setIsGeneratingSummary(true);
     try {
        const recap = await generateCallRecap(transcript, token.name, token.aiPersona);
        setSummary(recap);
     } catch (e) {
        setSummary("Call ended.");
     } finally {
        setIsGeneratingSummary(false);
     }
  };

  const handlePostRecap = () => {
     if (summary) {
        // Post the comment as the AI
        addComment(token.id, `🤖 [Call Recap]: ${summary}`);
        playSound('success');
        addToast('success', 'Call recap posted to thread!', 'Social Proof');
        onClose();
     }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in overflow-hidden">
       
       {/* Background Video / Pulse */}
       <div className="absolute inset-0 pointer-events-none">
          {/* Video Layer */}
          <video 
            ref={videoRef} 
            muted 
            playsInline 
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isVideoEnabled ? 'opacity-100' : 'opacity-0'}`}
            style={{ transform: 'scaleX(-1)' }} // Mirror effect
          />
          
          {/* Video Overlay Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50 transition-opacity duration-700 ${isVideoEnabled ? 'opacity-100' : 'opacity-0'}`}></div>

          {/* Fallback Ambient Pulse (Driven by AI Voice) */}
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${isVideoEnabled ? 'opacity-0' : 'opacity-100'}`}>
             <div className={`w-[600px] h-[600px] bg-doge/5 rounded-full blur-[150px] transition-transform duration-75 ${status === 'connected' ? 'scale-100' : 'scale-50'}`} 
                  style={{ transform: `scale(${1 + aiVolume * 5})` }}></div>
          </div>
       </div>

       {/* Main Content Container */}
       <div className="relative z-20 flex flex-col items-center justify-between h-full w-full max-w-md py-12 px-6">
          
          {/* Header */}
          <div className="text-center space-y-3">
             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-300 backdrop-blur-md shadow-lg">
                {view === 'call' && (
                   <>
                     {status === 'connecting' && <span className="flex gap-1"><span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span></span>}
                     {status === 'connected' && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#00E054]"></span>}
                     {status === 'error' && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                     <span className="font-bold tracking-widest">{status.toUpperCase()}</span>
                   </>
                )}
                {view === 'summary' && <span className="font-bold tracking-widest text-doge">CALL ENDED</span>}
             </div>
             <div className="flex flex-col items-center gap-1">
               <h2 className="text-4xl font-bold text-white drop-shadow-lg tracking-tight font-comic">{token.name}</h2>
               <p className="text-doge font-mono text-sm drop-shadow-md bg-black/30 px-2 rounded">${token.ticker}</p>
             </div>
          </div>

          {view === 'call' ? (
             <>
               {/* Avatar Visualizer (Driven by AI Volume) */}
               <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                  <div className={`relative transition-all duration-500 ${isVideoEnabled ? 'scale-75 translate-y-8' : 'scale-100'}`}>
                     {/* AI Speaking Rings */}
                     {status === 'connected' && aiVolume > 0.05 && (
                        <>
                           <div className="absolute inset-0 border border-doge/40 rounded-full animate-ping" style={{ animationDuration: '1s' }}></div>
                           <div className="absolute inset-0 border border-doge/20 rounded-full animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }}></div>
                        </>
                     )}
                     
                     {/* Avatar Container */}
                     <div 
                        className="w-48 h-48 rounded-full p-1.5 border-4 border-white/10 bg-black/50 backdrop-blur-md relative overflow-hidden shadow-[0_0_60px_-10px_rgba(0,0,0,0.5)] transition-transform duration-75"
                        style={{ transform: `scale(${1 + aiVolume * 0.3})` }}
                     >
                        <img src={token.imageUrl} alt="Token" className="w-full h-full rounded-full object-cover opacity-90" />
                        {/* Voice Reactivity Overlay */}
                        <div className="absolute inset-0 bg-doge/50 mix-blend-overlay transition-opacity duration-75" style={{ opacity: aiVolume * 3 }}></div>
                     </div>
                  </div>

                  {/* Live Captions */}
                  {caption && (
                     <div className="absolute bottom-12 left-0 right-0 text-center px-4 pointer-events-none">
                        <div className="inline-block bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                           <p className="text-lg font-bold text-white drop-shadow-md leading-snug animate-slide-up">
                              {caption}
                           </p>
                        </div>
                     </div>
                  )}
               </div>

               {/* Controls Bar */}
               <div className="flex items-center gap-6 bg-black/60 p-5 rounded-[2rem] border border-white/10 backdrop-blur-xl shadow-2xl relative">
                  {/* User Mic Visualizer (Ring around Mic Button) */}
                  <div className="relative">
                     {userVolume > 0.05 && !isMuted && (
                        <div 
                           className="absolute inset-0 rounded-full border-2 border-green-500 opacity-50 transition-transform duration-75" 
                           style={{ transform: `scale(${1 + userVolume * 2})` }}
                        ></div>
                     )}
                     <button 
                        onClick={() => setIsMuted(!isMuted)}
                        className={`relative z-10 p-4 rounded-full transition-all ${isMuted ? 'bg-white text-black scale-95' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        title={isMuted ? "Unmute" : "Mute"}
                     >
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                     </button>
                  </div>

                  <button 
                     onClick={toggleVideo}
                     className={`p-4 rounded-full transition-all ${isVideoEnabled ? 'bg-white text-black scale-95' : 'bg-white/10 text-white hover:bg-white/20'}`}
                     title={isVideoEnabled ? "Stop Video" : "Start Video"}
                  >
                     {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                  </button>
                  
                  <button 
                     onClick={() => endCall(true)}
                     className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 hover:scale-105 transition-all shadow-lg shadow-red-600/30"
                     title="End Call"
                  >
                     <PhoneOff size={24} />
                  </button>
               </div>
             </>
          ) : (
             <div className="w-full max-w-sm bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 shadow-2xl animate-slide-up mt-8">
                <h3 className="text-xl font-bold text-white mb-4 text-center">Call Notes</h3>
                
                {isGeneratingSummary ? (
                   <div className="flex flex-col items-center py-8">
                      <Loader2 size={32} className="text-doge animate-spin mb-2" />
                      <p className="text-gray-500 text-sm">Generating call recap...</p>
                   </div>
                ) : (
                   <div className="space-y-6">
                      <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5 relative">
                         <div className="absolute -top-3 left-4 bg-doge text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            AI Summary
                         </div>
                         <p className="text-gray-300 text-sm leading-relaxed italic">
                            "{summary}"
                         </p>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                         <Button onClick={handlePostRecap} className="w-full rounded-xl gap-2">
                            <MessageSquare size={16} /> Post to Thread
                         </Button>
                         <button onClick={onClose} className="text-gray-500 text-sm hover:text-white transition-colors">
                            Close without posting
                         </button>
                      </div>
                   </div>
                )}
             </div>
          )}

       </div>
    </div>
  );
};
