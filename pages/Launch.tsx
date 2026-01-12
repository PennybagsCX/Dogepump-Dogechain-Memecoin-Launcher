
import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { Upload, X, Zap, Rocket, Loader2, Eye, Globe, Send, Wallet, ShieldCheck, MessageCircle, ArrowRight } from 'lucide-react';
import { XIcon } from '../components/XIcon';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { UploadProgress } from '../components/UploadProgress';
import { playSound } from '../services/audio';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { backendService } from '../services/backendService';
import { Token } from '../types';
import { formatNumber } from '../services/web3Service';
import { LAUNCH_FEE, MAX_CREATOR_BUY_PERCENTAGE, TOTAL_SUPPLY, INITIAL_TOKEN_PRICE } from '../constants';
import { Breadcrumb } from '../components/Breadcrumb';

// Lazy load components for better performance
// TokenCard has a named export, so we need to handle it specially
const LazyTokenCard = lazy(() =>
  import('../components/TokenCard').then(module => ({
    default: module.TokenCard
  }))
);
const LazyConfetti = lazy(() => import('../components/Confetti'));

const Launch: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { launchToken, userBalanceDC, userAddress } = useStore();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [launched, setLaunched] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Launch progress states
  const [launchProgress, setLaunchProgress] = useState(0);
  const [launchStep, setLaunchStep] = useState<string>('');

  const [initialBuy, setInitialBuy] = useState<string>('');
  const [initialBuyError, setInitialBuyError] = useState<string>('');
  const maxCreatorBuyDC = TOTAL_SUPPLY * MAX_CREATOR_BUY_PERCENTAGE * INITIAL_TOKEN_PRICE; // Max DC for 5% of supply

  const [formData, setFormData] = useState({
    name: '',
    ticker: '',
    description: '',
    persona: '',
    website: '',
    twitter: '',
    telegram: '',
    discord: '',
    file: null as File | null
  });

  // Memory cleanup: Revoke blob URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    // Client-side file size validation (4MB limit)
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB in bytes

    if (file.size > MAX_FILE_SIZE) {
      addToast('error', 'File too large', 'Maximum size is 4MB');
      setUploadError('File size exceeds 4MB limit');
      setUploadStatus('error');
      return;
    }

    // Client-side file type validation
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      addToast('error', 'Invalid file type', 'Allowed: JPG, PNG, GIF, WebP');
      setUploadError('Invalid file type');
      setUploadStatus('error');
      return;
    }

    playSound('success');
    setFormData({ ...formData, file });

    // Create preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to backend (no authentication required for decentralized platform)
    try {
      setUploading(true);
      setUploadStatus('uploading');
      setUploadProgress(0);
      setUploadError(null);

      const response = await backendService.uploadImage(file, (progress) => {
        setUploadProgress(progress);
      });

      if (response.success && response.image) {
        setImageUrl(response.image.url);
        setUploadStatus('success');
        addToast('success', 'Image uploaded successfully');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      setUploadError(errorMessage);
      setUploadStatus('error');
      addToast('error', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleInitialBuyChange = (value: string) => {
    setInitialBuy(value);
    setInitialBuyError('');

    if (value && Number(value) > 0) {
      const amount = Number(value);
      const estimatedTokens = amount / INITIAL_TOKEN_PRICE;
      const maxTokensAllowed = TOTAL_SUPPLY * MAX_CREATOR_BUY_PERCENTAGE;

      if (estimatedTokens > maxTokensAllowed) {
        setInitialBuyError(`Cannot exceed ${MAX_CREATOR_BUY_PERCENTAGE * 100}% of total supply (${formatNumber(maxCreatorBuyDC)} DC maximum)`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate initial buy against 3% limit
    if (initialBuyError) {
      addToast('error', initialBuyError);
      return;
    }

    // Check if image is still uploading
    if (uploading) {
      addToast('error', 'Please wait for image upload to complete');
      return;
    }

    // Check if upload failed
    if (uploadStatus === 'error') {
      addToast('error', 'Please fix image upload error before launching');
      return;
    }

    const buyAmount = Number(initialBuy);
    const totalCost = buyAmount + LAUNCH_FEE; // +LAUNCH_FEE DC Launch Fee

    // Server-side balance verification
    setLoading(true);
    setLaunchProgress(5);
    setLaunchStep('Verifying balance on-chain...');

    try {
      // Check if user has a wallet address
      if (!userAddress) {
        addToast('error', 'Please connect your wallet first');
        setLoading(false);
        setLaunchProgress(0);
        setLaunchStep('');
        return;
      }

      // Convert DC to wei (18 decimals)
      const totalCostWei = BigInt(Math.floor(totalCost * 1e18));

      // Call server-side balance verification
      const balanceCheck = await backendService.verifySufficientBalance(
        userAddress,
        totalCostWei
      );

      if (!balanceCheck.sufficient) {
        addToast('error',
          `Insufficient balance. You have ${balanceCheck.dcBalanceFormatted} DC but need ${balanceCheck.requiredDCFormatted} DC (${formatNumber(LAUNCH_FEE)} Fee ${buyAmount > 0 ? `+ ${formatNumber(buyAmount)} DC initial buy` : ''})`,
          'Please add more DC to your wallet'
        );
        setLoading(false);
        setLaunchProgress(0);
        setLaunchStep('');
        return;
      }

      // Balance verified - proceed with launch
      setLaunchProgress(10);
      setLaunchStep('Balance verified! Preparing launch...');

    } catch (error) {
      setLoading(false);
      setLaunchProgress(0);
      setLaunchStep('');
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify balance';
      addToast('error', errorMessage, 'Please try again');
      console.error('Balance verification error:', error);
      return;
    }

    setLaunchProgress(15);
    setLaunchStep('Initializing launch...');
    playSound('click');

    // Use uploaded image URL or fallback to default
    const finalImage = imageUrl || imagePreview || 'https://picsum.photos/200';

    // Step 1: Validating token data
    setLaunchProgress(20);
    setLaunchStep('Validating token data...');
    await new Promise(resolve => setTimeout(resolve, 300));

    // Step 2: Preparing deployment
    setLaunchProgress(30);
    setLaunchStep('Preparing deployment to Dogechain...');
    await new Promise(resolve => setTimeout(resolve, 400));

    // Step 3: Deploying token contract
    setLaunchProgress(55);
    setLaunchStep('Deploying token contract...');
    await new Promise(resolve => setTimeout(resolve, 600));

    // Step 4: Processing initial buy (if any)
    if (buyAmount > 0) {
      setLaunchProgress(75);
      setLaunchStep(`Processing initial buy of ${formatNumber(buyAmount)} DC...`);
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    // Step 5: Finalizing launch
    setLaunchProgress(92);
    setLaunchStep('Finalizing token launch...');

    // Execute launch with error handling
    setTimeout(() => {
      try {
        setLaunchProgress(97);
        setLaunchStep('Confirming transaction...');

        // Execute launch in store with error handling
        const newTokenId = launchToken(
          formData.name,
          formData.ticker,
          formData.description,
          finalImage,
          formData.persona,
          {
            twitter: formData.twitter || undefined,
            telegram: formData.telegram || undefined,
            website: formData.website || undefined,
            discord: formData.discord || undefined
          },
          buyAmount > 0 ? buyAmount : undefined
        );

        // Validate that we got a valid token ID
        if (!newTokenId || newTokenId === '') {
          throw new Error('Token launch failed - no ID returned');
        }

        setLaunchProgress(100);
        setLaunchStep('Launch complete!');

        setLoading(false);
        setLaunched(true);
        playSound('launch');
        addToast('success', `${formData.name} Launched Successfully!`, 'To The Moon!');

        // Reset progress after delay
        setTimeout(() => {
          setLaunchProgress(0);
          setLaunchStep('');
        }, 3000);

        // Delay navigation to let confetti play
        setTimeout(() => {
          navigate(`/token/${newTokenId}`);
        }, 3000);
      } catch (error) {
        // Handle launch errors gracefully
        setLoading(false);
        setLaunched(false);
        setLaunchProgress(0);
        setLaunchStep('');
        const errorMessage = error instanceof Error ? error.message : 'Failed to launch token';
        addToast('error', errorMessage, 'Please try again or contact support');
        console.error('Token launch error:', error);
      }
    }, 500);
  };

  // Calculate estimated tokens for initial buy - memoized for performance
  const estimatedTokens = useMemo(() => {
    if (!initialBuy || Number(initialBuy) <= 0) return '0';
    return (Number(initialBuy) / INITIAL_TOKEN_PRICE).toFixed(0);
  }, [initialBuy]);

  // Construct Preview Token - memoized to prevent unnecessary re-renders
  const previewToken: Token = useMemo(() => ({
     id: 'preview',
     name: formData.name || 'Token Name',
     ticker: formData.ticker || 'TICKER',
     description: formData.description || 'Token description will appear here.',
     imageUrl: imagePreview || 'https://picsum.photos/200',
     creator: 'You',
     marketCap: 500 + (Number(initialBuy) || 0),
     virtualLiquidity: 1000 + (Number(initialBuy) || 0),
     volume: 0,
     price: INITIAL_TOKEN_PRICE,
     progress: 1,
     createdAt: Date.now(),
     supply: TOTAL_SUPPLY,
     boosts: 0,
     securityState: {
       mintRevoked: false,
       freezeRevoked: false,
       lpBurned: false
     },
     sentiment: {
       bullish: 0,
       bearish: 0
     }
  }), [formData.name, formData.ticker, formData.description, imagePreview, initialBuy]);

  if (launched) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl">
        <Suspense fallback={null}>
          <LazyConfetti />
        </Suspense>
        <div className="text-center animate-fade-in space-y-6 relative z-10">
          <div className="w-32 h-32 bg-doge rounded-full mx-auto flex items-center justify-center shadow-[0_0_60px_#D4AF37] animate-bounce-subtle">
             <Rocket size={64} className="text-black" />
          </div>
          <h1 className="text-6xl font-comic font-bold text-white">Launched!</h1>
          <p className="text-2xl text-gray-300">Redirecting to trading terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Launch a Memecoin | DogePump Dogechain Launchpad</title>
        <meta name="description" content="Launch your own memecoin on Dogechain with DogePump. Fair launch, no presale, instant deployment to bonding curve. Create your token in minutes." />
        <link rel="canonical" href="https://dogepump.com/launch" />
        <meta property="og:title" content="Launch a Memecoin | DogePump Dogechain Launchpad" />
        <meta property="og:description" content="Launch your own memecoin on Dogechain with DogePump. Fair launch, no presale, instant deployment to bonding curve. Create your token in minutes." />
        <meta property="og:url" content="https://dogepump.com/launch" />
        <meta name="twitter:title" content="Launch a Memecoin | DogePump Dogechain Launchpad" />
        <meta name="twitter:description" content="Launch your own memecoin on Dogechain with DogePump. Fair launch, no presale, instant deployment to bonding curve. Create your token in minutes." />
      </Helmet>
    <div className="animate-slide-up pb-12">
      <Breadcrumb items={[
        { name: 'Home', url: '/' },
        { name: 'Launch', url: '/launch' }
      ]} />
      <div className="text-center relative py-8">
        {/* Glow behind header */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-doge/10 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#0A0A0A] border border-doge/20 rounded-3xl mb-6 shadow-[0_0_40px_rgba(212,175,55,0.2)] relative z-10 animate-float">
            <Rocket className="text-doge drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" size={40} />
        </div>
        <h1 className="text-5xl md:text-6xl font-comic font-bold text-white mb-4 tracking-tight drop-shadow-xl relative z-10">Launch a Coin</h1>
        <p className="text-gray-400 text-xl max-w-lg mx-auto leading-relaxed">
          Deploy instantly to Dogechain bonding curve. <span className="text-doge">Fair launch</span>, no presale, locked liquidity.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
         
         {/* Form Section */}
         <div className="lg:col-span-8 bg-[#0A0A0A] p-8 md:p-12 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden group backdrop-blur-xl order-2 lg:order-1">
            {/* Decor */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-doge/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-doge/10 transition-colors duration-1000"></div>

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              
              {/* Image Upload */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="launch-image" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Token Image</label>
                </div>
                
                {/* Upload Progress */}
                {uploading && (
                  <UploadProgress
                    progress={uploadProgress}
                    fileName={formData.file?.name || 'image.jpg'}
                    fileSize={formData.file?.size}
                    status={uploadStatus}
                    error={uploadError || undefined}
                  />
                )}
                
                <div 
                  className={`relative group w-full h-64 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer duration-500 overflow-hidden ${isDragOver ? 'border-doge bg-doge/5 scale-[1.02] shadow-[0_0_30px_rgba(212,175,55,0.1)]' : 'border-white/10 bg-[#050505] hover:border-doge/30 hover:bg-white/5'}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                >
                  {imagePreview ? (
                      <div className="relative w-48 h-48 group-hover:scale-105 transition-transform duration-500">
                        <div className="absolute inset-0 bg-doge/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-2xl shadow-2xl relative z-10" />
                        
                        {/* Upload status indicator - only show when actually uploading or completed */}
                        {(uploadStatus === 'uploading' || uploadStatus === 'success') && (
                          <div className="absolute -top-3 -left-3 bg-green-500 text-white p-2 rounded-full shadow-lg z-30">
                            {uploadStatus === 'uploading' ? <Loader2 size={16} className="animate-spin" /> : <div className="w-4 h-4 text-green-600" />}
                          </div>
                        )}
                        
                        {/* Remove button - only show when not uploading */}
                        {!uploading && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setImagePreview(null);
                              setImageUrl(null);
                              setFormData({...formData, file: null});
                              setUploadStatus('idle');
                              setUploadError(null);
                              playSound('click');
                            }}
                            className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors z-30 hover:scale-110"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                  ) : (
                      <>
                        <div className={`mb-6 p-5 rounded-full bg-white/5 transition-colors duration-300 ${isDragOver ? 'text-doge bg-doge/10 scale-110' : 'text-gray-500 group-hover:text-white group-hover:scale-110'}`}>
                          <Upload size={40} />
                        </div>
                        <p className="text-lg text-gray-300 font-medium">Click or drag image here</p>
                        <p className="text-sm text-gray-600 mt-2">JPG, PNG, GIF (Max 4MB)</p>
                      </>
                  )}
                  <input
                      id="launch-image"
                      name="launch-image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploading || loading}
                    />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3 group/input">
                  <label htmlFor="launch-name" className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 group-focus-within/input:text-doge transition-colors">Name</label>
                  <input
                    id="launch-name"
                    name="launch-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#050505] border border-white/10 rounded-2xl px-6 py-5 text-white text-lg focus:border-doge focus:ring-1 focus:ring-doge/50 outline-none transition-all placeholder:text-gray-800 shadow-inner focus:shadow-[0_0_30px_rgba(212,175,55,0.1)]"
                    placeholder="e.g. Doge CEO"
                    required
                  />
                </div>
                <div className="space-y-3 group/input">
                  <label htmlFor="launch-ticker" className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 group-focus-within/input:text-doge transition-colors">Ticker</label>
                  <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-lg">$</span>
                      <input
                      id="launch-ticker"
                      name="launch-ticker"
                      type="text"
                      value={formData.ticker}
                      onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                      className="w-full bg-[#050505] border border-white/10 rounded-2xl pl-10 pr-6 py-5 text-white text-lg focus:border-doge focus:ring-1 focus:ring-doge/50 outline-none transition-all uppercase placeholder:normal-case font-mono placeholder:font-sans placeholder:text-gray-800 shadow-inner focus:shadow-[0_0_30px_rgba(212,175,55,0.1)]"
                      placeholder="CEO"
                      maxLength={8}
                      required
                      />
                  </div>
                </div>
              </div>

              <div className="space-y-3 group/input">
                <label htmlFor="launch-description" className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 group-focus-within/input:text-doge transition-colors">Description</label>
                <textarea
                  id="launch-description"
                  name="launch-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#050505] border border-white/10 rounded-2xl px-6 py-5 text-white text-base focus:border-doge focus:ring-1 focus:ring-doge/50 outline-none transition-all h-40 resize-none placeholder:text-gray-800 shadow-inner focus:shadow-[0_0_30px_rgba(212,175,55,0.1)] leading-relaxed"
                  placeholder="Tell the world why this coin is going to the moon..."
                  required
                />
              </div>

              {/* Initial Buy Section */}
              <div className="space-y-3 group/input bg-green-900/10 p-4 rounded-2xl border border-green-500/20">
                 <div className="flex justify-between items-center">
                    <label htmlFor="launch-initial-buy" className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 group-focus-within/input:text-green-400 transition-colors flex items-center gap-2">
                          <Rocket size={14} className="text-green-500" /> Initial Buy (Optional)
                      </label>
                      <div className="text-[10px] text-green-400/80 flex items-center gap-1 font-bold">
                          <ShieldCheck size={10} /> Beat the snipers
                      </div>
                 </div>
                 <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-lg font-mono">DC</span>
                    <input
                      id="launch-initial-buy"
                      name="launch-initial-buy"
                      type="number"
                      value={initialBuy}
                      onChange={(e) => handleInitialBuyChange(e.target.value)}
                      className={`w-full bg-[#050505] border rounded-2xl pl-14 pr-6 py-5 text-white text-lg focus:ring-1 outline-none transition-all placeholder:text-gray-800 shadow-inner font-mono ${
                        initialBuyError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-white/10 focus:border-green-500 focus:ring-green-500/50'
                      }`}
                      placeholder="0.00"
                      min="0"
                      max={maxCreatorBuyDC}
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-gray-500 flex items-center gap-1">
                       Balance: <span className="text-white font-mono">{formatNumber(userBalanceDC)} DC</span>
                    </div>
                 </div>
                 <div className="text-xs text-gray-500 leading-relaxed px-1">
                    <strong className="text-white">Note:</strong> Fair launch means you don't get free tokens. Buying in the same block as deployment ensures you get the best price before snipers. <strong className="text-green-400">Maximum initial buy: {formatNumber(maxCreatorBuyDC)} DC ({MAX_CREATOR_BUY_PERCENTAGE * 100}% of supply).</strong>
                 </div>
                 {initialBuyError && (
                   <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/5 border border-red-500/20 px-4 py-2 rounded-xl animate-fade-in">
                      <ShieldCheck size={12} />
                      {initialBuyError}
                   </div>
                 )}
                 {initialBuy && Number(initialBuy) > 0 && !initialBuyError && (
                    <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/5 border border-green-500/20 px-4 py-2 rounded-xl animate-fade-in">
                       <Wallet size={12} />
                       You will receive ~<span className="font-bold font-mono">{formatNumber(Number(estimatedTokens))}</span> tokens (~{((Number(estimatedTokens) / 1000000000) * 100).toFixed(2)}% of supply)
                    </div>
                 )}
              </div>

              {/* Social Links */}
              <div className="mt-6 space-y-6 bg-white/[0.02] p-6 rounded-3xl border border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 group/input">
                           <label htmlFor="launch-website" className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 group-focus-within/input:text-white transition-colors">
                              <Globe size={12} /> Website
                           </label>
                           <input
                              id="launch-website"
                              name="launch-website"
                              type="url"
                              value={formData.website}
                              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                              className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:border-doge/50 outline-none transition-all placeholder:text-gray-800"
                              placeholder="https://..."
                           />
                        </div>
                        <div className="space-y-2 group/input">
                           <label htmlFor="launch-twitter" className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 group-focus-within/input:text-blue-400 transition-colors">
                              <XIcon size={12} /> X
                           </label>
                           <input
                              id="launch-twitter"
                              name="launch-twitter"
                              type="url"
                              value={formData.twitter}
                              onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                              className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:border-doge/50 outline-none transition-all placeholder:text-gray-800"
                              placeholder="https://x.com/..."
                           />
                        </div>
                        <div className="space-y-2 group/input">
                           <label htmlFor="launch-telegram" className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 group-focus-within/input:text-blue-500 transition-colors">
                              <Send size={12} /> Telegram
                           </label>
                           <input
                              id="launch-telegram"
                              name="launch-telegram"
                              type="url"
                              value={formData.telegram}
                              onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                              className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:border-doge/50 outline-none transition-all placeholder:text-gray-800"
                              placeholder="https://t.me/..."
                           />
                        </div>
                        <div className="space-y-2 group/input">
                           <label htmlFor="launch-discord" className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 group-focus-within/input:text-indigo-400 transition-colors">
                              <MessageCircle size={12} /> Discord
                           </label>
                           <input
                              id="launch-discord"
                              name="launch-discord"
                              type="url"
                              value={formData.discord}
                              onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                              className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:border-doge/50 outline-none transition-all placeholder:text-gray-800"
                              placeholder="https://discord.gg/..."
                           />
                        </div>
                   </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0B0B0F] via-[#0B0B0F]/90 to-black shadow-2xl">
               <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-doge/10 blur-3xl"></div>
               <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-doge/10 to-transparent"></div>
               <div className="relative px-5 py-6 sm:px-6 sm:py-7 md:px-8 md:py-9 flex flex-col gap-5">
                 <div className="flex items-center gap-4 sm:gap-5">
                   <div className="shrink-0 p-4 rounded-2xl bg-[#0F0F12] border border-doge/30 text-doge shadow-lg">
                     <Zap size={28} className="fill-doge/30" />
                   </div>
                   <div className="flex-1 min-w-0 space-y-1">
                     <div className="flex items-start justify-between gap-2">
                       <div>
                         <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-doge/80 font-semibold">Launch fee</p>
                         <p className="text-lg sm:text-xl font-black text-white leading-tight">Deployment Cost</p>
                       </div>
                       <span className="text-[10px] sm:text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300 font-semibold uppercase tracking-widest">Fee</span>
                     </div>
                     <p className="text-2xl sm:text-3xl font-black text-white leading-tight">
                       {formatNumber(LAUNCH_FEE)} <span className="text-doge">$DC</span>
                     </p>
                   </div>
                 </div>

                 <div className="space-y-3 text-sm sm:text-base leading-relaxed text-gray-200">
                   <p className="text-gray-300">
                     Upon launch, your token is instantly tradeable on the bonding curve. Once market cap hits <span className="text-white font-semibold">$6.9k</span>, liquidity migrates to <span className="text-doge font-semibold">DogePump DEX</span> and burns.
                   </p>
                   <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10">
                     <div className="flex items-center gap-2 text-doge font-semibold uppercase tracking-widest text-[11px] sm:text-xs">
                       <Rocket size={14} /> Rug pulls are mathematically impossible.
                     </div>
                     <span className="text-[11px] sm:text-xs text-gray-400 sm:ml-auto">Graduated liquidity + auditable bonding curve</span>
                   </div>
                   <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] sm:text-sm text-gray-300">
                     <li className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                       <span className="mt-1 h-1.5 w-1.5 rounded-full bg-doge"></span>
                       <span>Flat, transparent launch fee</span>
                     </li>
                     <li className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                       <span className="mt-1 h-1.5 w-1.5 rounded-full bg-doge"></span>
                       <span>Instant trading with protected bonding curve</span>
                     </li>
                     <li className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                       <span className="mt-1 h-1.5 w-1.5 rounded-full bg-doge"></span>
                       <span>Automatic graduation at $6.9k market cap</span>
                     </li>
                     <li className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                       <span className="mt-1 h-1.5 w-1.5 rounded-full bg-doge"></span>
                       <span>Liquidity migrated and burned for permanence</span>
                     </li>
                   </ul>
                 </div>
               </div>
             </div>

              {/* Launch Progress Indicator */}
              {loading && launchProgress > 0 && (
                <div className="bg-doge/10 border border-doge/30 rounded-2xl p-4 mb-4 animate-pulse">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-doge font-bold text-sm flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      {launchStep || 'Processing...'}
                    </span>
                    <span className="text-doge/80 font-mono text-xs">{launchProgress}%</span>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-doge to-doge-light transition-all duration-500 ease-out"
                      style={{ width: `${launchProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button
                  type="submit"
                  className="w-full h-20 text-xl font-bold rounded-full bg-gradient-to-r from-doge to-doge-dark shadow-[0_0_30px_rgba(212,175,55,0.3)] border border-white/20 relative overflow-hidden group-hover/btn:scale-105 transition-transform duration-300"
                  isLoading={loading || uploading}
                  disabled={!formData.name || !formData.ticker || !formData.description || uploading || uploadStatus === 'error' || !!initialBuyError}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 rotate-12"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {uploading ? 'Uploading...' : loading && launchStep ? launchStep : loading ? 'Launching...' : 'Launch Coin'} <ArrowRight size={20} />
                </span>
              </Button>
            </form>
         </div>

         {/* Live Preview Column */}
         <div className="lg:col-span-4 sticky top-24 order-1 lg:order-2 space-y-4">
             <div className="flex items-center gap-2 text-gray-500 font-bold uppercase text-xs tracking-widest px-2">
                <Eye size={14} /> Live Preview
             </div>
             <div className="opacity-90">
                <Suspense fallback={
                  <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 animate-pulse">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-white/5 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-white/5 rounded mb-2"></div>
                        <div className="h-3 bg-white/5 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-white/5 rounded"></div>
                      <div className="h-3 bg-white/5 rounded w-3/4"></div>
                    </div>
                  </div>
                }>
                  <LazyTokenCard token={previewToken} preview={true} />
                </Suspense>
             </div>
             <p className="text-xs text-gray-500 text-center px-4 leading-relaxed">
                This is how your token will appear on the board. Make it catchy!
             </p>
         </div>

      </div>
    </div>
    </>
  );
};

export default Launch;
