// ─────────────────────────────────────────────────────────────────────────────
// SYSTÈME DE RARETÉ
// ─────────────────────────────────────────────────────────────────────────────

export const RARITY = {
  bronze:    { label: 'Bronze',    color: '#CD7F32', bg: '#FDF3E7', border: '#E8C49A' },
  silver:    { label: 'Argent',    color: '#9BA3AF', bg: '#F3F4F6', border: '#C8CDD4' },
  gold:      { label: 'Or',        color: '#F5A623', bg: '#FFFBEB', border: '#FCDDA0' },
  legendary: { label: 'Légendaire', color: '#FE5D02', bg: '#FFF4EE', border: '#FE5D02' },
  special:   { label: 'Spécial',   color: '#F62DAE', bg: '#FFF0F9', border: '#F62DAE' },
};

// ─────────────────────────────────────────────────────────────────────────────
// BADGE ICONS — associés à leur rareté pour l'affichage
// ─────────────────────────────────────────────────────────────────────────────

export const BADGE_ICONS = {
  // ── Classement ──
  top1_creator:      { icon: 'trophy',        rarity: 'legendary' },
  top3_creator:      { icon: 'medal',         rarity: 'gold'      },
  top10_creator:     { icon: 'award',         rarity: 'silver'    },
  top1_participant:  { icon: 'trophy',        rarity: 'legendary' },
  top3_participant:  { icon: 'medal',         rarity: 'gold'      },
  top10_participant: { icon: 'award',         rarity: 'silver'    },

  // ── Création de sessions ──
  create_10:  { icon: 'medal',      rarity: 'bronze'    },
  create_25:  { icon: 'fire',       rarity: 'silver'    },
  create_50:  { icon: 'gem',        rarity: 'gold'      },
  create_100: { icon: 'crown',      rarity: 'legendary' },

  // ── Participation ──
  join_10:  { icon: 'handshake',    rarity: 'bronze'    },
  join_25:  { icon: 'user-friends', rarity: 'silver'    },
  join_50:  { icon: 'running',      rarity: 'gold'      },
  join_100: { icon: 'crown',        rarity: 'legendary' },

  // ── Fidélité / Régularité ──
  weekly_presence: { icon: 'calendar-week',  rarity: 'silver'    },
  anniversary:     { icon: 'birthday-cake',  rarity: 'gold'      },
  loyal:           { icon: 'gem',            rarity: 'gold'      },
  comeback:        { icon: 'redo-alt',       rarity: 'bronze'    },

  // ── Diversité & Esprit sportif ──
  multi_sport: { icon: 'dumbbell',      rarity: 'bronze'    },
  fair_play:   { icon: 'hands-helping', rarity: 'silver'    },
  guardian:    { icon: 'shield-alt',    rarity: 'silver'    },
  big_session: { icon: 'users',         rarity: 'gold'      },
  local_hero:  { icon: 'map-marker-alt', rarity: 'silver'   },
  night_owl:   { icon: 'moon',          rarity: 'bronze'    },
  flash:       { icon: 'bolt',          rarity: 'gold'      },

  // ── Spéciaux / OG ──
  superstar:  { icon: 'star',         rarity: 'gold'      },
  supporter:  { icon: 'heart',        rarity: 'special'   },
  og_member:  { icon: 'user-ninja',   rarity: 'legendary' },
  ambassador: { icon: 'globe-europe', rarity: 'legendary' },
};

// Helper : récupère la meta de rareté d'un badge
export const getBadgeRarity = (code) => {
  const rarityKey = BADGE_ICONS[code]?.rarity ?? 'bronze';
  return RARITY[rarityKey];
};

// ─────────────────────────────────────────────────────────────────────────────
// LISTE DES BADGES
// ─────────────────────────────────────────────────────────────────────────────

