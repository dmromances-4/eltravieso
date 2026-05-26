module.exports = {
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './lib/**/*.{ts,tsx,js,jsx}',
    './pages/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        'electric-yellow': '#FFCC00',
        'electric-blue': '#00A3E0',
        'strong-red': '#EF2A2A',
        night: '#0F0F0F',
        charcoal: '#141414',
        steel: '#272727',
        smoke: '#B7B7B7'
      },
      boxShadow: {
        neon: '0 0 0 1px rgba(255,204,0,0.16), 0 24px 60px rgba(0,0,0,0.45)'
      },
      fontFamily: {
        display: ['Genoir', 'ui-serif', 'Georgia', 'sans-serif'],
        body: ['Satoshi', 'Montserrat', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}
