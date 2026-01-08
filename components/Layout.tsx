
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Rocket, Wallet, Menu, X, Coins, ExternalLink, ChevronRight, User, HelpCircle, LogOut, RefreshCw, Volume2, VolumeX, Trophy, Bell, Check, Trash2, Droplets, Command, Search, Settings, Tv, Keyboard, Crosshair, ArrowLeftRight, Sprout, LayoutGrid, Send, Shield, Award, TrendingUp, MoreHorizontal } from 'lucide-react';
import { XIcon } from './XIcon';
import { Button } from './Button';
import { connectWallet, formatAddress, switchToDogechain, formatNumber } from '../services/web3Service';
import { UserState, AppNotification } from '../types';
import { DOGECHAIN_ID } from '../constants';
import { ToastProvider, useToast } from './Toast';
import { Ticker } from './Ticker';
import { HowItWorksModal } from './HowItWorksModal';
import { SettingsModal } from './SettingsModal';
import { WalletModal } from './WalletModal';
import { playSound, setMuteState, onMuteChange } from '../services/audio';
import { useStore } from '../contexts/StoreContext';
import { timeAgo } from '../utils';
import { MobileNavBar } from './MobileNavBar';
import { Lightbox } from './Lightbox';
import { CommandPalette } from './CommandPalette';
import { Trollbox } from './Trollbox';
import { ShortcutsModal } from './ShortcutsModal';
import { NewsBanner } from './NewsBanner';
import { AchievementPopup } from './AchievementPopup';
import { NetworkStatus } from './NetworkStatus';

