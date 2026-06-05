export function isPremiumContentLocked(isPremium: boolean, isVip: boolean): boolean {
  return isPremium && !isVip
}
