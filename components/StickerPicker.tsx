
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Unicode emojis that work everywhere
const UNICODE_EMOJIS = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
  '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
  '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
  '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟',
  '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖',
  '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩',
  '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀',
  '😿', '😾', '🙈', '🙉', '🙊', '💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💔',
  '❣️', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '👋', '🤚',
  '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇',
  '☝️', '✋️', '🤚', '🖖', '👋', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶',
  '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '🫦', '🫧', '👶',
  '🧒', '👦', '👧', '🧑', '👱', '👱‍♀️', '👱‍♂️', '🧔', '🧔‍♀️', '🧔‍♂️', '👨', '👩', '👨‍🦰', '👩‍🦰', '👱‍♀️',
  '🚀', '🌙', '⭐', '🌟', '✨', '💫', '☄️', '🪐', '🌍', '🌎', '🌏', '🌐', '🌑', '🌒', '🌓',
  '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '🌝', '🌞', '⭐', '🌟', '🌠', '🌌',
  '🪔', '⌛', '⏳', '⌚', '⏰', '⏱️', '⏲️', '🕰', '🕛', '🕧', '🕜', '🕐', '🕑', '🕒', '🕓',
  '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧',
  '🕰', '🕳️', '🪠', '🔥', '💧', '🌊', '🎰', '🎲', '🎯', '🎳', '🎮', '🎰', '🎲', '🧩',
  '🧸', '🪄', '🎁', '🎀', '🎊', '🎉', '🎈', '🎂', '🍰', '🎄', '🎃', '🎆', '🎇', '🧨', '🎈',
  '🎉', '🎊', '🎋', '🎌', '🎍', '🎎', '🎏', '🎐', '🎑', '🧧', '🎗', '🎞', '🎟️', '🎫', '🎖️',
  '🏆', '🏅', '🥇', '🥈', '🥉', '⚽', '⚾', '🥎', '🏀', '🏐', '🏈', '🏉', '🎾', '🥏', '🎳',
  '🏏', '🏑', '🥅', '⛳', '🏹', '🎣', '🤿', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂',
  '🪂', '🏋️', '🤼', '🤸', '🤺', '🤾', '🏌️', '🏐', '🏓', '🏑', '🥅', '⛳', '🏹', '🎣', '🤿',
  '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '🤾', '🏌️',
  '🪴', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🌾', '🌾', '🌾',
  '🌾', '🌾', '🌾', '🌾', '🌾', '🌾', '🌾', '🌾', '🌾', '🌾', '🌾', '🌾', '🌾', '🌾', '🌾',
  '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤',
  '🔥', '💧', '🌊', '🎰', '🎲', '🎯', '🎳', '🎮', '🎰', '🎲', '🧩', '🧸', '🪄', '🎁', '🎀',
  '🎊', '🎉', '🎈', '🎂', '🍰', '🎄', '🎃', '🎆', '🎇', '🧨', '🎈', '🎉', '🎊', '🎋', '🎌',
  '🪙', '💴', '💵', '💶', '💷', '💸', '💹', '💱', '💲', '💰', '💳', '💎', '⚖️', '🧰', '🔧',
  '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '⚗️', '🔫', '💣', '🪓', '🔪', '🗡️',
  '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹',
  '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🧺', '🧻', '🧼', '🧽', '🧯',
  '🛒', '🛍️', '🧶', '🧵', '🧶', '🧶', '🪡', '🪢', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🥼',
  '👚', '👟', '🥾', '🥿', '👠', '👡', '👢', '🪮', '👑', '👒', '🎩', '🎓', '🧢', '🪖', '⛑️',
  '📿', '💄', '💍', '💎', '🏺', '🗿', '🛍️', '🎁', '🎀', '🎗', '🎟', '🎫', '🎖', '🏆', '🏅',
  '⚽', '⚾', '🥎', '🏀', '🏐', '🏈', '🏉', '🎾', '🥏', '🎳', '🏏', '👑', '🎩', '🎓', '🎪'
];

