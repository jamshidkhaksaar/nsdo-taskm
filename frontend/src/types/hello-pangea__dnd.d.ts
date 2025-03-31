declare module '@hello-pangea/dnd' {
  import * as React from 'react';

  // DragDropContext
  export interface DragDropContextProps {
    onDragStart?: (initial: Initial) => void;
    onDragUpdate?: (update: Update) => void;
    onDragEnd: (result: DropResult) => void;
    children?: React.ReactNode;
  }

  export declare class DragDropContext extends React.Component<DragDropContextProps> {}

  // Droppable
  export interface DroppableProps {
    droppableId: string;
    type?: string;
    mode?: 'standard' | 'virtual';
    isDropDisabled?: boolean;
    isCombineEnabled?: boolean;
    direction?: 'horizontal' | 'vertical';
    ignoreContainerClipping?: boolean;
    children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactNode;
  }

  export declare class Droppable extends React.Component<DroppableProps> {}

  // Draggable
  export interface DraggableProps {
    draggableId: string;
    index: number;
    isDragDisabled?: boolean;
    disableInteractiveElementBlocking?: boolean;
    children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => React.ReactNode;
  }

  export declare class Draggable extends React.Component<DraggableProps> {}

  // Types for the context and state
  export interface DraggableLocation {
    droppableId: string;
    index: number;
  }

  export interface DraggableId {
    draggableId: string;
  }

  export interface DroppableId {
    droppableId: string;
  }

  export interface DragStart {
    draggableId: string;
    type: string;
    source: DraggableLocation;
    mode: 'FLUID' | 'SNAP';
  }

  export interface DropResult {
    draggableId: string;
    type: string;
    source: DraggableLocation;
    destination: DraggableLocation | null;
    reason: 'DROP' | 'CANCEL';
    mode: 'FLUID' | 'SNAP';
    combine?: Combine;
  }

  export interface Combine {
    draggableId: string;
    droppableId: string;
  }

  export interface Initial {
    draggableId: string;
    type: string;
    source: DraggableLocation;
    mode: 'FLUID' | 'SNAP';
  }

  export interface Update {
    draggableId: string;
    type: string;
    source: DraggableLocation;
    destination: DraggableLocation | null;
    mode: 'FLUID' | 'SNAP';
    combine?: Combine;
  }

  // Provided and Snapshot
  export interface DroppableProvided {
    innerRef: React.RefObject<HTMLElement>;
    droppableProps: {
      'data-rbd-droppable-id': string;
      'data-rbd-droppable-context-id': string;
    };
    placeholder?: React.ReactNode;
  }

  export interface DroppableStateSnapshot {
    isDraggingOver: boolean;
    draggingOverWith?: string;
    draggingFromThisWith?: string;
    isUsingPlaceholder: boolean;
  }

  export interface DraggableProvided {
    draggableProps: {
      'data-rbd-draggable-context-id': string;
      'data-rbd-draggable-id': string;
      style?: React.CSSProperties;
    };
    dragHandleProps: {
      'data-rbd-drag-handle-draggable-id': string;
      'data-rbd-drag-handle-context-id': string;
      role: string;
      tabIndex: number;
      'aria-grabbed': boolean;
      draggable: boolean;
      onDragStart: (event: React.DragEvent<HTMLElement>) => void;
    } | null;
    innerRef: React.RefObject<HTMLElement>;
  }

  export interface DraggableStateSnapshot {
    isDragging: boolean;
    isDropAnimating: boolean;
    isClone: boolean;
    dropAnimation?: {
      duration: number;
      curve: string;
      moveTo: {
        x: number;
        y: number;
      };
    };
    draggingOver?: string;
    combineWith?: string;
    combineTargetFor?: string;
    mode?: 'FLUID' | 'SNAP';
  }
} 