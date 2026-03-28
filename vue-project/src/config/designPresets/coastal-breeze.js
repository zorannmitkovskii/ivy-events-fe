export default {
  id: 'coastal-breeze',
  name: 'Coastal Breeze',

  // Template family - determines which hero/schedule/story components to use
  family: 'coastal',

  // Colors
  palette: { accent: '#bfdbfe', secondary: '#fda4af', text: '#1f2937' },
  palettePresets: [
    { name: 'Ocean', colors: { accent: '#bfdbfe', secondary: '#fda4af', text: '#1f2937' } },
    { name: 'Sage', colors: { accent: '#a7f3d0', secondary: '#fecaca', text: '#1c3a2e' } },
    { name: 'Lavender', colors: { accent: '#ddd6fe', secondary: '#fed7aa', text: '#2e1065' } },
    { name: 'Golden', colors: { accent: '#fde68a', secondary: '#fecdd3', text: '#451a03' } },
    { name: 'Mauve', colors: { accent: '#fbcfe8', secondary: '#c7d2fe', text: '#3b0764' } },
  ],

  // Fonts
  fonts: { heading: "'Cormorant Garamond', serif", body: "'Montserrat', sans-serif" },
  fontUrls: [
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap',
  ],

  // Button/card defaults
  buttonStyle: { bg: '#1f2937', text: '#ffffff', radius: '8px' },
  cardStyle: { sectionBg: '#f9fafb', cardBg: '#ffffff', cardShadow: 'subtle', cardRadius: '24px', cardBorder: '0px' },

  // Entry defaults
  entryType: 'envelop',
  entryDesign: 'white-gold-seal',

  // Root styling
  rootBg: '#fff',
  sectionBgAlt: '#f9fafb',

  // Decorative elements
  decorations: [],

  // Default content for preview
  defaultConfig: {
    brideName: 'Билјана',
    groomName: 'Зоран',
    venue: 'Seaside Garden Estate',
    location: 'Malibu, California',
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
