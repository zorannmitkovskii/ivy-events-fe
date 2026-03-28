export default {
  id: 'persian-wedding',
  name: 'Persian Wedding',

  // Template family - determines which hero/schedule/story components to use
  family: 'persian',

  // Colors
  palette: { accent: '#F9A8D4', secondary: '#C4B5FD', text: '#831843' },
  palettePresets: [
    { name: 'Bloom', colors: { accent: '#F9A8D4', secondary: '#C4B5FD', tertiary: '#6EE7B7', background: '#FFE5EC' } },
    { name: 'Sunset', colors: { accent: '#FCA5A5', secondary: '#FCD34D', tertiary: '#86EFAC', background: '#FFF7ED' } },
    { name: 'Sky', colors: { accent: '#93C5FD', secondary: '#A5B4FC', tertiary: '#6EE7B7', background: '#EFF6FF' } },
    { name: 'Royal', colors: { accent: '#D8B4FE', secondary: '#F9A8D4', tertiary: '#67E8F9', background: '#F5F3FF' } },
    { name: 'Tropical', colors: { accent: '#F0ABFC', secondary: '#FDE68A', tertiary: '#34D399', background: '#FDF4FF' } },
  ],

  // Fonts
  fonts: { heading: "'Playfair Display', serif", body: "'Lato', sans-serif" },
  fontUrls: [
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Lato:wght@400;500;600;700&display=swap',
  ],

  // Button/card defaults
  buttonStyle: { bg: '#F9A8D4', text: '#ffffff', radius: '8px' },
  cardStyle: { sectionBg: '#fff', cardBg: '#ffffff', cardShadow: 'subtle', cardRadius: '16px', cardBorder: '0px' },

  // Entry defaults
  entryType: 'door',
  entryDesign: 'red-curtain',

  // Root styling
  rootBg: '#FFE5EC',
  sectionBgAlt: '#fff',

  // Decorative elements
  decorations: [],

  // Default content for preview
  defaultConfig: {
    brideName: 'Билјана',
    groomName: 'Зоран',
    venue: 'Royal Persian Gardens',
    location: 'Isfahan, Iran',
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
