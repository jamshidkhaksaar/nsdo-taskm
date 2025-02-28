/**
 * Standardized background styles for the application
 * Based on the Dashboard background
 */

export const standardBackgroundStyle = {
  background: 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)',
  backgroundAttachment: 'fixed',
  backgroundSize: 'cover',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Ccircle cx='20' cy='20' r='1' fill='rgba(255,255,255,0.1)'/%3E%3Cpath d='M0 20h40M20 0v40' stroke='rgba(255,255,255,0.05)' stroke-width='0.5'/%3E%3C/svg%3E")`,
    backgroundSize: '40px 40px',
    opacity: 0.3,
    pointerEvents: 'none',
    zIndex: 0,
  },
};

/**
 * Version of the standard background style without the position property
 * Use this when you need to set your own position property
 */
export const standardBackgroundStyleNoPosition = {
  background: 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)',
  backgroundAttachment: 'fixed',
  backgroundSize: 'cover',
  '&::before': {
    content: '""',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Ccircle cx='20' cy='20' r='1' fill='rgba(255,255,255,0.1)'/%3E%3Cpath d='M0 20h40M20 0v40' stroke='rgba(255,255,255,0.05)' stroke-width='0.5'/%3E%3C/svg%3E")`,
    backgroundSize: '40px 40px',
    opacity: 0.3,
    pointerEvents: 'none',
    zIndex: 0,
  },
}; 