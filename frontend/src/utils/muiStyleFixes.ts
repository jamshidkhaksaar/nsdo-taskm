/**
 * MUI Style Naming Fixes
 * 
 * This utility provides helper functions to fix the MUI class name issues
 * encountered in the application. MUI v5 uses a different naming convention
 * than previous versions, and this helper ensures compatibility.
 */

// Map of incorrect class names to correct MUI v5 class names
const classNameMapping: Record<string, string> = {
  // Select component corrections
  // 'MuiSelect-select': 'MuiSelect-select', // Removed redundant
  'MuiSelectSelect': 'MuiSelect-select',
  
  // Input/FormHelperText corrections
  // 'MuiInputAdornment-root': 'MuiInputAdornment-root', // Removed redundant
  'MuiInputAdornmentRoot': 'MuiInputAdornment-root',
  // 'MuiFormHelperText-root': 'MuiFormHelperText-root', // Removed redundant
  'MuiFormHelperTextRoot': 'MuiFormHelperText-root',
  
  // Icon corrections
  // 'MuiSvgIcon-root': 'MuiSvgIcon-root', // Removed redundant
  'MuiSvgIconRoot': 'MuiSvgIcon-root',
  
  // Focus state corrections
  // 'Mui-focused': 'Mui-focused', // Removed redundant
  'MuiFocused': 'Mui-focused'
};

/**
 * Fixes MUI class names in styles by converting old/incorrect formats to the proper MUI v5 format
 * 
 * @param styles Object containing style definitions
 * @returns Corrected style object
 */
export const correctMuiClassNames = (styles: Record<string, any>): Record<string, any> => {
  const correctedStyles: Record<string, any> = {};
  
  // Process each style rule
  for (const key in styles) {
    // Check if the key contains a problematic class name
    let correctedKey = key;
    
    Object.entries(classNameMapping).forEach(([incorrect, correct]) => {
      // Use regex to match class names that might be combined with other selectors
      correctedKey = correctedKey.replace(
        new RegExp(`\\b${incorrect}\\b`, 'g'), 
        correct
      );
    });
    
    // Process nested styles recursively if value is an object
    const value = styles[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      correctedStyles[correctedKey] = correctMuiClassNames(value);
    } else {
      correctedStyles[correctedKey] = value;
    }
  }
  
  return correctedStyles;
};

/**
 * Helper function to create MUI styles with proper class naming
 * 
 * @param styles Style object to fix
 * @returns Corrected style object
 */
export const createMuiStyles = (styles: Record<string, any>): Record<string, any> => {
  return correctMuiClassNames(styles);
};

export default createMuiStyles; 