// Import all presets
import coastalBreeze from './coastal-breeze.js';
import parisianWedding from './parisian-wedding.js';
import persianWedding from './persian-wedding.js';
import elegantChateau from './elegant-chateau.js';
import modernCollage from './modern-collage.js';

export const DESIGN_PRESETS = {
  'coastal-breeze': coastalBreeze,
  'parisian-wedding': parisianWedding,
  'persian-wedding': persianWedding,
  'elegant-chateau': elegantChateau,
  'modern-collage': modernCollage,
};

export const DESIGN_LIST = Object.values(DESIGN_PRESETS);
export default DESIGN_PRESETS;
