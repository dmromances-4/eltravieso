import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'
.
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        electric: {
          yellow: '#FFCC00',
          blue: '#00A3E0',
          red: '#EF2A2A'
        },
        night: '#0F0F0F',
        charcoal: '#141414',
        steel: '#272727',
        smoke: '#B7B7B7'
      },
      boxShadow: {
        neon: '0 0 0 1px rgba(255,204,0,0.16), 0 24px 60px rgba(0,0,0,0.45)'
      },
      fontFamily: {
        sans: ['Satoshi', 'Montserrat', 'ui-sans-serif', 'system-ui'],
        display: ['Genoir', 'ui-serif', 'Georgia']
      }
    }
  },
  plugins: [typography]
}

export default config
