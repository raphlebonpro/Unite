export const BADGE_ICONS = {
  // 🏆 Classement
  top1_creator:      { icon: 'trophy', color: '#09A129' },
  top3_creator:      { icon: 'medal', color: '#09A129' },
  top10_creator:     { icon: 'award', color: '#09A129' },

  top1_participant:  { icon: 'trophy', color: '#09A129' },
  top3_participant:  { icon: 'medal', color: '#09A129' },
  top10_participant: { icon: 'award', color: '#09A129' },

  // 🚀 Création de sessions
  create_10:   { icon: 'medal', color: '#09A129' },
  create_25:   { icon: 'fire', color: '#09A129' },
  create_50:   { icon: 'gem', color: '#09A129' },
  create_100:  { icon: 'crown', color: '#09A129' },

  // 🤝 Participation
  join_10:   { icon: 'handshake', color: '#09A129' }, 
  join_25:   { icon: 'user-friends', color: '#09A129' },
  join_50:   { icon: 'running', color: '#09A129' },
  join_100:  { icon: 'crown', color: '#09A129' },

  // 🗓️ Fidélité / régularité
  weekly_presence: { icon: 'calendar-week', color: '#09A129' },
  anniversary:     { icon: 'birthday-cake', color: '#09A129' },
  loyal:           { icon: 'gem', color: '#09A129' },

  // 🏃 Diversité & Esprit sportif
  multi_sport: { icon: 'dumbbell', color: '#09A129' },
  fair_play: { icon: 'hands-helping', color: '#09A129' },
  guardian:    { icon: 'shield-alt', color: '#09A129' },
  big_session: { icon: 'users', color: '#09A129' },

  // 🌟 Spéciaux
  superstar:   { icon: 'star', color: '#09A129' },
  supporter:   { icon: 'heart', color: '#09A129' },
  og_member:   { icon: 'user-ninja', color: '#09A129' },
  ambassador:  { icon: 'globe-europe', color: '#09A129' },
};

// Ta liste de badges
export const BADGES = [
  // Prestige & Ranking
  { code: 'top1_creator', emoji: '🥇', label: 'Légende du mois', desc: 'Top 1 créateur du mois', check: ({ rankCreators }) => rankCreators === 1 },
  { code: 'top3_creator', emoji: '🥈', label: 'Podium créateur', desc: 'Top 3 créateurs du mois', check: ({ rankCreators }) => rankCreators <= 3 && rankCreators > 1 },
  { code: 'top10_creator', emoji: '🥉', label: 'Créateur star', desc: 'Top 10 créateurs du mois', check: ({ rankCreators }) => rankCreators <= 10 && rankCreators > 3 },
  { code: 'top1_participant', emoji: '🥇', label: 'Aventurier du mois', desc: 'Top 1 participant du mois', check: ({ rankParticipants }) => rankParticipants === 1 },
  { code: 'top3_participant', emoji: '🥈', label: 'Podium aventurier', desc: 'Top 3 participants du mois', check: ({ rankParticipants }) => rankParticipants <= 3 && rankParticipants > 1 },
  { code: 'top10_participant', emoji: '🥉', label: 'Aventurier star', desc: 'Top 10 participants du mois', check: ({ rankParticipants }) => rankParticipants <= 10 && rankParticipants > 3 },
  // Progression Création
  { code: 'create_10', emoji: '🏅', label: 'Créateur en herbe', desc: '10 sessions créées', check: ({ createdCount }) => createdCount >= 10 },
  { code: 'create_25', emoji: '🔥', label: 'Organisateur confirmé', desc: '25 sessions créées', check: ({ createdCount }) => createdCount >= 25 },
  { code: 'create_50', emoji: '💎', label: 'Meneur d’équipe', desc: '50 sessions créées', check: ({ createdCount }) => createdCount >= 50 },
  { code: 'create_100', emoji: '🦾', label: 'Ambassadeur suprême', desc: '100 sessions créées', check: ({ createdCount }) => createdCount >= 100 },
  // Progression Participation
  { code: 'join_10', emoji: '🤝', label: 'Coéquipier régulier', desc: '10 sessions rejointes', check: ({ joinedCount }) => joinedCount >= 10 },
  { code: 'join_25', emoji: '🚀', label: 'Partenaire fidèle', desc: '25 sessions rejointes', check: ({ joinedCount }) => joinedCount >= 25 },
  { code: 'join_50', emoji: '🏆', label: 'Aventurier Elite', desc: '50 sessions rejointes', check: ({ joinedCount }) => joinedCount >= 50 },
  { code: 'join_100', emoji: '👑', label: 'Aventurier Légendaire', desc: '100 sessions rejointes', check: ({ joinedCount }) => joinedCount >= 100 },
  // Diversité / Fidélité / Spéciaux
  { code: 'weekly_presence', emoji: '📆', label: 'Régularité exemplaire', desc: 'Présence chaque semaine d’un mois', check: ({ weeksActive }) => weeksActive >= 4 },
  { code: 'anniversary', emoji: '🎂', label: 'Membre historique', desc: '1 an d’ancienneté', check: ({ accountAge }) => accountAge >= 365 },
  { code: 'multi_sport', emoji: '🏃‍♂️', label: 'Multi-sportif', desc: '3 sports différents', check: ({ sportsCount }) => sportsCount >= 3 },
  { code: 'guardian', emoji: '🚩', label: 'Gardien de la communauté', desc: '3 comportements toxiques signalés', check: ({ reportsValidated }) => reportsValidated >= 3 },
  { code: 'superstar', emoji: '🤩', label: 'Superstar', desc: '10 notes de 5 étoiles', check: ({ stars5 }) => stars5 >= 10 },
  { code: 'big_session', emoji: '🥳', label: 'Chef de bande', desc: '+10 participants sur une session', check: ({ bigSessions }) => bigSessions >= 1 },
  { code: 'supporter', emoji: '❤️', label: 'Soutient le Collectif', desc: 'A souscrit à Unite+ et soutient la communauté Unite.', check: ({ isPremium }) => isPremium === true },
  { code: 'og_member', emoji: '🥷', label: 'Membre Originel', desc: 'Fait partie des pionniers du collectif Unite.', check: ({ createdAt }) => new Date(createdAt) < new Date('2025-03-01')},
  { code: 'loyal', emoji: '💎', label: 'Fidèle au Collectif', desc: 'Présent depuis plus d’un an dans la communauté.', check: ({ accountAge }) => accountAge >= 365},
  { code: 'ambassador', emoji: '🌍', label: 'Ambassadeur', desc: 'A invité plusieurs nouveaux membres à rejoindre Unite.', check: ({ invitedUsers }) => invitedUsers >= 3 },
  {  code: 'fair_play',emoji: '🤝',label: 'Esprit sportif', desc: 'A gardé une attitude exemplaire et respectueuse envers les autres.', check: ({ reportsCount, accountAge }) => reportsCount === 0 && accountAge >= 90 },
];
