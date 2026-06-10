import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'
import { brandColors, brandRadii, brandShadows, surfaceColors } from './lib/theme/tokens'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        popover: 'var(--popover)',
        'popover-foreground': 'var(--popover-foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        destructive: 'var(--destructive)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        'chart-1': 'var(--chart-1)',
        'chart-2': 'var(--chart-2)',
        'chart-3': 'var(--chart-3)',
        'chart-4': 'var(--chart-4)',
        'chart-5': 'var(--chart-5)',
        sidebar: 'var(--sidebar)',
        'sidebar-foreground': 'var(--sidebar-foreground)',
        'sidebar-primary': 'var(--sidebar-primary)',
        'sidebar-primary-foreground': 'var(--sidebar-primary-foreground)',
        'sidebar-accent': 'var(--sidebar-accent)',
        'sidebar-accent-foreground': 'var(--sidebar-accent-foreground)',
        'sidebar-border': 'var(--sidebar-border)',
        'sidebar-ring': 'var(--sidebar-ring)',
        electric: {
          yellow: brandColors.yellow,
          blue: brandColors.blue,
          red: brandColors.red,
        },
        brand: {
          yellow: brandColors.yellow,
          blue: brandColors.blue,
          red: brandColors.red,
        },
        night: surfaceColors.night,
        charcoal: surfaceColors.charcoal,
        steel: surfaceColors.steel,
        smoke: surfaceColors.smoke,
      },
      outlineColor: {
        ring: 'var(--ring)',
      },
      borderRadius: {
        card: brandRadii.card,
        pill: brandRadii.pill,
      },
      boxShadow: {
        card: brandShadows.card,
        subtle: brandShadows.subtle,
        neon: '0 0 0 1px rgba(249,209,66,0.16), 0 24px 60px rgba(0,0,0,0.45)',
        'neon-glow': '0 0 20px rgba(249,209,66,0.3)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Montserrat', 'ui-sans-serif', 'system-ui'],
        display: ['var(--font-display)', 'Georgia', 'ui-serif'],
      }
    }
  },
  plugins: [typography]
}

export default config
