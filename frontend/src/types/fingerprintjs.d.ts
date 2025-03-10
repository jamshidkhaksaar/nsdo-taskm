declare module '@fingerprintjs/fingerprintjs' {
  export interface FingerprintJSOptions {
    debug?: boolean;
  }

  export interface FingerprintResult {
    visitorId: string;
    components: Record<string, any>;
    version: string;
  }

  export interface FingerprintAgent {
    get(): Promise<FingerprintResult>;
  }

  export interface FingerprintJS {
    load(options?: FingerprintJSOptions): Promise<FingerprintAgent>;
  }

  const FingerprintJS: FingerprintJS;
  export default FingerprintJS;
} 