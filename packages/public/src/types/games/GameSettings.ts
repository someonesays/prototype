export interface GameSettings {
  language: GameSettingsLanguages;
  volume: number; // Value between 0-100
}

export type GameSettingsLanguages = "en-US";
