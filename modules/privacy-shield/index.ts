// Re-export the native module. On web, it will be resolved to PrivacyShieldModule.web.ts
// and on native platforms to PrivacyShieldModule.ts
export { default } from './src/PrivacyShieldModule';
export * from './src/PrivacyShield.types';
