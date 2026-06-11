import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'cafe-bg':           '#FFF8F0',
        'cafe-card':         '#FFFCF8',
        'cafe-input':        '#F5EDE0',
        'cafe-section':      '#FDF4E7',
        'cafe-border':       '#E8D5B7',
        'cafe-border-light': '#F0E4D0',
        'cafe-text':         '#2D1B0E',
        'cafe-text-2':       '#6B4C2A',
        'cafe-muted':        '#9C7A5A',
        'cafe-accent':       '#8B5E3C',
        'cafe-accent-dark':  '#6B4226',
        'cafe-accent-light': '#C4956A',
        'cafe-brown':        '#C4A882',
      },
    },
  },
  plugins: [],
} satisfies Config
