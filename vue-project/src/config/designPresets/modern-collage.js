export default {
  id: 'modern-collage',
  name: 'Modern Collage',

  // Template family - determines which hero/schedule/story components to use
  family: 'collage',

  // Colors
  palette: { accent: '#f43f5e', secondary: '#e7e5e4', text: '#292524' },
  palettePresets: [
    { name: 'Rose', colors: { accent: '#f43f5e', text: '#292524', background: '#fafaf9' } },
    { name: 'Ocean', colors: { accent: '#3b82f6', text: '#1e293b', background: '#f8fafc' } },
    { name: 'Emerald', colors: { accent: '#10b981', text: '#1a2e35', background: '#f0fdf4' } },
    { name: 'Violet', colors: { accent: '#8b5cf6', text: '#1e1b4b', background: '#faf5ff' } },
    { name: 'Amber', colors: { accent: '#f59e0b', text: '#422006', background: '#fffbeb' } },
  ],

  // Fonts
  fonts: { heading: "'Playfair Display', serif", body: "'Lato', sans-serif" },
  fontUrls: [
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Lato:wght@400;500;600;700&display=swap',
  ],

  // Button/card defaults
  buttonStyle: { bg: '#1f2937', text: '#ffffff', radius: '8px' },
  cardStyle: { sectionBg: '#f9fafb', cardBg: '#ffffff', cardShadow: 'subtle', cardRadius: '24px', cardBorder: '0px' },

  // Entry defaults
  entryType: 'envelop',
  entryDesign: 'blue-red-seal',

  // Root styling
  rootBg: '#fafaf9',
  sectionBgAlt: '#f9fafb',

  // Decorative elements
  decorations: [],

  // Default content for preview
  defaultConfig: {
    brideName: 'Билјана',
    groomName: 'Зоран',
    venue: 'The Modern Loft',
    location: 'New York, NY',
    heroPhotoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=1200&fit=crop',
  },
};
