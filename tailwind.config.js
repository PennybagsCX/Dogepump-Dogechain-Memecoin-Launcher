/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
        'tablet': '896px',
      },
      colors: {
        doge: {
          DEFAULT: '#9333EA', // Purple-600 (Dogechain Primary)
          light: '#A855F7',   // Purple-500
          dark: '#7E22CE',    // Purple-700
          bg: '#020202',      // True Void
          card: '#0A0A0A',    // Card BG
          border: '#222222',  // Subtle Border
          surface: '#141414', // Surface
          accent: '#FFD700',  // Pure Gold Accent
          success: '#00E054', // Terminal Green
          error: '#FF3B30',    // Terminal Red
          // High contrast colors for accessibility
          text: {
            primary: '#FFFFFF',    // Pure white for primary text
            secondary: '#E5E5E5', // Light gray for secondary text
            muted: '#A3A3A3',     // Darker gray for muted text
            disabled: '#737373',   // Even darker for disabled text
          }
        },
        gold: {
          DEFAULT: '#D4AF37', // Classic Doge Gold
          light: '#F4C430',
          dark: '#AA8C2C'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        comic: ['"Comic Neue"', 'cursive'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'shake': 'shake 0.5s ease-in-out',
        'expand': 'expand 0.3s ease-out',
        'collapse': 'collapse 0.3s ease-in',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', filter: 'blur(8px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        glow: {
          'from': { boxShadow: '0 0 10px -10px #9333EA' },
          'to': { boxShadow: '0 0 20px 5px rgba(147, 51, 234, 0.2)' }
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass': 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
        'glass-hover': 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
        'purple-sheen': 'linear-gradient(45deg, transparent 25%, rgba(147, 51, 234, 0.1) 50%, transparent 75%)',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      }
    }
  },
  plugins: [],
}
