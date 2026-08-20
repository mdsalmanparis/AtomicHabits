export function getTotalXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return 8 * Math.pow(level - 1, 2) + 142 * (level - 1);
}

export function getLevelForXP(xp: number): number {
  if (xp <= 0) return 1;
  const level = Math.floor((-142 + Math.sqrt(20164 + 32 * xp)) / 16) + 1;
  return Math.max(1, level);
}

/**
 * Returns a gamified, identity-based title for levels from 1 to 100+.
 */
export function getLevelTitle(level: number): string {
  if (level >= 100) return "Grandmaster of Habits";
  if (level >= 91) return "Self-Actualized Sage";
  if (level >= 81) return "Sovereign of Consistency";
  if (level >= 71) return "Routine Overlord";
  if (level >= 61) return "System Architect Titan";
  if (level >= 53) return "Zen Flow Master";
  if (level >= 46) return "Automator Adept";
  if (level >= 39) return "Willpower Alchemist";
  if (level >= 32) return "Discipline Apprentice";
  if (level >= 26) return "Streak Sentinel";
  if (level >= 20) return "Identity Pioneer";
  if (level >= 15) return "Behavior Sculptor";
  if (level >= 10) return "Rhythm Weaver";
  if (level >= 6) return "Consistent Explorer";
  if (level >= 3) return "Habit Loop Novice";
  return "Routine Catalyst Initiate";
}
