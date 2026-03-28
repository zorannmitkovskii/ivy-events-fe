export default {
  id: 'parisian-wedding',
  name: 'Parisian Wedding',

  // Template family - determines which hero/schedule/story components to use
  family: 'parisian',

  // Colors
  palette: { accent: '#c59053', secondary: '#f2aeb1', text: '#1f2937' },
  palettePresets: [
    { name: 'Parisian', colors: { accent: '#c59053', secondary: '#f2aeb1', text: '#1f2937', background: '#fdf2f2' } },
    { name: 'Olive', colors: { accent: '#8a9a6b', secondary: '#c9d6b5', text: '#2d3b2d', background: '#f5f7f2' } },
    { name: 'Mauve', colors: { accent: '#a07085', secondary: '#d4b5c4', text: '#2d1f27', background: '#f9f3f6' } },
    { name: 'Sapphire', colors: { accent: '#4a6fa5', secondary: '#b5c7dc', text: '#1a2a3f', background: '#f0f4f8' } },
    { name: 'Rose Gold', colors: { accent: '#b76e79', secondary: '#e8c4c4', text: '#2d1a1a', background: '#faf2f0' } },
  ],

  // Fonts
  fonts: { heading: "'Playfair Display', serif", body: "'Cormorant Garamond', serif" },
  fontUrls: [
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap',
  ],

  // Button/card defaults
  buttonStyle: { bg: '#1f2937', text: '#ffffff', radius: '2px' },
  cardStyle: { sectionBg: '#fdf2f2', cardBg: '#ffffff', cardShadow: 'subtle', cardRadius: '4px', cardBorder: '1px' },

  // Entry defaults
  entryType: 'door',
  entryDesign: 'french-doors',

  // Root styling
  rootBg: '#fdf2f2',
  sectionBgAlt: '#fdf2f2',

  // Decorative elements
  decorations: [],

  // Default content for preview
  defaultConfig: {
    brideName: 'Сара',
    groomName: 'Филип',
    venue: 'Le Jardin des Tuileries',
    location: 'Paris, France',
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
