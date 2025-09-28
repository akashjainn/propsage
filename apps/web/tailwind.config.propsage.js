/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand colors from the logo
        primary: {
          50: '#f0fafe',
          100: '#ddf4fd',
          200: '#c1e9fb',
          300: '#96d8f7',
          400: '#64c0f1',
          500: '#22c7f5', // Main cyan
          600: '#1598c3',
          700: '#0f7a9e',
          800: '#135e7a',
          900: '#164f66',
          950: '#0b2f42',
        },
        secondary: {
          50: '#fef2f7',
          100: '#fee7f0',
          200: '#fecfe3',
          300: '#ffa7cb',
          400: '#fd70a7',
          500: '#f63d83', // Main hot pink
          600: '#e6226a',
          700: '#c21654',
          800: '#a01548',
          900: '#86153f',
          950: '#520820',
        },
        tertiary: {
          50: '#f4f1ff',
          100: '#ece6ff',
          200: '#dbd0ff',
          300: '#c0abff',
          400: '#a078ff',
          500: '#7e3dff', // Main purple
          600: '#7318f7',
          700: '#650ce3',
          800: '#530bbf',
          900: '#46099c',
          950: '#2a0069',
        },
        accent: {
          50: '#fff4ed',
          100: '#ffe6d5',
          200: '#feccaa',
          300: '#fdab74',
          400: '#fb803c',
          500: '#f96316', // Main coral
          600: '#ea470c',
          700: '#c2350c',
          800: '#9a2c12',
          900: '#7c2612',
          950: '#431007',
        },
        
        // Neutral colors (dark-first)
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },

        // App-specific surface colors
        background: '#0a0e16',
        surface: '#0f1724',
        'surface-hover': '#1a2332',
        border: '#1e293b',
        'border-strong': '#334155',

        // Text colors
        'text-primary': '#f1f5f9',
        'text-secondary': '#94a3b8',
        'text-muted': '#64748b',
        'text-inverse': '#0f172a',

        // Semantic colors
        success: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        info: {
          50: '#f0fafe',
          100: '#ddf4fd',
          200: '#c1e9fb',
          300: '#96d8f7',
          400: '#64c0f1',
          500: '#22c7f5', // Use primary cyan for info
          600: '#1598c3',
          700: '#0f7a9e',
          800: '#135e7a',
          900: '#164f66',
        },
      },

      // Background gradients
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #f63d83 0%, #f96316 25%, #7e3dff 60%, #22c7f5 100%)',
        'gradient-primary': 'linear-gradient(135deg, #64c0f1 0%, #1598c3 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #fd70a7 0%, #e6226a 100%)',
        'gradient-tertiary': 'linear-gradient(135deg, #a078ff 0%, #7318f7 100%)',
        'gradient-accent': 'linear-gradient(135deg, #fb803c 0%, #ea470c 100%)',
        'gradient-surface': 'radial-gradient(600px circle at 50% 50%, rgba(34, 199, 245, 0.03) 0%, rgba(126, 61, 255, 0.02) 40%, transparent 100%)',
      },

      // Box shadows
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'DEFAULT': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        'md': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        'lg': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
        'xl': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        'primary': '0 10px 15px -3px rgba(34, 199, 245, 0.2), 0 4px 6px -2px rgba(34, 199, 245, 0.1)',
        'secondary': '0 10px 15px -3px rgba(246, 61, 131, 0.2), 0 4px 6px -2px rgba(246, 61, 131, 0.1)',
        'brand-glow': '0 0 20px rgba(34, 199, 245, 0.3), 0 0 40px rgba(126, 61, 255, 0.2)',
      },

      // Animation keyframes
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(34, 199, 245, 0.3), 0 0 40px rgba(126, 61, 255, 0.2)' 
          },
          '50%': { 
            boxShadow: '0 0 30px rgba(34, 199, 245, 0.4), 0 0 60px rgba(126, 61, 255, 0.3)' 
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },

      // Animation utilities
      animation: {
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },

      // Typography
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [
    // Plugin for gradient text utilities
    function({ addUtilities }) {
      addUtilities({
        '.text-gradient-brand': {
          background: 'linear-gradient(135deg, #f63d83 0%, #f96316 25%, #7e3dff 60%, #22c7f5 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.text-gradient-primary': {
          background: 'linear-gradient(135deg, #64c0f1 0%, #1598c3 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.text-gradient-secondary': {
          background: 'linear-gradient(135deg, #fd70a7 0%, #e6226a 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.border-gradient-brand': {
          border: '2px solid transparent',
          background: 'linear-gradient(#0f1724, #0f1724) padding-box, linear-gradient(135deg, #f63d83 0%, #f96316 25%, #7e3dff 60%, #22c7f5 100%) border-box',
        },
      })
    },
  ],
}