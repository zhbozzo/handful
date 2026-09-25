import { NativeModule, requireOptionalNativeModule } from 'expo';

import type { AnalysisResult, RedactRegion, RedactResult } from './PrivacyShield.types';

declare class PrivacyShieldModule extends NativeModule<Record<string, never>> {
  isAvailable: boolean;
  analyze(uri: string): Promise<AnalysisResult>;
  redact(uri: string, regions: RedactRegion[]): Promise<RedactResult>;
}

/** null when the native module isn't compiled in (web, Expo Go). */
export default requireOptionalNativeModule<PrivacyShieldModule>('PrivacyShield');