export const BADGES = [

  // ── CLASSEMENT MENSUEL ──────────────────────────────────────────────────────

  {
    code:    'top1_creator',
    emoji:   '🥇',
    label:   'Légende du mois',
    desc:    'Top 1 créateur de sessions du mois',
    rarity:  'legendary',
    check:   ({ rankCreators }) => rankCreators === 1,
  },
  {
    code:    'top3_creator',
    emoji:   '🥈',
    label:   'Podium créateur',
    desc:    'Top 3 créateurs de sessions du mois',
    rarity:  'gold',
    check:   ({ rankCreators }) => rankCreators <= 3 && rankCreators > 1,
  },
  {
    code:    'top10_creator',
    emoji:   '🥉',
    label:   'Créateur étoile',
    desc:    'Top 10 créateurs de sessions du mois',
    rarity:  'silver',
    check:   ({ rankCreators }) => rankCreators <= 10 && rankCreators > 3,
  },
  {
    code:    'top1_participant',
    emoji:   '🥇',
    label:   'Aventurier du mois',
    desc:    'Top 1 participant du mois',
    rarity:  'legendary',
    check:   ({ rankParticipants }) => rankParticipants === 1,
  },
  {
    code:    'top3_participant',
    emoji:   '🥈',
    label:   'Podium aventurier',
    desc:    'Top 3 participants du mois',
    rarity:  'gold',
    check:   ({ rankParticipants }) => rankParticipants <= 3 && rankParticipants > 1,
  },
  {
    code:    'top10_participant',
    emoji:   '🥉',
    label:   'Aventurier étoile',
    desc:    'Top 10 participants du mois',
    rarity:  'silver',
    check:   ({ rankParticipants }) => rankParticipants <= 10 && rankParticipants > 3,
  },

  // ── PROGRESSION CRÉATION ────────────────────────────────────────────────────

  {
    code:    'create_10',
    emoji:   '🏅',
    label:   'Créateur en herbe',
    desc:    '10 sessions créées',
    rarity:  'bronze',
    milestone: { current: 'createdCount', target: 10 },
    check:   ({ createdCount }) => createdCount >= 10,
  },
  {
    code:    'create_25',
    emoji:   '🔥',
    label:   'Organisateur confirmé',
    desc:    '25 sessions créées',
    rarity:  'silver',
    milestone: { current: 'createdCount', target: 25 },
    check:   ({ createdCount }) => createdCount >= 25,
  },
  {
    code:    'create_50',
    emoji:   '💎',
    label:   'Meneur d\'équipe',
    desc:    '50 sessions créées',
    rarity:  'gold',
    milestone: { current: 'createdCount', target: 50 },
    check:   ({ createdCount }) => createdCount >= 50,
  },
  {
    code:    'create_100',
    emoji:   '🦾',
    label:   'Créateur légendaire',
    desc:    '100 sessions créées',
    rarity:  'legendary',
    milestone: { current: 'createdCount', target: 100 },
    check:   ({ createdCount }) => createdCount >= 100,
  },

  // ── PROGRESSION PARTICIPATION ───────────────────────────────────────────────

  {
    code:    'join_10',
    emoji:   '🤝',
    label:   'Coéquipier régulier',
    desc:    '10 sessions rejointes',
    rarity:  'bronze',
    milestone: { current: 'joinedCount', target: 10 },
    check:   ({ joinedCount }) => joinedCount >= 10,
  },
  {
    code:    'join_25',
    emoji:   '🚀',
    label:   'Partenaire fidèle',
    desc:    '25 sessions rejointes',
    rarity:  'silver',
    milestone: { current: 'joinedCount', target: 25 },
    check:   ({ joinedCount }) => joinedCount >= 25,
  },
  {
    code:    'join_50',
    emoji:   '🏆',
    label:   'Aventurier élite',
    desc:    '50 sessions rejointes',
    rarity:  'gold',
    milestone: { current: 'joinedCount', target: 50 },
    check:   ({ joinedCount }) => joinedCount >= 50,
  },
  {
    code:    'join_100',
    emoji:   '👑',
    label:   'Aventurier légendaire',
    desc:    '100 sessions rejointes',
    rarity:  'legendary',
    milestone: { current: 'joinedCount', target: 100 },
    check:   ({ joinedCount }) => joinedCount >= 100,
  },

  // ── FIDÉLITÉ & RÉGULARITÉ ───────────────────────────────────────────────────

  {
    code:    'weekly_presence',
    emoji:   '📆',
    label:   'Régularité exemplaire',
    desc:    'Actif chaque semaine pendant un mois',
    rarity:  'silver',
    check:   ({ weeksActive }) => weeksActive >= 4,
  },
  {
    code:    'anniversary',
    emoji:   '🎂',
    label:   'Membre historique',
    desc:    '1 an d\'ancienneté sur Unite',
    rarity:  'gold',
    check:   ({ accountAge }) => accountAge >= 365,
  },
  {
    code:    'loyal',
    emoji:   '💎',
    label:   'Fidèle au collectif',
    desc:    'Présent depuis plus d\'un an dans la communauté',
    rarity:  'gold',
    check:   ({ accountAge }) => accountAge >= 365,
  },
  {
    code:    'comeback',
    emoji:   '🔄',
    label:   'Le retour',
    desc:    'Revenu sur Unite après 30 jours d\'absence',
    rarity:  'bronze',
    check:   ({ daysSinceLastSession, accountAge }) =>
      accountAge >= 30 && daysSinceLastSession >= 30,
  },

  // ── DIVERSITÉ & ESPRIT SPORTIF ──────────────────────────────────────────────

  {
    code:    'multi_sport',
    emoji:   '🏃',
    label:   'Multi-sportif',
    desc:    'Sessions dans 3 sports différents',
    rarity:  'bronze',
    milestone: { current: 'sportsCount', target: 3 },
    check:   ({ sportsCount }) => sportsCount >= 3,
  },
  {
    code:    'fair_play',
    emoji:   '🤝',
    label:   'Esprit sportif',
    desc:    'Aucun signalement reçu après 3 mois d\'activité',
    rarity:  'silver',
    check:   ({ reportsCount, accountAge }) => reportsCount === 0 && accountAge >= 90,
  },
  {
    code:    'guardian',
    emoji:   '🚩',
    label:   'Gardien du collectif',
    desc:    '3 signalements validés par les modérateurs',
    rarity:  'silver',
    check:   ({ reportsValidated }) => reportsValidated >= 3,
  },
  {
    code:    'big_session',
    emoji:   '🥳',
    label:   'Chef de bande',
    desc:    'Créer une session avec 10 participants ou plus',
    rarity:  'gold',
    check:   ({ bigSessions }) => bigSessions >= 1,
  },
  {
    code:    'local_hero',
    emoji:   '📍',
    label:   'Héros local',
    desc:    '5 sessions dans le même quartier ou lieu',
    rarity:  'silver',
    milestone: { current: 'localSessions', target: 5 },
    check:   ({ localSessions }) => localSessions >= 5,
  },
  {
    code:    'night_owl',
    emoji:   '🌙',
    label:   'Oiseau de nuit',
    desc:    '3 sessions débutant après 20h',
    rarity:  'bronze',
    milestone: { current: 'nightSessions', target: 3 },
    check:   ({ nightSessions }) => nightSessions >= 3,
  },
  {
    code:    'flash',
    emoji:   '⚡',
    label:   'Session éclair',
    desc:    'Session créée et remplie en moins d\'1h',
    rarity:  'gold',
    check:   ({ flashSessions }) => flashSessions >= 1,
  },

  // ── NOTATION ────────────────────────────────────────────────────────────────

  {
    code:    'superstar',
    emoji:   '🤩',
    label:   'Superstar',
    desc:    '10 notes de 5 étoiles reçues',
    rarity:  'gold',
    milestone: { current: 'stars5', target: 10 },
    check:   ({ stars5 }) => stars5 >= 10,
  },

  // ── SPÉCIAUX & OG ───────────────────────────────────────────────────────────

  {
    code:    'supporter',
    emoji:   '❤️',
    label:   'Soutient le collectif',
    desc:    'Abonné Unite+ — soutient la communauté',
    rarity:  'special',
    check:   ({ isPremium }) => isPremium === true,
  },
  {
    code:    'og_member',
    emoji:   '🥷',
    label:   'Membre originel',
    desc:    'Fait partie des pionniers du collectif Unite',
    rarity:  'legendary',
    check:   ({ createdAt }) => new Date(createdAt) < new Date('2025-03-01'),
  },
  {
    code:    'ambassador',
    emoji:   '🌍',
    label:   'Ambassadeur',
    desc:    'A invité 3 nouveaux membres à rejoindre Unite',
    rarity:  'legendary',
    milestone: { current: 'invitedUsers', target: 3 },
    check:   ({ invitedUsers }) => invitedUsers >= 3,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retourne la progression d'un badge (0 à 1) si c'est un badge à milestone.
 * Utile pour afficher une barre de progression sur les badges non débloqués.
 *
 * Exemple : getBadgeProgress('create_25', { createdCount: 12 }) → 0.48
 */
export const getBadgeProgress = (code, stats) => {
  const badge = BADGES.find(b => b.code === code);
  if (!badge?.milestone) return null;
  const { current, target } = badge.milestone;
  const value = stats[current] ?? 0;
  return Math.min(value / target, 1);
};

/**
 * Retourne les badges débloqués pour un set de stats donné.
 */
export const getUnlockedBadges = (stats) =>
  BADGES.filter(b => {
    try { return b.check(stats); }
    catch { return false; }
  });

/**
 * Retourne les badges non débloqués, triés par progression décroissante
 * (les plus proches d'être débloqués en premier).
 */
export const getLockedBadgesSorted = (stats) =>
  BADGES
    .filter(b => {
      try { return !b.check(stats); }
      catch { return true; }
    })
    .map(b => ({
      ...b,
      progress: getBadgeProgress(b.code, stats) ?? 0,
    }))
    .sort((a, b) => b.progress - a.progress);
    