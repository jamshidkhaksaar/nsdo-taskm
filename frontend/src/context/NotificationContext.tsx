import React, { createContext, useContext } from 'react';

interface NotificationContextType {
  handleNotificationBellClick: (event: React.MouseEvent<HTMLElement>) => void;
  // We can add more notification related states/handlers here if needed later
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ 
  children: React.ReactNode;
  value: NotificationContextType 
}> = ({ children, value }) => {
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 