// Enhanced sticker packs with different themes
const STICKER_PACKS = [
  {
    id: 'crypto',
    name: 'Crypto',
    stickers: [
      { id: 'rocket', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f680.png', name: 'Rocket' },
      { id: 'diamond', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f4b0.png', name: 'Diamond' },
      { id: 'fire', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f525.png', name: 'Fire' },
      { id: 'money', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f4b5.png', name: 'Money' },
      { id: 'chart', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f4c8.png', name: 'Chart Up' },
      { id: 'stonks', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f4b9.png', name: 'Stonks' },
      { id: 'bag', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f4b6.png', name: 'Money Bag' },
      { id: 'coin', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1fa99.png', name: 'Coin' }
    ]
  },
  {
    id: 'memes',
    name: 'Memes',
    stickers: [
      { id: 'chad', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f60e.png', name: 'Chad' },
      { id: 'this-is-fine', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f624.png', name: 'This Is Fine' },
      { id: 'brain-let', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f9e0.png', name: 'Brain' },
      { id: 'thinking', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f914.png', name: 'Thinking' },
      { id: 'monocle', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f9d0.png', name: 'Monocle' },
      { id: 'clown', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f921.png', name: 'Clown' },
      { id: 'eyes', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f440.png', name: 'Eyes' },
      { id: 'zipper', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f910.png', name: 'Zipper Mouth' }
    ]
  },
  {
    id: 'reactions',
    name: 'Reactions',
    stickers: [
      { id: 'laugh', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f606.png', name: 'Laughing' },
      { id: 'love', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f60d.png', name: 'Love' },
      { id: 'cry', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f622.png', name: 'Crying' },
      { id: 'angry', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f620.png', name: 'Angry' },
      { id: 'mind-blown', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f92f.png', name: 'Mind Blown' },
      { id: 'party', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f389.png', name: 'Party' },
      { id: '100', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f4af.png', name: '100 Percent' },
      { id: 'ok', url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f44c.png', name: 'OK Hand' }
    ]
  }
];

// Flattened stickers array for compatibility
const DEFAULT_STICKERS = STICKER_PACKS.flatMap(pack => pack.stickers);

interface StickerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, type: 'emoji' | 'sticker') => void;
  position?: { top: number; left: number };
}

export const StickerPicker: React.FC<StickerPickerProps> = ({ isOpen, onClose, onSelect, position }) => {
  const [activeTab, setActiveTab] = useState<'emojis' | 'stickers'>('emojis');
  const [selectedPack, setSelectedPack] = useState(STICKER_PACKS[0]);
  const pickerRef = useRef<HTMLDivElement>(null);

  console.log('[StickerPicker] Component rendering, isOpen:', isOpen, 'position:', position);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        console.log('[StickerPicker] Clicked outside, closing');
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    console.log('[StickerPicker] Returning null because isOpen is false');
    return null;
  }

  console.log('[StickerPicker] Rendering picker with position:', position);

  const pickerStyle = position ? {
    top: `${position.top}px`,
    left: `${position.left}px`,
  } : {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  };

  return createPortal(
    <div
      ref={pickerRef}
      className="fixed z-[200] w-80 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
      style={pickerStyle}
    >

      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-white/5 bg-white/[0.02]">
        <div className="flex gap-1 bg-black/40 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('emojis')}
            className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
              activeTab === 'emojis' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Emojis
          </button>
          <button
            onClick={() => setActiveTab('stickers')}
            className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
              activeTab === 'stickers' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Stickers
          </button>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white p-1">
           <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 h-80 overflow-y-auto custom-scrollbar">
        {activeTab === 'emojis' && (
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Popular Emojis</div>
            <div className="grid grid-cols-6 gap-1">
              {UNICODE_EMOJIS.slice(0, 120).map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onSelect(emoji, 'emoji');
                    onClose();
                  }}
                  className="aspect-square rounded hover:bg-white/10 flex items-center justify-center text-xl transition-colors p-1"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stickers' && (
          <div>
            {/* Pack Selector */}
            <div className="flex gap-1 mb-3 bg-black/40 p-1 rounded-lg">
              {STICKER_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => setSelectedPack(pack)}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                    selectedPack.id === pack.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {pack.name}
                </button>
              ))}
            </div>

            {/* Sticker Grid */}
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{selectedPack.name} Pack</div>
            <div className="grid grid-cols-4 gap-2">
              {selectedPack.stickers.map((sticker) => (
                <button
                  key={sticker.id}
                  onClick={() => {
                    onSelect(sticker.url, 'sticker');
                    onClose();
                  }}
                  className="aspect-square rounded-lg hover:bg-white/10 flex items-center justify-center overflow-hidden transition-colors p-1"
                  title={sticker.name}
                >
                  <img
                    src={sticker.url}
                    alt={sticker.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback to emoji if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.textContent = sticker.url.split('/').pop()?.split('.')[0] || '😄';
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
