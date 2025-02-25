// This file provides a polyfill for the HTML5 drag-and-drop API
// to ensure compatibility with react-beautiful-dnd in React 18

// Polyfill for the dataTransfer object
if (typeof window !== 'undefined') {
  // Save the original addEventListener
  const originalAddEventListener = Element.prototype.addEventListener;
  
  // Override addEventListener to intercept dragstart events
  Element.prototype.addEventListener = function(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    if (type === 'dragstart') {
      const originalListener = listener;
      
      // Create a new listener that adds the dataTransfer object if it's missing
      const newListener = function(this: Element, event: Event) {
        if (event instanceof DragEvent && !event.dataTransfer) {
          Object.defineProperty(event, 'dataTransfer', {
            value: {
              setData: () => {},
              getData: () => '',
              effectAllowed: 'move',
              dropEffect: 'move',
              setDragImage: () => {},
              items: [],
              types: [],
              files: [],
              clearData: () => {}
            },
            configurable: true
          });
        }
        
        // Call the original listener
        if (typeof originalListener === 'function') {
          originalListener.call(this, event);
        } else if (originalListener && typeof originalListener.handleEvent === 'function') {
          originalListener.handleEvent(event);
        }
      };
      
      // Call the original addEventListener with our new listener
      return originalAddEventListener.call(this, type, newListener, options);
    }
    
    // For all other event types, call the original addEventListener
    return originalAddEventListener.call(this, type, listener, options);
  };
  
  // Ensure the document has a dragover event handler to allow dropping
  document.addEventListener('dragover', (event) => {
    if (event.preventDefault) {
      event.preventDefault();
    }
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    return false;
  });
}

export {}; 