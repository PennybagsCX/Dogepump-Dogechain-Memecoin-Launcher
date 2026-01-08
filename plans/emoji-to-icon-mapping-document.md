# Emoji-to-Icon Mapping Document
## Implementation Guide for DogePump Platform

**Document Version:** 1.0  
**Created:** December 27, 2025  
**Status:** Planning Phase - Ready for Implementation

---

## Executive Summary

This document provides a comprehensive mapping of all emoji usage in the DogePump platform to their corresponding Lucide React icon replacements. The mapping is organized by priority (High Priority for visible UI elements, Low Priority for console logs) and includes detailed implementation instructions, before/after code examples, and a tracking checklist.

### Key Statistics
- **Total Emoji Replacements Required:** 12 high-priority UI elements + ~50 console log statements
- **Files Affected:** 9 component files
- **Custom Components Needed:** 1 (DogIcon)
- **Icons Already Available:** All required icons exist in lucide-react library

---

## Table of Contents

1. [High Priority Replacements](#high-priority-replacements)
2. [Low Priority Replacements](#low-priority-replacements)
3. [Custom Component Specifications](#custom-component-specifications)
4. [Implementation Checklist](#implementation-checklist)
5. [Special Notes and Considerations](#special-notes-and-considerations)

---

## High Priority Replacements

### 1. PageLoader - Dog Emoji

**File:** `components/PageLoader.tsx`  
**Line:** 11  
**Priority:** HIGH  
**Context:** Loading animation shown during page transitions

| Attribute | Value |
|-----------|-------|
| Emoji | 🐶 |
| Replacement | Custom DogIcon component |
| Import Required | Yes (new component) |
| Size | text-2xl (approx 24px) |
| Animation | animate-bounce-subtle |

#### Before Code
```tsx
<div className="w-16 h-16 border-4 border-white/10 border-t-doge rounded-full animate-spin"></div>
<div className="absolute inset-0 flex items-center justify-center text-2xl animate-bounce-subtle">
   🐶
</div>
```

#### After Code
```tsx
<div className="w-16 h-16 border-4 border-white/10 border-t-doge rounded-full animate-spin"></div>
<div className="absolute inset-0 flex items-center justify-center animate-bounce-subtle">
   <DogIcon size={24} className="text-doge" />
</div>
```

#### Implementation Notes
- Must create custom DogIcon component first
- Apply `text-doge` class for brand color
- Maintain existing animation class
- Size should match text-2xl (24px)

---

### 2. PersistentCameraStream - LIVE Indicator

**File:** `components/PersistentCameraStream.tsx`  
**Line:** 141  
**Priority:** HIGH  
**Context:** Live streaming badge indicator

| Attribute | Value |
|-----------|-------|
| Emoji | 🔴 |
| Replacement | Radio icon |
| Import Required | No (already imported) |
| Current Imports | `import { X, Loader2, AlertCircle, Video, Mic, Volume2, VolumeX } from 'lucide-react';` |
| Size | text-xs (12px) |
| Color | White text on red background |

#### Before Code
```tsx
<div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
   🔴 LIVE
</div>
```

#### After Code
```tsx
<div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-1">
   <Radio size={12} fill="currentColor" className="animate-pulse" />
   LIVE
</div>
```

#### Implementation Notes
- Add `Radio` to existing imports
- Use `fill="currentColor"` for filled appearance
- Maintain existing styling classes
- Add `flex items-center gap-1` for proper spacing
- Background color should be red (not green as in current code)

---

### 3. CameraStream - LIVE Indicator

**File:** `components/CameraStream.tsx`  
**Line:** 333  
**Priority:** HIGH  
**Context:** Live streaming badge indicator

| Attribute | Value |
|-----------|-------|
| Emoji | 🔴 |
| Replacement | Radio icon |
| Import Required | No (already imported) |
| Current Imports | `import { X, Loader2, AlertCircle, CheckCircle, Video, Mic, Volume2, VolumeX } from 'lucide-react';` |
| Size | text-xs (12px) |
| Color | White text on red background |

#### Before Code
```tsx
<div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
   🔴 LIVE
</div>
```

#### After Code
```tsx
<div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-1">
   <Radio size={12} fill="currentColor" className="animate-pulse" />
   LIVE
</div>
```

#### Implementation Notes
- Add `Radio` to existing imports
- Use `fill="currentColor"` for filled appearance
- Maintain existing styling classes
- Add `flex items-center gap-1` for proper spacing

---

### 4. CameraStream - Loading Warning

**File:** `components/CameraStream.tsx`  
**Line:** 351  
**Priority:** HIGH  
**Context:** Warning message when video is loading

| Attribute | Value |
|-----------|-------|
| Emoji | ⚠️ |
| Replacement | AlertTriangle icon |
| Import Required | No (already imported) |
| Current Imports | `import { X, Loader2, AlertCircle, CheckCircle, Video, Mic, Volume2, VolumeX } from 'lucide-react';` |
| Size | text-sm (14px) |
| Color | Yellow-400 text on black background |

#### Before Code
```tsx
<div className="text-yellow-400 text-sm bg-black/80 px-3 py-2 rounded">
   ⚠️ Loading video...
</div>
```

#### After Code
```tsx
<div className="text-yellow-400 text-sm bg-black/80 px-3 py-2 rounded flex items-center gap-2">
   <AlertTriangle size={14} />
   Loading video...
</div>
```

#### Implementation Notes
- Add `AlertTriangle` to existing imports
- Maintain existing styling classes
- Add `flex items-center gap-2` for proper spacing
- Icon size matches text-sm (14px)

---

### 5. CreatorAdminSimple - LIVE Indicator

**File:** `components/CreatorAdminSimple.tsx`  
**Line:** 168  
**Priority:** HIGH  
**Context:** Live streaming badge indicator

| Attribute | Value |
|-----------|-------|
| Emoji | 🔴 |
| Replacement | Radio icon |
| Import Required | No (already imported) |
| Current Imports | `import { X, Loader2, AlertCircle, CheckCircle, Video, Mic, Volume2, VolumeX, Shield, Edit2, Gift, ArrowLeft } from 'lucide-react';` |
| Size | text-xs (12px) |
| Color | White text on red background |

#### Before Code
```tsx
<div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
   🔴 LIVE
</div>
```

#### After Code
```tsx
<div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-1">
   <Radio size={12} fill="currentColor" className="animate-pulse" />
   LIVE
</div>
```

#### Implementation Notes
- Add `Radio` to existing imports
- Use `fill="currentColor"` for filled appearance
- Maintain existing styling classes
- Add `flex items-center gap-1` for proper spacing

---

### 6. CreatorAdminMinimal - LIVE Indicator

**File:** `components/CreatorAdminMinimal.tsx`  
**Line:** 264  
**Priority:** HIGH  
**Context:** Live streaming badge indicator

| Attribute | Value |
|-----------|-------|
| Emoji | 🔴 |
| Replacement | Radio icon |
| Import Required | No (already imported) |
| Current Imports | `import { X, Loader2, AlertCircle, CheckCircle, Video, Mic, Volume2, VolumeX, Shield, Edit2, Gift, ArrowLeft } from 'lucide-react';` |
| Size | text-xs (12px) |
| Color | White text on red background |

#### Before Code
```tsx
<div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
   🔴 LIVE
</div>
```

#### After Code
```tsx
<div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-1">
   <Radio size={12} fill="currentColor" className="animate-pulse" />
   LIVE
</div>
```

#### Implementation Notes
- Add `Radio` to existing imports
- Use `fill="currentColor"` for filled appearance
- Maintain existing styling classes
- Add `flex items-center gap-1` for proper spacing

---

### 7. WalletModal - Document Icon

**File:** `components/WalletModal.tsx`  
**Line:** 116  
**Priority:** HIGH  
**Context:** Wallet signing step indicator

| Attribute | Value |
|-----------|-------|
| Emoji | 📝 |
| Replacement | FileText icon |
| Import Required | Yes |
| Current Imports | `import { X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';` |
| Size | text-3xl (30px) |
| Color | Default (inherits from parent) |

#### Before Code
```tsx
<div className="relative w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center animate-pulse">
   <div className="text-3xl">📝</div>
</div>
```

#### After Code
```tsx
<div className="relative w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center animate-pulse">
   <FileText size={30} />
</div>
```

#### Implementation Notes
- Add `FileText` to imports
- Size matches text-3xl (30px)
- Maintain existing styling classes
- No additional styling needed

---

### 8. NotFound - Dog with Question Mark

**File:** `pages/NotFound.tsx`  
**Line:** 25  
**Priority:** HIGH  
**Context:** 404 error page illustration

| Attribute | Value |
|-----------|-------|
| Emoji | 🐶❓ |
| Replacement | DogIcon + HelpCircle icons |
| Import Required | Yes (DogIcon is custom, HelpCircle exists) |
| Current Imports | `import { AlertTriangle, Home, Search } from 'lucide-react';` |
| Size | text-6xl (48px) for dog, smaller for question mark |
| Color | Default (inherits from parent) |

#### Before Code
```tsx
<div className="relative bg-[#0A0A0A] border border-white/10 rounded-[2rem] p-8 shadow-2xl flex items-center justify-center w-40 h-40 mx-auto">
   <span className="text-6xl">🐶❓</span>
</div>
```

#### After Code
```tsx
<div className="relative bg-[#0A0A0A] border border-white/10 rounded-[2rem] p-8 shadow-2xl flex items-center justify-center w-40 h-40 mx-auto">
   <div className="relative">
      <DogIcon size={48} />
      <HelpCircle size={20} className="absolute -top-2 -right-2 text-doge" />
   </div>
</div>
```

#### Implementation Notes
- Add `HelpCircle` to imports
- Must create custom DogIcon component first
- Position HelpCircle absolutely in top-right corner
- Use `text-doge` for brand color on question mark
- Dog size matches text-6xl (48px)

---

### 9. Admin - Checkmark

**File:** `pages/Admin.tsx`  
**Line:** 58  
**Priority:** HIGH  
**Context:** Admin wallet detected success message

| Attribute | Value |
|-----------|-------|
| Emoji | ✓ |
| Replacement | CheckCircle icon |
| Import Required | Yes |
| Current Imports | `import { Shield, AlertTriangle } from 'lucide-react';` |
| Size | text-sm (14px) |
| Color | Green-400 |

#### Before Code
```tsx
<div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
   <p className="text-sm text-green-400">✓ Admin wallet detected: {userAddress}</p>
</div>
```

#### After Code
```tsx
<div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
   <p className="text-sm text-green-400 flex items-center gap-2">
      <CheckCircle size={14} />
      Admin wallet detected: {userAddress}
   </p>
</div>
```

#### Implementation Notes
- Add `CheckCircle` to imports
- Maintain existing styling classes
- Add `flex items-center gap-2` for proper spacing
- Icon size matches text-sm (14px)

---

### 10. CreatorAdmin - Bar Chart

**File:** `components/CreatorAdmin.tsx`  
**Line:** 843  
**Priority:** HIGH  
**Context:** Debug audio levels button

| Attribute | Value |
|-----------|-------|
| Emoji | 📊 |
| Replacement | BarChart3 icon |
| Import Required | Yes |
| Current Imports | `import { Shield, Lock, Flame, Check, Edit2, Globe, Twitter, Send, Gift, Users, Shuffle, Video, Monitor, ArrowLeft, Award, Rocket, MessageCircle, Volume2, VolumeX, Mic, MicOff, Headphones, Settings } from 'lucide-react';` |
| Size | text-xs (12px) |
| Color: Default (inherits from button) |

#### Before Code
```tsx
<button
   onClick={() => {
     // ... debug logic
   }}
   className="w-full px-3 py-2 text-xs bg-gray-800 text-gray-300 hover:bg-gray-700 rounded border border-gray-600 hover:border-gray-500 transition-colors"
>
   📊 Debug Audio Levels (Check Console)
</button>
```

#### After Code
```tsx
<button
   onClick={() => {
     // ... debug logic
   }}
   className="w-full px-3 py-2 text-xs bg-gray-800 text-gray-300 hover:bg-gray-700 rounded border border-gray-600 hover:border-gray-500 transition-colors flex items-center justify-center gap-2"
>
   <BarChart3 size={12} />
   Debug Audio Levels (Check Console)
</button>
```

#### Implementation Notes
- Add `BarChart3` to imports
- Maintain existing styling classes
- Add `flex items-center justify-center gap-2` for proper spacing
- Icon size matches text-xs (12px)

---

### 11. CreatorAdmin - Speaker

**File:** `components/CreatorAdmin.tsx`  
**Line:** 996  
**Priority:** HIGH  
**Context:** Test tone button

| Attribute | Value |
|-----------|-------|
| Emoji | 🔊 |
| Replacement | Volume2 icon |
| Import Required | No (already imported) |
| Current Imports | `import { Shield, Lock, Flame, Check, Edit2, Globe, Twitter, Send, Gift, Users, Shuffle, Video, Monitor, ArrowLeft, Award, Rocket, MessageCircle, Volume2, VolumeX, Mic, MicOff, Headphones, Settings } from 'lucide-react';` |
| Size | text-xs (12px) |
| Color | Default (inherits from button) |

#### Before Code
```tsx
<button
   onClick={async () => {
     // ... test tone logic
   }}
   className="w-full px-3 py-2 text-xs bg-green-800 text-green-300 hover:bg-green-700 rounded border border-green-600 hover:border-green-500 transition-colors"
>
   🔊 Play Test Tone (Verify Audio Monitoring)
</button>
```

#### After Code
```tsx
<button
   onClick={async () => {
     // ... test tone logic
   }}
   className="w-full px-3 py-2 text-xs bg-green-800 text-green-300 hover:bg-green-700 rounded border border-green-600 hover:border-green-500 transition-colors flex items-center justify-center gap-2"
>
   <Volume2 size={12} />
   Play Test Tone (Verify Audio Monitoring)
</button>
```

#### Implementation Notes
- `Volume2` already imported
- Maintain existing styling classes
- Add `flex items-center justify-center gap-2` for proper spacing
- Icon size matches text-xs (12px)

---

### 12. CreatorAdmin - Clipboard

**File:** `components/CreatorAdmin.tsx`  
**Line:** 1006  
**Priority:** HIGH  
**Context:** System audio setup guide button

| Attribute | Value |
|-----------|-------|
| Emoji | 📋 |
| Replacement | FileText icon |
| Import Required | Yes |
| Current Imports | `import { Shield, Lock, Flame, Check, Edit2, Globe, Twitter, Send, Gift, Users, Shuffle, Video, Monitor, ArrowLeft, Award, Rocket, MessageCircle, Volume2, VolumeX, Mic, MicOff, Headphones, Settings } from 'lucide-react';` |
| Size | text-xs (12px) |
| Color | Default (inherits from button) |

#### Before Code
```tsx
<button
   onClick={showSystemAudioSetupGuide}
   className="w-full px-3 py-2 text-xs bg-blue-800 text-blue-300 hover:bg-blue-700 rounded border border-blue-600 hover:border-blue-500 transition-colors"
>
   📋 System Audio Setup Guide
</button>
```

#### After Code
```tsx
<button
   onClick={showSystemAudioSetupGuide}
   className="w-full px-3 py-2 text-xs bg-blue-800 text-blue-300 hover:bg-blue-700 rounded border border-blue-600 hover:border-blue-500 transition-colors flex items-center justify-center gap-2"
>
   <FileText size={12} />
   System Audio Setup Guide
</button>
```

#### Implementation Notes
- Add `FileText` to imports
- Maintain existing styling classes
- Add `flex items-center justify-center gap-2` for proper spacing
- Icon size matches text-xs (12px)

---

## Low Priority Replacements

### Console Log Emojis - Remove All

**Priority:** LOW  
**Action:** Remove emojis from all console.log statements  
**Rationale:** Console logs are for debugging only and not visible to users

#### Files and Lines

**PersistentCameraStream.tsx:**
- Line 89: `console.error('❌ Failed to start stream:', err);`

**CameraStream.tsx:**
- Line 30: `console.log('🛑 Stopping stream...', reason ? \`Reason: ${reason}\` : '');`
- Line 32: `console.trace('📍 Stack trace for stopStream call:');`
- Line 38: `console.log(\`⏹️ Stopping ${track.kind} track: ${track.label}\`);`
- Line 51: `console.log('✅ Stream stopped');`
- Line 57: `console.log('⚠️ Stream already starting, ignoring duplicate call');`
- Line 64: `console.log('🚀 Starting camera + mic stream...');`
- Line 69: `console.log('🛑 Stopping existing stream before starting new one...');`
- Line 73: `console.log('📹 Requesting camera + mic with simple constraints...');`
- Line 85: `console.log('✅ Stream obtained:', { ... });`
- Line 92: `console.log(\`🎥 ${track.kind} track:\`, { ... });`
- Line 107: `console.log('📺 Assigning stream to video element...');`
- Line 121: `console.log('🎬 Stream assigned, waiting for video to load...');`
- Line 125: `console.log('📹 Video metadata loaded:', { ... });`
- Line 138: `console.log('✅ Valid video dimensions:', { width, height });`
- Line 142: `console.log('✅ Video playback started');`
- Line 147: `console.error('❌ Video play failed:', e);`
- Line 152: `console.error('❌ Invalid video dimensions:', { width, height });`
- Line 160: `console.error('❌ Video element error:', e);`
- Line 184: `console.error('❌ Stream acquisition failed:', err);`

**CreatorAdminMinimal.tsx:**
- Line 14: `console.log('🎬 CreatorAdminMinimal rendered, isLive:', isLive);`
- Line 24: `console.log('🛑 Stopping stream...');`
- Line 28: `console.log('⏹️ Stopping track:', track.kind, track.label);`
- Line 40: `console.log('✅ Stream stopped');`
- Line 46: `console.log('🚀 Starting camera + mic stream...');`
- Line 52: `console.log('📹 Requesting camera + mic...');`
- Line 65: `console.log('✅ Stream obtained:', { ... });`
- Line 72: `console.log(\`🎥 ${track.kind} track:\`, { ... });`
- Line 86: `console.log('📺 Assigning stream to video element...');`
- Line 97: `console.log('🎬 Stream assigned, waiting for metadata...');`
- Line 101: `console.log('📹 Video metadata loaded:', { ... });`
- Line 113: `console.log('✅ Valid video dimensions:', { width, height });`
- Line 117: `console.log('✅ Video playback started');`
- Line 121: `console.error('❌ Video play failed:', e);`
- Line 125: `console.error('❌ Invalid video dimensions:', { width, height });`
- Line 132: `console.error('❌ Video element error:', e);`
- Line 141: `console.error('❌ Stream acquisition failed:', err);`

**CreatorAdmin.tsx:**
- Line 66: `console.log('Microphone enabled:', newMicStream.getAudioTracks().length, 'tracks');`
- Line 74: `console.log('Microphone disabled');`
- Line 76: `console.error('Microphone toggle error:', error);`
- Line 91: `console.log('Available audio inputs:', audioInputs.map(d => ({ label: d.label, deviceId: d.deviceId })));`
- Line 104: `console.log('Found system audio device:', systemDevice.label);`
- Line 118: `console.log('System audio enabled via device:', systemDevice.label);`
- Line 145: `console.log('System audio enabled via screen share');`
- Line 164: `console.log('System audio disabled');`
- Line 168: `console.error('System audio toggle error:', error);`
- Line 213: `console.log('System Audio Setup Guide:', guideMessage);`
- Line 219: `console.log(\`Setting up ${type} audio analyser...\`);`
- Line 224: `console.error(\`No audio tracks found in ${type} stream\`);`
- Line 228: `console.log(\`${type} stream has ${audioTracks.length} audio tracks\`);`
- Line 237: `console.log('Audio context resumed');`
- Line 254: `console.log(\`${type} audio analyser setup complete. Audio context state:\`, audioContextRef.current.state);`
- Line 259: `console.error(\`Failed to setup ${type} audio analyser:\`, error);`
- Line 294: `console.log('Mic audio monitoring debug:', { ... });`
- Line 322: `console.log(\`${type} stream ended, stopping monitoring\`);`
- Line 330: `console.error(\`Error monitoring ${type} audio level:\`, error);`
- Line 837: `console.log('=== AUDIO DEBUG INFO ===');`
- Line 838: `console.table(debugInfo);`
- Line 851: `console.log('🔵 Production test tone button clicked');`
- Line 861: `console.log('🔵 Audio context initialized:', audioContext.state);`
- Line 877: `console.log('🔵 Audio nodes connected successfully');`
- Line 936: `console.log('🔵 Production test tone levels:', { ... });`
- Line 955: `console.log('🔵 Real test tone playing for 1 second');`
- Line 978: `console.log('🔵 Real test tone completed');`
- Line 987: `console.log('🔵 Test tone playing! Check the audio level meter for visual feedback.');`
- Line 990: `console.error('🔴 Failed to play real test tone:', error);`

**StoreContext.tsx:**
- Multiple console.log statements with emojis (exact lines to be verified during implementation)

**streaming.ts:**
- Multiple console.log statements with emojis (exact lines to be verified during implementation)

#### Replacement Pattern

**Before:**
```tsx
console.log('🚀 Starting camera + mic stream...');
```

**After:**
```tsx
console.log('Starting camera + mic stream...');
```

#### Implementation Notes
- Simply remove all emojis from console.log statements
- Keep the log messages themselves
- No code structure changes needed
- This is a text-only replacement

---

## Custom Component Specifications

### DogIcon Component

**Purpose:** Replace the 🐶 emoji throughout the application with a branded dog icon that matches the DogePump aesthetic.

**File Location:** `components/DogIcon.tsx` (new file)

**Component Specification:**

```tsx
import React from 'react';
import { Dog } from 'lucide-react';

interface DogIconProps {
  size?: number;
  className?: string;
}

export const DogIcon: React.FC<DogIconProps> = ({ 
  size = 24, 
  className = '' 
}) => {
  return (
    <Dog 
      size={size} 
      className={className}
      fill="currentColor"
    />
  );
};
```

**Usage Examples:**

```tsx
// In PageLoader.tsx
<DogIcon size={24} className="text-doge" />

// In NotFound.tsx
<div className="relative">
  <DogIcon size={48} />
  <HelpCircle size={20} className="absolute -top-2 -right-2 text-doge" />
</div>
```

**Styling Notes:**
- Use the `text-doge` class for brand color
- The `fill="currentColor"` prop ensures the icon is filled
- Size should match the original emoji size
- Component is flexible and reusable across the application

**Import Statement:**
```tsx
import { DogIcon } from './DogIcon';
```

---

## Implementation Checklist

### Phase 1: Preparation
- [ ] Create custom DogIcon component
- [ ] Verify all lucide-react icons are available
- [ ] Test DogIcon component in isolation
- [ ] Create backup of all affected files

### Phase 2: High Priority Replacements
- [ ] PageLoader.tsx:11 - Replace 🐶 with DogIcon
- [ ] PersistentCameraStream.tsx:141 - Replace 🔴 LIVE with Radio icon
- [ ] CameraStream.tsx:333 - Replace 🔴 LIVE with Radio icon
- [ ] CameraStream.tsx:351 - Replace ⚠️ with AlertTriangle icon
- [ ] CreatorAdminSimple.tsx:168 - Replace 🔴 LIVE with Radio icon
- [ ] CreatorAdminMinimal.tsx:264 - Replace 🔴 LIVE with Radio icon
- [ ] WalletModal.tsx:116 - Replace 📝 with FileText icon
- [ ] NotFound.tsx:25 - Replace 🐶❓ with DogIcon + HelpCircle
- [ ] Admin.tsx:58 - Replace ✓ with CheckCircle icon
- [ ] CreatorAdmin.tsx:843 - Replace 📊 with BarChart3 icon
- [ ] CreatorAdmin.tsx:996 - Replace 🔊 with Volume2 icon
- [ ] CreatorAdmin.tsx:1006 - Replace 📋 with FileText icon

### Phase 3: Low Priority Replacements
- [ ] PersistentCameraStream.tsx:89 - Remove emoji from console.error
- [ ] CameraStream.tsx - Remove all emojis from console.log statements
- [ ] CreatorAdminMinimal.tsx - Remove all emojis from console.log statements
- [ ] CreatorAdmin.tsx - Remove all emojis from console.log statements
- [ ] StoreContext.tsx - Remove all emojis from console.log statements
- [ ] streaming.ts - Remove all emojis from console.log statements

### Phase 4: Testing
- [ ] Test PageLoader component
- [ ] Test all camera stream components
- [ ] Test wallet modal
- [ ] Test 404 page
- [ ] Test admin page
- [ ] Test creator admin component
- [ ] Verify console logs are clean
- [ ] Check for any remaining emojis in codebase
- [ ] Test responsive behavior of all icons
- [ ] Verify animations still work correctly
- [ ] Check accessibility (aria-labels, etc.)

### Phase 5: Documentation
- [ ] Update component documentation
- [ ] Update any design system documentation
- [ ] Document the DogIcon component
- [ ] Create migration guide for other developers
- [ ] Update README if needed

---

## Special Notes and Considerations

### Import Management

**Files requiring new imports:**

1. **PersistentCameraStream.tsx**
   - Add: `Radio`
   - Current: `import { X, Loader2, AlertCircle, Video, Mic, Volume2, VolumeX } from 'lucide-react';`
   - New: `import { X, Loader2, AlertCircle, Video, Mic, Volume2, VolumeX, Radio } from 'lucide-react';`

2. **CameraStream.tsx**
   - Add: `Radio`, `AlertTriangle`
   - Current: `import { X, Loader2, AlertCircle, CheckCircle, Video, Mic, Volume2, VolumeX } from 'lucide-react';`
   - New: `import { X, Loader2, AlertCircle, CheckCircle, Video, Mic, Volume2, VolumeX, Radio, AlertTriangle } from 'lucide-react';`

3. **CreatorAdminSimple.tsx**
   - Add: `Radio`
   - Current: `import { X, Loader2, AlertCircle, CheckCircle, Video, Mic, Volume2, VolumeX, Shield, Edit2, Gift, ArrowLeft } from 'lucide-react';`
   - New: `import { X, Loader2, AlertCircle, CheckCircle, Video, Mic, Volume2, VolumeX, Shield, Edit2, Gift, ArrowLeft, Radio } from 'lucide-react';`

4. **CreatorAdminMinimal.tsx**
   - Add: `Radio`
   - Current: `import { X, Loader2, AlertCircle, CheckCircle, Video, Mic, Volume2, VolumeX, Shield, Edit2, Gift, ArrowLeft } from 'lucide-react';`
   - New: `import { X, Loader2, AlertCircle, CheckCircle, Video, Mic, Volume2, VolumeX, Shield, Edit2, Gift, ArrowLeft, Radio } from 'lucide-react';`

5. **WalletModal.tsx**
   - Add: `FileText`
   - Current: `import { X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';`
   - New: `import { X, Loader2, AlertCircle, CheckCircle, FileText } from 'lucide-react';`

6. **NotFound.tsx**
   - Add: `HelpCircle`, `DogIcon` (custom)
   - Current: `import { AlertTriangle, Home, Search } from 'lucide-react';`
   - New: `import { AlertTriangle, Home, Search, HelpCircle } from 'lucide-react';`
   - Also add: `import { DogIcon } from '../components/DogIcon';`

7. **Admin.tsx**
   - Add: `CheckCircle`
   - Current: `import { Shield, AlertTriangle } from 'lucide-react';`
   - New: `import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';`

8. **CreatorAdmin.tsx**
   - Add: `BarChart3`, `FileText`
   - Current: `import { Shield, Lock, Flame, Check, Edit2, Globe, Twitter, Send, Gift, Users, Shuffle, Video, Monitor, ArrowLeft, Award, Rocket, MessageCircle, Volume2, VolumeX, Mic, MicOff, Headphones, Settings } from 'lucide-react';`
   - New: `import { Shield, Lock, Flame, Check, Edit2, Globe, Twitter, Send, Gift, Users, Shuffle, Video, Monitor, ArrowLeft, Award, Rocket, MessageCircle, Volume2, VolumeX, Mic, MicOff, Headphones, Settings, BarChart3, FileText } from 'lucide-react';`

### Styling Consistency

**Color Scheme:**
- Use `text-doge` for brand-related icons
- Use semantic colors for status icons (green for success, red for error, yellow for warning)
- Maintain existing color schemes in each component

**Size Guidelines:**
- Text-xs (12px) → `size={12}`
- Text-sm (14px) → `size={14}`
- Text-base (16px) → `size={16}`
- Text-lg (18px) → `size={18}`
- Text-xl (20px) → `size={20}`
- Text-2xl (24px) → `size={24}`
- Text-3xl (30px) → `size={30}`
- Text-6xl (48px) → `size={48}`

**Spacing:**
- Use `flex items-center gap-1` for tight spacing (12px gap)
- Use `flex items-center gap-2` for normal spacing (8px gap)
- Use `justify-center` for centering icons in buttons

### Accessibility Considerations

**Aria Labels:**
- Add `aria-label` to icon-only buttons
- Ensure screen readers announce the purpose of icons
- Example: `<Radio aria-label="Live indicator" />`

**Focus States:**
- Ensure all interactive icons have proper focus states
- Maintain keyboard navigation support

### Performance Considerations

**Tree Shaking:**
- All lucide-react icons support tree shaking
- Only import the icons you use
- No performance impact from adding new icons

**Bundle Size:**
- Lucide React icons are lightweight
- Estimated bundle size increase: < 5KB total
- Custom DogIcon component adds minimal overhead

### Browser Compatibility

**Lucide React:**
- Supported in all modern browsers
- Fallback to SVG if needed
- No polyfills required

**Emoji Rendering:**
- Icons render consistently across all browsers
- No platform-specific rendering differences
- Better accessibility than emojis

### Testing Strategy

**Visual Regression Testing:**
- Take screenshots before and after changes
- Compare visual appearance
- Ensure no layout shifts

**Functional Testing:**
- Test all interactive elements
- Verify animations still work
- Check responsive behavior

**Cross-Browser Testing:**
- Test in Chrome, Firefox, Safari, Edge
- Verify icon rendering
- Check mobile browsers

### Rollback Plan

**If issues arise:**
1. Revert to emoji version
2. Document the issue
3. Fix the problem
4. Re-apply the icon changes

**Version Control:**
- Commit changes in small batches
- Use descriptive commit messages
- Tag the emoji-to-icon migration

### Future Maintenance

**Icon Updates:**
- Lucide React icons are actively maintained
- Update package regularly
- Test icon changes in development

**Custom Icons:**
- Document any custom icons created
- Keep design system updated
- Share icon usage guidelines

---

## Appendix: Quick Reference

### Icon Mapping Summary

| Emoji | Icon | Component | Size | Color |
|-------|------|-----------|------|-------|
| 🐶 | Dog | DogIcon (custom) | 24px | text-doge |
| 🔴 | Radio | Radio | 12px | white on red bg |
| ⚠️ | AlertTriangle | AlertTriangle | 14px | yellow-400 |
| 📝 | FileText | FileText | 30px | default |
| 🐶❓ | Dog + HelpCircle | DogIcon + HelpCircle | 48px + 20px | text-doge |
| ✓ | CheckCircle | CheckCircle | 14px | green-400 |
| 📊 | BarChart3 | BarChart3 | 12px | default |
| 🔊 | Volume2 | Volume2 | 12px | default |
| 📋 | FileText | FileText | 12px | default |

### Files Summary

| File | High Priority | Low Priority | Total Changes |
|------|---------------|---------------|---------------|
| PageLoader.tsx | 1 | 0 | 1 |
| PersistentCameraStream.tsx | 1 | 1 | 2 |
| CameraStream.tsx | 2 | ~15 | ~17 |
| CreatorAdminSimple.tsx | 1 | 0 | 1 |
| CreatorAdminMinimal.tsx | 1 | ~15 | ~16 |
| WalletModal.tsx | 1 | 0 | 1 |
| NotFound.tsx | 1 | 0 | 1 |
| Admin.tsx | 1 | 0 | 1 |
| CreatorAdmin.tsx | 3 | ~20 | ~23 |
| StoreContext.tsx | 0 | TBD | TBD |
| streaming.ts | 0 | TBD | TBD |
| **TOTAL** | **12** | **~50** | **~62** |

---

## Conclusion

This mapping document provides a complete guide for replacing all emojis with Lucide React icons in the DogePump platform. The implementation is organized by priority, with detailed instructions for each replacement. Follow the implementation checklist to ensure all changes are completed systematically and tested thoroughly.

**Next Steps:**
1. Review this document with the team
2. Create the custom DogIcon component
3. Begin Phase 2 (High Priority Replacements)
4. Test each change as it's implemented
5. Complete Phase 3 (Low Priority Replacements)
6. Conduct comprehensive testing
7. Update documentation

**Estimated Implementation Time:** 2-3 hours for high priority, 1-2 hours for low priority, 1-2 hours for testing = **4-7 hours total**

---

**Document End**
