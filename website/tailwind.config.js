/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#000000',
        ink: '#ffffff',
        muted: '#888888',
        neon: '#00ff41',
        'neon-dim': '#00cc34',
        panel: '#0a0a0a',
        'panel-2': '#101010',
        border: '#1a1a1a',
        'border-bright': '#262626',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 24px rgba(0, 255, 65, 0.35)',
        'neon-soft': '0 0 12px rgba(0, 255, 65, 0.18)',
        'neon-strong': '0 0 40px rgba(0, 255, 65, 0.55)',
        'panel': '0 1px 0 rgba(255,255,255,0.04) inset',
      },
      backgroundImage: {
        'radial-fade': 'radial-gradient(ellipse at center, transparent 0%, #000 75%)',
        'neon-glow': 'radial-gradient(ellipse at center, rgba(0,255,65,0.15) 0%, transparent 70%)',
      },
      keyframes: {
        gridShift: {
          from: { backgroundPosition: '0 0' },
          to: { backgroundPosition: '48px 48px' },
        },
        pulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      animation: {
        gridShift: 'gridShift 20s linear infinite',
        pulseSlow: 'pulse 3s ease-in-out infinite',
        scan: 'scan 8s linear infinite',
      },
    },
  },
  plugins: [],
};
