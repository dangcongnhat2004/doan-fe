// Base file for TypeScript - exports null on web
// On native, this will be overridden by viewShotHelper.native.ts
export const captureRef: ((view: any, options?: any) => Promise<string>) | null = null;

