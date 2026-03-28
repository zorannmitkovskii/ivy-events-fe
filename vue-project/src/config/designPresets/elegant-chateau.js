export default {
  id: 'elegant-chateau',
  name: 'Elegant Chateau',

  // Template family - determines which hero/schedule/story components to use
  family: 'chateau',

  // Colors
  palette: { accent: '#9f8274', secondary: '#eaddd7', text: '#1a1a1a' },
  palettePresets: [
    { name: 'Mocha', colors: { accent: '#9f8274', secondary: '#eaddd7', text: '#1a1a1a', background: '#f9f8f6' } },
    { name: 'Sage', colors: { accent: '#6b8e6b', secondary: '#d4e4d4', text: '#1a2e1a', background: '#f5f9f5' } },
    { name: 'Navy', colors: { accent: '#b8860b', secondary: '#e6d5b8', text: '#1b2838', background: '#f8f6f0' } },
    { name: 'Slate', colors: { accent: '#6b8cae', secondary: '#d5e2ee', text: '#1a2838', background: '#f5f8fb' } },
    { name: 'Wine', colors: { accent: '#8b3a3a', secondary: '#e8d2d2', text: '#2d1515', background: '#faf5f5' } },
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
  entryType: 'door',
  entryDesign: 'baroque-doors',

  // Root styling
  rootBg: '#f9f8f6',
  sectionBgAlt: '#f9fafb',

  // Decorative elements
  decorations: [],

  // Default content for preview
  defaultConfig: {
    brideName: 'Сара',
    groomName: 'Филип',
    venue: 'Chateau de Versailles',
    location: 'Versailles, France',
    heroPhotoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=1200&fit=crop',
  },

  // Default section items (shown in edit mode when no data exists yet)
  defaultItems: {
    eventDetails: [
      { type: 'CHURCH', time: '16:00', eventDate: '' },
      { type: 'RECEPTION', time: '18:00', eventDate: '' },
    ],
    agenda: [
      { type: 'START_GROOM', time: '14:00' },
      { type: 'START_BRIDE', time: '14:30' },
      { type: 'CHURCH', time: '15:00' },
      { type: 'CEREMONY', time: '16:00' },
      { type: 'RECEPTION', time: '18:00' },
      { type: 'FIRST_DANCE', time: '20:00' },
    ],
    ourStory: [
      { type: 'HOW_WE_MET', description: 'Случајна средба во кафуле што го промени се.', storyDate: '', imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&h=400&fit=crop' },
      { type: 'FIRST_DATE', description: 'Пикник на заход на сонцето покрај езерото, разговор што траеше со часови.', storyDate: '', imageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&h=400&fit=crop' },
      { type: 'PROPOSAL', description: 'Под ѕвездите, прашање беше поставено и ветување дадено.', storyDate: '', imageUrl: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&h=400&fit=crop' },
    ],
  },
};
