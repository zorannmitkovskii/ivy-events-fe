export default {
  id: 'editorial',
  name: 'Editorial',

  family: 'editorial',

  palette: { accent: '#94a3b8', secondary: '#e2e8f0', text: '#0f172a' },
  palettePresets: [
    { name: 'Editorial', colors: { accent: '#94a3b8', secondary: '#e2e8f0', text: '#0f172a' } },
    { name: 'Ink', colors: { accent: '#64748b', secondary: '#cbd5e1', text: '#020617' } },
    { name: 'Graphite', colors: { accent: '#78716c', secondary: '#d6d3d1', text: '#1c1917' } },
    { name: 'Blush', colors: { accent: '#fda4af', secondary: '#fecdd3', text: '#1f2937' } },
    { name: 'Sage', colors: { accent: '#86efac', secondary: '#bbf7d0', text: '#14532d' } },
  ],

  fonts: { heading: "'Playfair Display', serif", body: "'Lato', sans-serif" },
  fontUrls: [
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Lato:wght@400;500;600;700&display=swap',
  ],

  buttonStyle: { bg: '#94a3b8', text: '#ffffff', radius: '2px' },
  cardStyle: { sectionBg: '#fafaf9', cardBg: '#ffffff', cardShadow: 'subtle', cardRadius: '4px', cardBorder: '0px' },

  entryType: 'door',
  entryDesign: 'white-doors',

  rootBg: '#fafaf9',
  sectionBgAlt: '#ffffff',

  decorations: [],

  defaultConfig: {
    brideName: 'Билјана',
    groomName: 'Зоран',
    venue: 'The Garden Estate',
    location: 'Skopje, Macedonia',
    heroPhotoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=1000&fit=crop',
  },
};
