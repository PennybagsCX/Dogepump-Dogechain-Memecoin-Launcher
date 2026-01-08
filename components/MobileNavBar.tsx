
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Coins, Rocket, Trophy, User, Sprout, ArrowLeftRight } from 'lucide-react';
import { playSound } from '../services/audio';

export const MobileNavBar: React.FC = () => {
  const location = useLocation();
  
  // Hide on Token Detail pages because the Trade Bar takes precedence
  if (location.pathname.startsWith('/token/')) return null;

  const navItems = [
    { path: '/', icon: Coins, label: 'Board' },
    { path: '/launch', icon: Rocket, label: 'Launch' },
    { path: '/dex/swap', icon: ArrowLeftRight, label: 'DEX' },
    { path: '/earn', icon: Sprout, label: 'Earn' },
    { path: '/leaderboard', icon: Trophy, label: 'Winners' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/10 pb-safe overflow-hidden">
      <div className="flex justify-around items-center h-16 overflow-hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => playSound('click')}
            className={({ isActive }) => `
               flex flex-col items-center justify-center w-full h-full gap-1 transition-colors
               ${isActive ? 'text-doge' : 'text-gray-500 hover:text-gray-300'}
            `}
          >
            {({ isActive }) => (
               <>
                  <div className={`relative ${isActive ? 'scale-110' : 'scale-100'} transition-transform`}>
                    <item.icon size={20} className={isActive ? 'fill-doge/20' : ''} />
                    {isActive && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-doge shadow-[0_0_8px_#D4AF37]"></div>}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide">{item.label}</span>
               </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};
