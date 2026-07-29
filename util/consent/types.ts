export interface ConsentPreferences {
  version: 1;
  necessary: true;
  preferences: boolean;
  statistics: boolean;
  marketing: boolean;
  updatedAt: string; // ISO-8601
}
