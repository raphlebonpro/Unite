export const BADGE_ICONS = {
  top1_creator: { icon: 'trophy', color: '#ffc400' },
  top3_creator: { icon: 'medal', color: '#b0bec5' },
  top10_creator: { icon: 'award', color: '#ffd700' },
  top1_participant: { icon: 'trophy', color: '#009688' },
  top3_participant: { icon: 'medal', color: '#90caf9' },
  top10_participant: { icon: 'award', color: '#4caf50' },
  create_10: { icon: 'medal', color: '#1976d2' }, // 👈 Médaille, plus clair
  create_25: { icon: 'fire', color: '#ff7043' },
  create_50: { icon: 'gem', color: '#42a5f5' },
  create_100: { icon: 'crown', color: '#ffb300' },
  join_10: { icon: 'handshake', color: '#00b686' },
  join_25: { icon: 'user-friends', color: '#388e3c' },
  join_50: { icon: 'running', color: '#ffb74d' },
  join_100: { icon: 'crown', color: '#ad1457' },
  weekly_presence: { icon: 'calendar-week', color: '#673ab7' },
  anniversary: { icon: 'birthday-cake', color: '#f06292' },
  multi_sport: { icon: 'dumbbell', color: '#26c6da' },
  guardian: { icon: 'shield-alt', color: '#ff5252' },
  superstar: { icon: 'star', color: '#ffd600' },
  big_session: { icon: 'users', color: '#4dd0e1' },
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
];
