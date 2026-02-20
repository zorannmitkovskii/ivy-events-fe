export const OUR_STORY_FIELD_CONFIG = {
  'persian-wedding': {
    title:       { show: true,  required: true },
    type:        { show: true,  required: true },
    description: { show: true,  required: false },
    date:        { show: false },
    imageUrl:    { show: true,  required: false },
  },
  'parisian-wedding': {
    title:       { show: false },
    type:        { show: false },
    description: { show: true,  required: true, label: 'ourStory.form.paragraph' },
    date:        { show: false },
    imageUrl:    { show: false },
  },
  'coastal-breeze': {
    title:       { show: true,  required: true },
    type:        { show: false },
    description: { show: true,  required: false },
    date:        { show: true,  required: false },
    imageUrl:    { show: true,  required: true },
  },
  'sunset-glass': {
    title:       { show: true,  required: true },
    type:        { show: true,  required: true },
    description: { show: true,  required: false },
    date:        { show: false },
    imageUrl:    { show: true,  required: false },
  },
  'modern-collage': {
    title:       { show: true,  required: true },
    type:        { show: false },
    description: { show: true,  required: false },
    date:        { show: true,  required: false },
    imageUrl:    { show: true,  required: false },
  },
  'elegant-chateau': {
    title:       { show: true,  required: true },
    type:        { show: false },
    description: { show: true,  required: false },
    date:        { show: true,  required: false },
    imageUrl:    { show: true,  required: false },
  },
};

export const DEFAULT_FIELD_CONFIG = {
  title:       { show: true,  required: true },
  type:        { show: true,  required: true },
  description: { show: true,  required: false },
  date:        { show: false },
  imageUrl:    { show: false },
};
