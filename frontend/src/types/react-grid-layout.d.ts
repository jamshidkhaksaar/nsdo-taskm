declare module 'react-grid-layout' {
  import * as React from 'react';
  
  export interface Layout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    [key: string]: any;
  }
  
  export interface Layouts {
    [breakpoint: string]: Layout[];
  }
  
  // Just export a component that accepts any props
  export class Responsive extends React.Component<any> {}
  
  export function WidthProvider(component: any): any;
  
  const GridLayout: React.ComponentType<any>;
  export default GridLayout;
} 