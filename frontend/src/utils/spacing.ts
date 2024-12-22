import { Theme } from '@mui/material';

export const createAutoSpacing = (theme: Theme) => ({
  createGridSpacing: (density: 'compact' | 'normal' | 'comfortable' = 'normal') => {
    const baseSpacing = {
      compact: 0.5,
      normal: 1,
      comfortable: 1.5
    }[density];

    return {
      xs: theme.spacing(baseSpacing),
      sm: theme.spacing(baseSpacing * 1.5),
      md: theme.spacing(baseSpacing * 2),
      lg: theme.spacing(baseSpacing * 2.5),
      xl: theme.spacing(baseSpacing * 3),
    };
  },
  
  createContainerPadding: (density: 'compact' | 'normal' | 'comfortable' = 'normal') => {
    const basePadding = {
      compact: 1,
      normal: 2,
      comfortable: 3
    }[density];

    return {
      px: {
        xs: theme.spacing(basePadding),
        sm: theme.spacing(basePadding * 1.5),
        md: theme.spacing(basePadding * 2),
      },
      py: {
        xs: theme.spacing(basePadding),
        sm: theme.spacing(basePadding * 1.5),
        md: theme.spacing(basePadding * 2),
      }
    };
  }
}); 