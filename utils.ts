

/**
 * Sanitize user input to prevent XSS attacks
 * Escapes HTML special characters
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validate and sanitize search query
 */
export function validateSearchQuery(query: string): { valid: boolean; sanitized: string; error?: string } {
  if (!query) return { valid: true, sanitized: '' };

  // Check length
  if (query.length > 100) {
    return { valid: false, sanitized: '', error: 'Search query too long' };
  }

  // Sanitize input
  const sanitized = sanitizeInput(query.trim());

  return { valid: true, sanitized };
}

/**
 * Human-friendly number formatter that avoids scientific notation.
 * - Defaults to 4 decimal places for values >= 1, 6 for sub-unit values.
 * - Falls back to the original value if parsing fails.
 */
export function formatNumber(
  value: string | number,
  options?: { maximumFractionDigits?: number; minimumFractionDigits?: number }
): string {
  if (value === undefined || value === null || value === '') return '0';

  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return String(value);

  const abs = Math.abs(num);
  const maximumFractionDigits =
    options?.maximumFractionDigits ?? (abs >= 1 ? 4 : 6);

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
  }).format(num);
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  if (seconds < 10) return "just now";
  return Math.floor(seconds) + "s ago";
}

export const compressImage = (base64Str: string, maxWidth = 300, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width *= maxWidth / height;
          height = maxWidth;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str); // Fail safe
        return;
      }
      
      // Draw white background (for transparent PNGs converting to JPEG)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Compress to JPEG
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
  });
};

export const generateShareCard = async (token: any): Promise<string | null> => {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. Background (Dark Gradient + Noise)
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, '#050505');
  gradient.addColorStop(1, '#1a1a1a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);

  // Add subtle accent glow
  const glow = ctx.createRadialGradient(1000, 100, 0, 1000, 100, 600);
  glow.addColorStop(0, 'rgba(212, 175, 55, 0.15)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1200, 630);

  // 2. Token Image
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = token.imageUrl;
  
  await new Promise((resolve) => {
    img.onload = resolve;
    img.onerror = resolve; // Continue even if image fails
  });

  // Circular Mask for Token Image
  ctx.save();
  ctx.beginPath();
  ctx.arc(280, 315, 180, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, 100, 135, 360, 360);
  ctx.restore();
  
  // Image Border
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#D4AF37'; // Gold
  ctx.beginPath();
  ctx.arc(280, 315, 180, 0, Math.PI * 2);
  ctx.stroke();

  // 3. Text Info
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 80px "Comic Neue", "Comic Sans MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(token.name, 540, 200);

  ctx.fillStyle = '#D4AF37'; // Gold
  ctx.font = 'bold 50px "Comic Neue", "Comic Sans MS", sans-serif';
  ctx.fillText(`$${token.ticker}`, 540, 280);

  // Stats
  if (token.pnl !== undefined) {
      // PnL Mode
      ctx.fillStyle = '#888888';
      ctx.font = 'bold 30px Inter, sans-serif';
      ctx.fillText('RETURN ON INVESTMENT', 540, 380);
      
      const pnl = token.pnl;
      ctx.fillStyle = pnl >= 0 ? '#00E054' : '#FF3B30';
      ctx.font = 'bold 80px monospace';
      ctx.fillText(`${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%`, 540, 460);
  } else {
      // General Mode
      ctx.fillStyle = '#888888';
      ctx.font = 'bold 30px Inter, sans-serif';
      ctx.fillText('MARKET CAP', 540, 380);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 40px monospace';
      const formattedMC = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(token.marketCap);
      ctx.fillText(formattedMC, 540, 430);

      ctx.fillStyle = '#888888';
      ctx.fillText('BONDING CURVE', 840, 380);
      
      ctx.fillStyle = token.progress >= 100 ? '#00E054' : '#D4AF37';
      ctx.font = 'bold 40px monospace';
      ctx.fillText(`${token.progress.toFixed(2)}%`, 840, 430);
  }

  // 5. Footer / Branding
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 550, 1200, 80);
  
  // Site Name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 30px "Comic Neue", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('DogePump', 1150, 600);
  
  // URL
  ctx.fillStyle = '#666';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('dogepump.fun', 1150, 560);
  
  // Logo Circle (Left)
  ctx.beginPath();
  ctx.arc(60, 590, 20, 0, 2 * Math.PI); 
  ctx.fillStyle = '#D4AF37';
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Ð', 60, 598);

  ctx.fillStyle = '#888';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Fair Launch Protocol', 90, 595);

  return canvas.toDataURL('image/png');
};

export const downloadCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(value => {
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma
      return `"${stringValue.replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const ADJECTIVES = ['Doge', 'Based', 'Moon', 'Safe', 'Cyber', 'Super', 'Rich', 'Fast', 'Golden', 'Diamond', 'Crypto', 'Space', 'Meta', 'Alpha', 'Chad', 'Degen'];
const NOUNS = ['Inu', 'Whale', 'Sniper', 'Hands', 'Ape', 'Elon', 'Dev', 'Hodler', 'Bull', 'Bear', 'Rocket', 'Coin', 'Gem', 'Knight', 'Wizard', 'Viking'];

export const generatePseudonym = (address: string): string => {
  if (!address || address.length < 10) return 'AnonDoge';
  
  // Use address characters to deterministically pick parts
  const sum = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const adjIndex = sum % ADJECTIVES.length;
  const nounIndex = (sum * 13) % NOUNS.length;
  const suffix = address.slice(-4).substring(0, 3);
  
  return `${ADJECTIVES[adjIndex]}${NOUNS[nounIndex]}${suffix}`;
};