// Inner component to use Toast hook and Store
const Navbar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [activeMobileMenu, setActiveMobileMenu] = useState<'none' | 'hamburger' | 'wallet'>('none');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMoreNav, setShowMoreNav] = useState(false);
  const [newsBannerHeight, setNewsBannerHeight] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const notificationRef = useRef<HTMLDivElement>(null);
  const mobileNotificationRef = useRef<HTMLDivElement>(null);
  const walletMenuRef = useRef<HTMLDivElement>(null);
  const moreNavRef = useRef<HTMLDivElement>(null);
  const isUpdatingFromFooterRef = useRef(false);
  const { addToast } = useToast();
  const { resetStore, userBalanceDC, notifications, unreadCount, markAllNotificationsRead, clearNotifications, faucet, userProfile, recentlyUnlockedBadge, clearAchievement, settings, updateSettings, setNotifications, marketEvent } = useStore();
  
  const [user, setUser] = useState<UserState>({
    address: null,
    chainId: null,
    balance: '0',
    isConnected: false
  });

  // Scroll position restoration
  useEffect(() => {
    // Save current scroll position before navigating
    const saveScrollPosition = () => {
      sessionStorage.setItem('scrollPosition_' + location.pathname, window.pageYOffset.toString());
    };

    // Restore scroll position for current path
    const restoreScrollPosition = () => {
      const savedPosition = sessionStorage.getItem('scrollPosition_' + location.pathname);
      if (savedPosition) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedPosition, 10));
        }, 0);
      } else {
        // Only scroll to top if no saved position
        window.scrollTo(0, 0);
      }
    };

    // Save scroll position when navigating away (on back button)
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    // Save position on popstate (back/forward buttons)
    const handlePopState = () => {
      saveScrollPosition();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Restore position on mount
    restoreScrollPosition();

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      // Save position when component unmounts
      saveScrollPosition();
    };
  }, [location.pathname]);

  // Load persistence and Onboarding Check
  useEffect(() => {
    const savedAddress = localStorage.getItem('dogepump_address');
    const savedChain = localStorage.getItem('dogepump_chain');
    if (savedAddress) {
      setUser({
        address: savedAddress,
        chainId: savedChain ? parseInt(savedChain) : DOGECHAIN_ID,
        balance: '0',
        isConnected: true
      });
    }

    // Auto-show Onboarding for new users
    const seenIntro = localStorage.getItem('dogepump_seen_intro');
    if (!seenIntro) {
      setTimeout(() => {
         setIsHelpOpen(true);
         localStorage.setItem('dogepump_seen_intro', 'true');
      }, 1000);
    }
  }, []);

  // Referral Tracking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      const currentRef = localStorage.getItem('dogepump_referrer');
      if (currentRef !== refCode) {
        localStorage.setItem('dogepump_referrer', refCode);
        addToast('success', `Referral applied: ${refCode}`, 'Growth Mode');
      }
    }
  }, []);

  // Sync audio service with store settings (run once on mount)
  useEffect(() => {
    // Set flag to prevent callback from updating settings during initialization
    isUpdatingFromFooterRef.current = true;

    // Initialize audio service state from store settings
    setMuteState(!settings.audioEnabled);

    // Reset flag after initialization
    setTimeout(() => {
      isUpdatingFromFooterRef.current = false;
    }, 0);

    // Listen for changes from audio service (e.g., from footer)
    const unsubscribe = onMuteChange((muted) => {
      // Only update settings if this change didn't originate from footer/init
      if (!isUpdatingFromFooterRef.current) {
        updateSettings({ audioEnabled: !muted });
      }
    });

    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync audio service when settings change from modal
  useEffect(() => {
    // Only update if this didn't originate from footer
    if (!isUpdatingFromFooterRef.current) {
      setMuteState(!settings.audioEnabled);
    }
  }, [settings.audioEnabled]);

  // Track NewsBanner height to adjust navbar position
  useEffect(() => {
    const updateBannerHeight = () => {
      const banner = document.getElementById('news-banner');
      if (banner) {
        setNewsBannerHeight(banner.offsetHeight);
      } else {
        setNewsBannerHeight(0);
      }
    };

    // Update immediately
    updateBannerHeight();

    // Use MutationObserver to detect when banner is added/removed from DOM
    const observer = new MutationObserver(() => {
      updateBannerHeight();
    });

    // Observe the body for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also update when marketEvent changes
    const timer = setTimeout(updateBannerHeight, 100);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [marketEvent]);

  // Debug: Log notifications when they change
  useEffect(() => {
    console.log('[Layout] Notifications updated:', notifications);
    console.log('[Layout] Notifications with links:', notifications.filter(n => n.link));
    console.log('[Layout] Notifications without links:', notifications.filter(n => !n.link));
  }, [notifications]);

  // Keyboard Shortcuts & Konami Code
  useEffect(() => {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Command Palette (Cmd+K or Ctrl+K)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        playSound('click');
      }

      // Konami Check
      if (e.key === konamiCode[konamiIndex]) {
         konamiIndex++;
         if (konamiIndex === konamiCode.length) {
            playSound('success');
            addToast('success', 'Cheat Code Activated!', 'GOD MODE');
            faucet();
            konamiIndex = 0;
         }
      } else {
         konamiIndex = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideDesktop = notificationRef.current && !notificationRef.current.contains(event.target as Node);
      const isOutsideMobile = mobileNotificationRef.current && !mobileNotificationRef.current.contains(event.target as Node);

      // Close if click is outside both desktop and mobile notification areas
      if (showNotifications && isOutsideDesktop && isOutsideMobile) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showNotifications]);

  // Click outside to close wallet menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (walletMenuRef.current && !walletMenuRef.current.contains(event.target as Node)) {
        setShowWalletMenu(false);
      }
    };

    if (showWalletMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showWalletMenu]);

  // Click outside to close more nav menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreNavRef.current && !moreNavRef.current.contains(event.target as Node)) {
        setShowMoreNav(false);
      }
    };

    if (showMoreNav) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMoreNav]);

  const handleConnect = async (walletType: string) => {
    try {
      const data = await connectWallet();
      setUser({
        address: data.address,
        chainId: data.chainId,
        balance: '0', 
        isConnected: true
      });
      
      // Persist
      if (data.address) {
        localStorage.setItem('dogepump_address', data.address);
        localStorage.setItem('dogepump_chain', data.chainId.toString());
      }
      
      addToast('success', `Connected via ${walletType}`, 'Wallet Connected');

      if (data.chainId !== DOGECHAIN_ID) {
        await switchToDogechain();
      }
    } catch (e) {
      console.error(e);
      addToast('error', 'Failed to connect wallet', 'Error');
    }
  };

  const handleDisconnect = () => {
    playSound('click');
    setUser({
      address: null,
      chainId: null,
      balance: '0',
      isConnected: false
    });
    localStorage.removeItem('dogepump_address');
    localStorage.removeItem('dogepump_chain');
    setShowWalletMenu(false);
    addToast('info', 'Wallet disconnected');
  };

  const handleMuteToggle = () => {
    const newAudioEnabled = !settings.audioEnabled;
    isUpdatingFromFooterRef.current = true;
    updateSettings({ audioEnabled: newAudioEnabled });
    setMuteState(!newAudioEnabled);
    // Reset flag after state updates
    setTimeout(() => {
      isUpdatingFromFooterRef.current = false;
    }, 0);
    if (newAudioEnabled) playSound('click');
  };

  const handleNotificationsToggle = () => {
    setShowNotifications(!showNotifications);
    playSound('click');
  };

  const handleNotificationClick = (notification: AppNotification, e?: React.MouseEvent) => {
    // Prevent event from bubbling up
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    console.log('[Notification Click] Notification:', notification);
    console.log('[Notification Click] Link:', notification.link);

    // Mark notification as read
    setNotifications(prev => prev.map(n =>
      n.id === notification.id ? { ...n, read: true } : n
    ));

    // Navigate to link if present
    if (notification.link) {
      console.log('[Notification Click] Navigating to:', notification.link);
      // Use setTimeout to ensure state updates complete before navigation
      setTimeout(() => {
        navigate(notification.link!);
      }, 0);
    } else {
      console.log('[Notification Click] No link found, just marking as read');
    }

    // Close notifications dropdown and wallet menu
    setShowNotifications(false);
    setShowWalletMenu(false);
    setActiveMobileMenu('none');
    playSound('click');
  };

  // Check if current user is an admin
  const isAdminWallet = user.address && user.address.toLowerCase() === '0x22f4194f6706e70abaa14ab352d0baa6c7ced24a';

  const primaryNavLinks = [
    { name: 'Board', path: '/', icon: Coins },
    { name: 'Launch', path: '/launch', icon: Rocket },
    { name: 'DEX', path: '/dex/swap', icon: ArrowLeftRight },
    { name: 'Earn', path: '/earn', icon: Sprout },
  ];

  const secondaryNavLinks = [
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'TV', path: '/tv', icon: Tv },
  ];

  const [headerHeight, setHeaderHeight] = useState(149); // Default: 85 (banner) + 32 (ticker) + 32 (nav approx)

  // Track total header height
  useEffect(() => {
    const updateHeaderHeight = () => {
      const ticker = document.querySelector('.bg-\\[\\#050505\\].border-b'); // Ticker element
      const navbar = document.querySelector('nav');

      let totalHeight = 0;

      // Use the tracked newsBannerHeight state
      if (newsBannerHeight > 0) {
        totalHeight += newsBannerHeight;
      }

      if (ticker) {
        totalHeight += (ticker as HTMLElement).offsetHeight;
      }

      if (navbar) {
        totalHeight += (navbar as HTMLElement).offsetHeight;
      }

      setHeaderHeight(totalHeight);
    };

    // Update initially
    updateHeaderHeight();

    // Update when banner changes
    const observer = new MutationObserver(() => {
      updateHeaderHeight();
    });

    // Observe body for banner changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, [newsBannerHeight]);

  // TV uses its own immersive layout
  if (location.pathname === '/tv') {
    return (
       <>
         <ToastProvider>
           {children}
         </ToastProvider>
       </>
    );
  }

  return (
    <>
      {/* Fixed Header Container - All elements together */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <NewsBanner />
        <Ticker newsBannerHeight={newsBannerHeight} />
        {/* Navbar */}
        <nav className={`border-b border-white/[0.08] bg-doge-bg/80 backdrop-blur-xl transition-all duration-300`}
             style={{ zIndex: 60 }}>
        <div className="w-full md:max-w-6xl md:mx-auto lg:max-w-7xl px-4 sm:px-6 tablet:px-8 lg:px-8 relative">
          <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between md:h-20 pb-4 md:pb-0">
            {/* Logo */}
            <Link to="/" onClick={() => playSound('click')} className="flex items-center gap-3 group relative w-full justify-center md:w-auto md:justify-start">
               <div className="absolute -inset-4 bg-doge/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
               <div className="relative w-10 h-10 perspective-1000">
                 <div className="absolute inset-0 bg-doge rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-500 opacity-20 blur-[2px]"></div>
                 <div className="relative w-10 h-10 bg-gradient-to-br from-[#F4C430] to-[#D4AF37] rounded-xl flex items-center justify-center text-black font-bold text-xl shadow-[0_0_15px_rgba(212,175,55,0.3)] border border-white/20 group-hover:scale-110 transition-transform duration-300">
                  Ð
                 </div>
               </div>
               <div className="flex flex-col">
                 <span className="font-comic font-bold text-2xl tracking-tight text-white leading-none group-hover:text-doge-light transition-colors drop-shadow-md">
                   Doge<span className="text-doge">Pump</span>
                 </span>
                 <span className="text-[9px] text-doge/60 font-mono tracking-[0.3em] uppercase group-hover:text-doge/80 transition-colors">Fair Launch</span>
               </div>
            </Link>

            {/* Mobile Balance/Address (always visible on mobile) */}
            {user.isConnected && (
              <div className="md:hidden w-full flex justify-center">
                <div 
                  onClick={() => { setActiveMobileMenu(activeMobileMenu === 'wallet' ? 'none' : 'wallet'); playSound('click'); }}
                  className="flex items-center gap-2 px-4 py-2 bg-doge-surface rounded-full border border-doge-border text-xs font-mono text-gray-300 hover:border-doge/50 hover:bg-doge/5 transition-all cursor-pointer group shadow-lg hover:shadow-doge/10"
                >
                  <span className="text-doge font-bold">{formatNumber(userBalanceDC)} DC</span>
                  <span className="text-gray-700">|</span>
                  <span className="max-w-[140px] truncate text-gray-200">{formatAddress(user.address || '')}</span>
                </div>
              </div>
            )}

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1.5 rounded-full border border-white/[0.05] backdrop-blur-md shadow-inner [&_a]:list-none [&_a]:before:content-none [&_a]:after:content-none">
              {primaryNavLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => playSound('click')}
                  onMouseEnter={() => playSound('hover')}
                  className={`flex items-center gap-2 px-3 tablet:px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 relative overflow-hidden group list-none before:content-none after:content-none ${
                    location.pathname === link.path
                      ? 'bg-doge text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {location.pathname === link.path && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                  <span className="relative z-10 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 flex items-center justify-center" style={{ width: 16, height: 16 }}>
                    <IconComponent size={16} className={location.pathname === link.path ? "animate-bounce-subtle" : ""} />
                  </span>
                  <span className="relative z-10 hidden tablet:inline">{link.name}</span>
                </Link>
                );
              })}

              {/* More Dropdown - Shows on tablets only when needed */}
              <div className="tablet:hidden relative" ref={moreNavRef}>
                <button
                  onClick={() => { setShowMoreNav(!showMoreNav); playSound('click'); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300 relative overflow-hidden group"
                >
                  <span className="relative z-10 shrink-0 flex items-center justify-center" style={{ width: 16, height: 16 }}>
                    <MoreHorizontal size={16} />
                  </span>
                </button>
                {showMoreNav && (
                  <div className="absolute top-full right-0 mt-2 min-w-[160px] bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-slide-up z-50">
                    {secondaryNavLinks.map((link) => {
                      const IconComponent = link.icon;
                      return (
                        <Link
                          key={link.path}
                          to={link.path}
                          onClick={() => { setShowMoreNav(false); playSound('click'); }}
                          className={`flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all duration-300 ${
                            location.pathname === link.path
                              ? 'bg-doge text-black'
                              : link.name === 'TV'
                              ? 'text-red-500 hover:text-white hover:bg-red-500'
                              : 'text-gray-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <IconComponent size={16} />
                          <span>{link.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Secondary Nav - Hidden on small tablets */}
              {secondaryNavLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => playSound('click')}
                  onMouseEnter={() => playSound('hover')}
                  className={`hidden tablet:flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 relative overflow-hidden group list-none before:content-none after:content-none ${
                    link.name === 'TV'
                      ? 'text-red-500 hover:text-white hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                      : location.pathname === link.path
                      ? 'bg-doge text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="shrink-0 flex items-center justify-center" style={{ width: 16, height: 16 }}>
                    <IconComponent size={16} />
                  </span>
                  <span>{link.name}</span>
                </Link>
                );
              })}
            </div>

            {/* Wallet & Notifications */}
            <div className="hidden md:flex items-center gap-4">
              
              {/* Command Palette Trigger */}
              <button
                 onClick={() => { setIsCommandPaletteOpen(true); playSound('click'); }}
                 className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10 group"
                 title="Search (Cmd+K)"
              >
                 <Search size={18} />
                 <div className="hidden tablet:flex items-center gap-1 text-[10px] font-bold border border-white/10 rounded px-1.5 bg-white/5 text-gray-500 group-hover:text-white group-hover:border-white/20">
                    <Command size={10} /> K
                 </div>
              </button>
              
              {user.isConnected ? (
                <div className="flex items-center gap-3 animate-fade-in relative" ref={walletMenuRef}>
                   {user.chainId !== DOGECHAIN_ID && (
                     <Button size="sm" variant="danger" onClick={switchToDogechain}>
                        Wrong Network
                     </Button>
                   )}
                   <div
                      onClick={() => { setShowWalletMenu(!showWalletMenu); playSound('click'); }}
                      className="flex items-center gap-2 px-3 tablet:px-4 py-2 bg-doge-surface rounded-full border border-doge-border text-xs font-mono text-gray-300 hover:border-doge/50 hover:bg-doge/5 transition-all cursor-pointer group shadow-lg hover:shadow-doge/10"
                   >
                     <div className="w-2 h-2 bg-doge-success rounded-full shadow-[0_0_8px_#00E054] animate-pulse"></div>
                     <span className="text-doge font-bold">{formatNumber(userBalanceDC)} DC</span>
                     <span className="text-gray-700">|</span>
                     <div className="flex items-center gap-2">
                         {userProfile.avatarUrl ? (
                             <img
                               src={userProfile.avatarUrl}
                               alt="Avatar"
                               className="w-5 h-5 rounded-full object-cover"
                               onError={(e) => {
                                 e.currentTarget.style.display = 'none';
                               }}
                             />
                         ) : (
                             <User size={14} className="opacity-50 group-hover:opacity-100" />
                         )}
                         <span className="group-hover:text-white transition-colors tracking-wide max-w-[60px] tablet:max-w-[80px] truncate">
                            {userProfile.username !== 'Anonymous Doge' ? userProfile.username : formatAddress(user.address || '')}
                         </span>
                     </div>
                   </div>
                   
                   {/* Desktop Dropdown */}
                   {showWalletMenu && (
                     <div className="hidden md:block absolute top-full right-0 mt-2 w-80 max-w-md bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-slide-up z-70">
                        <div className="p-1">
                          {isAdminWallet && (
                            <button
                              onClick={() => { navigate('/admin'); setShowWalletMenu(false); playSound('click'); }}
                              className="w-full text-left px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg flex items-center gap-2 border-b border-white/5 mb-1"
                            >
                             <Shield size={16} /> Admin Dashboard
                            </button>
                          )}
                          
                          {/* Notifications Section */}
                          <div className="border-b border-white/5 mb-1">
                            <button
                              onClick={handleNotificationsToggle}
                              className="w-full text-left px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center justify-between"
                            >
                             <div className="flex items-center gap-2">
                               <Bell size={16} />
                               <span>Notifications</span>
                             </div>
                             {unreadCount > 0 && (
                               <span className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_#EF4444] animate-pulse"></span>
                             )}
                            </button>
                            
                            {/* Notification Dropdown */}
                            {showNotifications && (
                              <div className="mt-1 mx-1 mb-2 bg-white/[0.02] rounded-lg overflow-hidden z-70">
                                  <div className="flex items-center justify-between p-3 border-b border-white/5">
                                     <h4 className="text-sm font-bold text-white">Notifications</h4>
                                     <div className="flex gap-2">
                                        <button onClick={() => { markAllNotificationsRead(); playSound('click'); }} className="text-xs text-doge hover:text-white" title="Mark all read">
                                           <Check size={14}/>
                                        </button>
                                        <button onClick={() => { clearNotifications(); playSound('click'); }} className="text-xs text-red-400 hover:text-red-300" title="Clear all">
                                           <Trash2 size={14}/>
                                        </button>
                                     </div>
                                  </div>
                                  <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                     {notifications.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500 text-xs">No notifications yet.</div>
                                     ) : (
                                        notifications.map(n => (
                                           <div
                                             key={n.id}
                                             onClick={(e) => handleNotificationClick(n, e)}
                                             className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer relative ${!n.read ? 'bg-white/[0.02]' : ''}`}
                                           >
                                              {!n.read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1 bg-doge rounded-full"></div>}
                                              <div className="flex justify-between items-start mb-1">
                                                 <span className={`text-xs font-bold ${n.type === 'rocket' ? 'text-doge' : n.type === 'trade' ? 'text-green-400' : 'text-gray-300'}`}>
                                                    {n.title}
                                                 </span>
                                                 <span className="text-[9px] text-gray-600">{timeAgo(n.timestamp)}</span>
                                              </div>
                                              <p className="text-xs text-gray-400 leading-snug">{n.message}</p>
                                           </div>
                                        ))
                                     )}
                                  </div>
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={() => { navigate('/profile'); setShowWalletMenu(false); playSound('click'); }}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
                          >
                             <User size={16} /> Profile
                          </button>
                          <button
                            onClick={() => { setIsSettingsOpen(true); setShowWalletMenu(false); playSound('click'); }}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
                          >
                             <Settings size={16} /> Settings
                          </button>
                          <button
                            onClick={handleDisconnect}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2"
                          >
                             <LogOut size={16} /> Disconnect
                          </button>
                        </div>
                     </div>
                   )}
                </div>
              ) : (
                <Button onClick={() => setIsWalletModalOpen(true)} size="sm" className="rounded-full px-6 shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] border border-white/10 bg-doge/90 hover:bg-doge group">
                  <Wallet size={16} className="mr-2 group-hover:rotate-12 transition-transform" />
                  Connect
                </Button>
              )}
            </div>

            {/* Mobile Header Right */}
            <div className="md:hidden flex items-center gap-2 justify-center">
              {/* Hamburger Menu Button */}
              <button
                 onClick={() => { setActiveMobileMenu(activeMobileMenu === 'hamburger' ? 'none' : 'hamburger'); playSound('click'); }}
                 className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                 {activeMobileMenu === 'hamburger' ? <X size={20} /> : <Menu size={20} />}
              </button>
              <button
                 onClick={() => { setIsCommandPaletteOpen(true); playSound('click'); }}
                 className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                 <Search size={20} />
              </button>
              {user.isConnected ? (
                <button
                  onClick={() => { setActiveMobileMenu(activeMobileMenu === 'wallet' ? 'none' : 'wallet'); playSound('click'); }}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-doge to-doge-dark p-0.5 flex items-center justify-center border border-doge-border"
                >
                   {userProfile.avatarUrl ? (
                      <img
                        src={userProfile.avatarUrl}
                        alt="User"
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                   ) : null}
                   {(!userProfile.avatarUrl || userProfile.avatarUrl === '') && (
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                         <User size={14} className="text-doge"/>
                      </div>
                   )}
                </button>
              ) : (
                <button
                  onClick={() => setIsWalletModalOpen(true)}
                  className="p-2 text-doge hover:bg-white/5 rounded-xl transition-colors"
                >
                  <Wallet size={24} />
                </button>
              )}
            </div>

            {/* Mobile Wallet Dropdown */}
            {activeMobileMenu === 'wallet' && (
              <div className="md:hidden absolute top-full left-0 right-0 mx-4 mt-2 max-w-md bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-70">
                 <div className="p-1">
                   {isAdminWallet && (
                     <button
                       onClick={() => { navigate('/admin'); setShowWalletMenu(false); playSound('click'); }}
                       className="w-full text-left px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg flex items-center gap-2 border-b border-white/5 mb-1"
                     >
                      <Shield size={16} /> Admin Dashboard
                     </button>
                   )}
                   
                   <div className="border-b border-white/5 mb-1">
                     <button
                       onClick={handleNotificationsToggle}
                       className="w-full text-left px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center justify-between"
                     >
                      <div className="flex items-center gap-2">
                        <Bell size={16} />
                        <span>Notifications</span>
                      </div>
                      {unreadCount > 0 && (
                        <span className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_#EF4444] animate-pulse"></span>
                      )}
                     </button>
                     
                     {showNotifications && (
                       <div className="mt-1 mx-1 mb-2 bg-white/[0.02] rounded-lg overflow-hidden z-70">
                           <div className="flex items-center justify-between p-3 border-b border-white/5">
                              <h4 className="text-sm font-bold text-white">Notifications</h4>
                              <div className="flex gap-2">
                                 <button onClick={() => { markAllNotificationsRead(); playSound('click'); }} className="text-xs text-doge hover:text-white" title="Mark all read">
                                    <Check size={14}/>
                                 </button>
                                 <button onClick={() => { clearNotifications(); playSound('click'); }} className="text-xs text-red-400 hover:text-red-300" title="Clear all">
                                    <Trash2 size={14}/>
                                 </button>
                              </div>
                           </div>
                           <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                              {notifications.length === 0 ? (
                                 <div className="p-4 text-center text-gray-500 text-xs">No notifications yet.</div>
                              ) : (
                                 notifications.map(n => (
                                    <div
                                      key={n.id}
                                      onClick={(e) => handleNotificationClick(n, e)}
                                      className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer relative ${!n.read ? 'bg-white/[0.02]' : ''}`}
                                    >
                                       {!n.read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1 bg-doge rounded-full"></div>}
                                       <div className="flex justify-between items-start mb-1">
                                          <span className={`text-xs font-bold ${n.type === 'rocket' ? 'text-doge' : n.type === 'trade' ? 'text-green-400' : 'text-gray-300'}`}>
                                             {n.title}
                                          </span>
                                          <span className="text-[9px] text-gray-600">{timeAgo(n.timestamp)}</span>
                                       </div>
                                       <p className="text-xs text-gray-400 leading-snug">{n.message}</p>
                                    </div>
                                 ))
                              )}
                           </div>
                       </div>
                     )}
                   </div>
                   
                   <button
                     onClick={() => { navigate('/profile'); setShowWalletMenu(false); playSound('click'); }}
                     className="w-full text-left px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
                   >
                      <User size={16} /> Profile
                   </button>
                   <button
                     onClick={() => { setIsSettingsOpen(true); setShowWalletMenu(false); playSound('click'); }}
                     className="w-full text-left px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
                   >
                      <Settings size={16} /> Settings
                   </button>
                   <button
                     onClick={handleDisconnect}
                     className="w-full text-left px-4 py-3 text-sm font-medium text-red-400 hover:text-red-500/10 rounded-lg flex items-center gap-2"
                   >
                      <LogOut size={16} /> Disconnect
                   </button>
                 </div>
              </div>
            )}
          </div>


        {/* Mobile Menu Dropdown */}
        {activeMobileMenu === 'hamburger' && (
           <div className="md:hidden bg-doge-bg/95 backdrop-blur-xl border-b border-white/10">
              <div className="px-4 py-6 space-y-1">
                 {[...primaryNavLinks, ...secondaryNavLinks].map((link) => {
                   const IconComponent = link.icon;
                   return (
                   <Link
                     key={link.path}
                     to={link.path}
                     onClick={() => { setActiveMobileMenu('none'); playSound('click'); }}
                     className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                       link.name === 'TV'
                         ? 'text-red-500 hover:text-white hover:bg-red-500'
                         : location.pathname === link.path
                         ? 'bg-doge text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                         : 'text-gray-400 hover:text-white hover:bg-white/5'
                     }`}
                   >
                      <IconComponent size={18} />
                      <span>{link.name}</span>
                   </Link>
                   );
                 })}
              </div>
           </div>
        )}
        </div>
      </nav>
      </div>

      {/* Main Content Container - Add padding for fixed header */}
      <div className="min-h-[100dvh] flex flex-col font-sans selection:bg-doge/30 relative" style={{ paddingTop: `${headerHeight}px` }}>
      {/* Main Content - Full width on mobile, centered on desktop */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-12 relative z-0 pb-40 md:pb-32 lg:pb-16 min-h-0">
        <div className="w-full md:max-w-7xl md:mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Nav */}
      <MobileNavBar />

      {/* Mobile spacer to ensure footer content remains scrollable above the sticky trade bar */}
      <div className="h-12 lg:hidden" aria-hidden />

      {/* Footer - visible on all breakpoints; extra bottom padding on small screens to clear the mobile trade bar */}
      <footer className="border-t border-white/[0.05] py-12 pb-32 md:pb-28 lg:pb-20 mt-auto relative z-0 bg-[#0A0A0A] block flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left w-full md:w-auto flex flex-col items-center md:items-start">
             <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <div className="w-6 h-6 bg-doge rounded-lg flex items-center justify-center text-black text-xs font-bold shadow-lg shadow-doge/20">Ð</div>
                <div className="font-comic font-bold text-xl tracking-wide text-white">
                    Doge<span className="text-doge">Pump</span>
                </div>
              </div>
              <p className="text-gray-500 text-sm max-w-xs leading-relaxed mx-auto md:mx-0">
                The premier decentralized launchpad protocol for the Dogechain ecosystem.
                <span className="block mt-1 text-purple-400/60">100% Fair Launch. No Presale.</span>
              </p>
             <div className="flex w-full items-center justify-center md:justify-start gap-4 mt-3">
               <a
                 href="https://x.com/dogepump"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="text-gray-600 hover:text-white transition-colors"
                 title="Follow us on X"
               >
                 <XIcon size={18} />
               </a>
               <a
                 href="https://t.me/dogepump"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="text-gray-600 hover:text-white transition-colors"
                 title="Join our Telegram"
               >
                 <Send size={18} />
               </a>
             </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8 text-xs font-bold text-gray-500 uppercase tracking-widest">
             <button onClick={handleMuteToggle} className="hover:text-white transition-colors flex items-center gap-2">
                {settings.audioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />} {settings.audioEnabled ? 'Mute' : 'Unmute'}
             </button>
             <button onClick={() => setIsShortcutsOpen(true)} className="hover:text-white transition-colors flex items-center gap-2">
                <Keyboard size={14} /> Shortcuts
             </button>
             <Link to="/tv" className="hover:text-red-500 transition-colors flex items-center gap-2">
                <Tv size={14} /> DogeTV
             </Link>
             <button onClick={() => setIsHelpOpen(true)} className="hover:text-doge transition-colors flex items-center gap-2 group">How it Works <ExternalLink size={10} className="group-hover:-translate-y-0.5 transition-transform"/></button>
             
             {/* Network Stats Integration */}
             <NetworkStatus />
          </div>
        </div>
      </footer>
      </div>
    </>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ToastProvider>
      <Navbar>{children}</Navbar>
    </ToastProvider>
  );
};

export default Layout;
