import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['selector', '.night'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'border-primary': 'var(--border-primary)',
        'border-secondary': 'var(--border-secondary)',
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-tertiary': 'var(--accent-tertiary)',
        vf: {
          bg: 'var(--vf-bg)',
          'bg-subtle': 'var(--vf-bg-subtle)',
          surface: 'var(--vf-surface)',
          'surface-2': 'var(--vf-surface-2)',
          'surface-3': 'var(--vf-surface-3)',
          border: 'var(--vf-border)',
          'border-strong': 'var(--vf-border-strong)',
          text: 'var(--vf-text)',
          muted: 'var(--vf-text-muted)',
          subtle: 'var(--vf-text-subtle)',
          accent: 'var(--vf-accent)',
          success: 'var(--vf-success)',
          warning: 'var(--vf-warning)',
          info: 'var(--vf-info)',
          terracotta: '#c2410c',
          sage: '#6b7d5e',
          clay: '#b8856b',
          olive: '#7a8451',
          sand: '#d4c4a8',
          emerald: '#10b981',
          indigo: '#6366f1',
        },
      },
      borderRadius: {
        'vf-sm': 'calc(var(--radius) - 4px)',
        'vf-md': 'calc(var(--radius) - 2px)',
        'vf-lg': 'var(--radius)',
        'vf-xl': 'calc(var(--radius) + 4px)',
      },
    },
  },
  plugins: [],
};
export default config;
