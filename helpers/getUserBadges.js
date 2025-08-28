import { BADGES } from '../constants/badges';

export function getUserBadges(stats) {
  return BADGES.filter(badge => badge.check(stats));
}
