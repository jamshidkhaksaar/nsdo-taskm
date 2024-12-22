import { Theme } from '@mui/material';
import { createAutoSpacing } from '../utils/spacing';

declare module '@mui/material/styles' {
  interface Theme {
    layoutSpacing: {
      createGridSpacing: (density?: 'compact' | 'normal' | 'comfortable') => Record<string, number>;
      createContainerPadding: (density?: 'compact' | 'normal' | 'comfortable') => Record<string, any>;
    };
  }
}

export const layoutSpacing = (theme: Theme) => ({
  layoutSpacing: {
    createGridSpacing: createAutoSpacing(theme).createGridSpacing,
    createContainerPadding: createAutoSpacing(theme).createContainerPadding,
  },
});

// Create a spacing scale
export const SPACING_SCALE = {
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 5,
} as const;

// Define flex ratios
export const FLEX_RATIOS = {
  taskSection: {
    xs: '1 0 0',
    sm: '3 0 0',
    md: '3 0 0',
  },
  assignedSection: {
    xs: '1 0 0',
    sm: '2 0 0',
    md: '2 0 0',
  },
} as const;