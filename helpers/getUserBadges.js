import { BADGES, getUnlockedBadges, getLockedBadgesSorted } from '../constants/badges';

/**
 * Retourne les badges débloqués pour un utilisateur.
 * Utilise le helper centralisé du fichier badges.js
 *
 * @param {object} stats - stats de l'utilisateur
 * @returns {Array} badges débloqués
 */
export function getUserBadges(stats) {
  return getUnlockedBadges(stats);
}

/**
 * Retourne les badges non débloqués, triés par proximité
 * (les plus proches d'être débloqués en premier).
 * Utile pour afficher les "objectifs en cours".
 *
 * @param {object} stats - stats de l'utilisateur
 * @returns {Array} badges verrouillés avec progress 0→1
 */
export function getNextBadges(stats) {
  return getLockedBadgesSorted(stats);
}

/**
 * Retourne les N prochains badges à débloquer (pour un widget "Objectifs").
 *
 * @param {object} stats
 * @param {number} limit - nombre de badges à retourner (défaut : 3)
 */
export function getUpcomingBadges(stats, limit = 3) {
  return getLockedBadgesSorted(stats)
    .filter(b => b.progress > 0)   // seulement ceux avec de la progression
    .slice(0, limit);
}
