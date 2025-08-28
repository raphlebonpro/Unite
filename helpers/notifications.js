// helpers/notifications.js
import { supabase } from '../lib/supabaseClient';

/* ===========================
   🔵 Core – envoi centralisé
   =========================== */

/**
 * Appelle l’Edge Function send_notification :
 * - insère la notif en base (service-role)
 * - envoie (optionnel) le push Expo côté Edge
 *
 * ⚠️ On ne lit jamais le expo_push_token côté client (RLS)
 */
export async function notifyUser({
  user_id,
  title,
  body,
  message,
  type,
  session_id,
  sender_id = null,
  push = false,
}) {
  const safeTitle = (title ?? 'Notification').toString();
  const safeMessage = (message ?? body ?? '').toString();
  const safeType = (type ?? 'default').toString();

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';
    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!baseUrl) throw new Error('EXPO_PUBLIC_SUPABASE_URL manquant');

    // ✅ correction du slug → send_notifications (avec un s)
    const res = await fetch(`${baseUrl}/functions/v1/send_notifications`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id,
        title: safeTitle,
        message: safeMessage,
        type: safeType,
        session_id,
        sender_id,
        push,
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`send_notifications failed: ${res.status} ${txt}`);
    }
    return true;
  } catch (e) {
    console.warn('[notifyUser] fail:', e?.message || e);
    return false;
  }
}

/** Envoi à une liste d’utilisateurs (séquentiel pour éviter les ratés) */
async function notifyMany(userIds = [], buildPayload /* (uid)=>payload */) {
  for (const uid of userIds) {
    const payload = buildPayload(uid);
    if (!payload?.user_id) payload.user_id = uid;
    await notifyUser(payload);
  }
}

/* ===========================
   🧩 Cas fonctionnels couverts
   =========================== */

/** 1) Création de session – confirmation au créateur */
export async function notifySessionCreatedForCreator({ creatorId, sessionId, title = 'Session créée', body = 'Votre session a bien été créée.' }) {
  await notifyUser({
    user_id: creatorId,
    title,
    body,
    type: 'session_created',
    session_id: sessionId,
    sender_id: creatorId,
    push: true,
  });
}

/** 2) Un utilisateur rejoint une session (confirmation au joiner) */
export async function notifySessionJoinedForJoiner({ joinerId, sessionId }) {
  await notifyUser({
    user_id: joinerId,
    title: 'Inscription confirmée',
    body: 'Tu as rejoint la session.',
    type: 'session_joined',
    session_id: sessionId,
    sender_id: joinerId,
    push: true,
  });
}

/** 3) Un utilisateur rejoint une session – informer le créateur + autres participants */
export async function notifyParticipantJoinedAudience({
  sessionId,
  creatorId,
  joinerId,
  joinerName,
  otherParticipantIds = [],
}) {
  // Créateur
  if (creatorId) {
    await notifyUser({
      user_id: creatorId,
      title: 'Nouveau participant',
      body: `${joinerName} a rejoint votre session.`,
      type: 'participant_joined',
      session_id: sessionId,
      sender_id: joinerId,
      push: true,
    });
  }
  // Autres participants (hors le joiner)
  const audience = (otherParticipantIds || []).filter((id) => id && id !== joinerId && id !== creatorId);
  await notifyMany(audience, () => ({
    title: 'Nouveau participant',
    body: `${joinerName} a rejoint la session.`,
    type: 'participant_joined',
    session_id: sessionId,
    sender_id: joinerId,
    push: true,
  }));
}

/** 4) Exclure quelqu’un / Être exclu / Avertir les autres (déjà existant, consolidé) */
export async function notifyExclusion({
  sessionId,
  creatorId,
  excludedUserId,
  excludedUserName,
  otherParticipants = [],
}) {
  // Créateur
  if (creatorId) {
    await notifyUser({
      user_id: creatorId,
      title: 'Exclusion effectuée',
      body: `Vous avez exclu ${excludedUserName} de la session.`,
      type: 'exclude_user',
      session_id: sessionId,
      sender_id: creatorId,
    });
  }
  // Utilisateur exclu
  await notifyUser({
    user_id: excludedUserId,
    title: 'Exclusion',
    body: 'Vous avez été exclu de la session.',
    type: 'excluded_from_session',
    session_id: sessionId,
    sender_id: creatorId || null,
    push: true,
  });
  // Autres participants
  const audience = (otherParticipants || []).filter((id) => id && id !== excludedUserId && id !== creatorId);
  await notifyMany(audience, () => ({
    title: 'Participant exclu',
    body: `${excludedUserName} a été exclu de la session.`,
    type: 'excluded_from_session',
    session_id: sessionId,
    sender_id: creatorId || null,
    push: false,
  }));
}

/** 5) Suppression de session – créateur + participants */
export async function notifySessionDeleted({ sessionId, creatorId, participantIds = [] }) {
  if (creatorId) {
    await notifyUser({
      user_id: creatorId,
      title: 'Session supprimée',
      body: 'Votre session a bien été supprimée.',
      type: 'session_deleted_creator',
      session_id: sessionId,
      sender_id: creatorId,
    });
  }
  await notifyMany(participantIds, () => ({
    title: 'Session supprimée',
    body: 'La session à laquelle vous participiez a été supprimée.',
    type: 'session_deleted_participant',
    session_id: sessionId,
    sender_id: creatorId || null,
    push: true,
  }));
}

/** 6) Nouveau message dans un groupe de session */
export async function notifyNewMessage({ sessionId, senderName, recipientId, content }) {
  await notifyUser({
    user_id: recipientId,
    title: `Nouveau message de ${senderName}`,
    body: content?.substring(0, 80) || 'Nouveau message reçu',
    type: 'new_message',
    session_id: sessionId,
    sender_id: null,
    push: true,
  });
}

/** 7) Nouvelle activité à proximité (nouvelle session proche) */
export async function notifyNewSessionNearby({ userId, sport, distance }) {
  await notifyUser({
    user_id: userId,
    title: 'Nouvelle activité près de toi',
    body: `Une session de ${sport} vient d’être créée à ${distance} km de toi.`,
    type: 'new_session_nearby',
    sender_id: null,
    push: true,
  });
}

/** 8) Nouveaux défis collectifs */
export async function notifyCollectiveChallenge({ audienceUserIds = [], challengeTitle, challengeId }) {
  await notifyMany(audienceUserIds, () => ({
    title: 'Nouveau défi du Collectif',
    body: challengeTitle || 'Un nouveau défi vient de commencer. Rejoins-le !',
    type: 'collective_challenge',
    session_id: challengeId || null,
    sender_id: null,
    push: true,
  }));
}

/** 9) Demande d’ami reçue */
export async function notifyFriendRequest({ recipientId, requesterId, requesterName }) {
  await notifyUser({
    user_id: recipientId,
    title: 'Nouvelle demande d’ami',
    body: `${requesterName} souhaite te suivre et jouer avec toi.`,
    type: 'friend_request',
    sender_id: requesterId, // 👈 pour tes actions "Accepter/Refuser" côté UI
    push: true,
  });
}

/** 10) Réponse à une demande d’ami (acceptée / refusée) */
export async function notifyFriendRequestDecision({ requesterId, recipientName, accepted }) {
  await notifyUser({
    user_id: requesterId,
    title: accepted ? 'Demande d’ami acceptée' : 'Demande d’ami refusée',
    body: accepted
      ? `${recipientName} a accepté ta demande.`
      : `${recipientName} a refusé ta demande.`,
    type: accepted ? 'friend_request_accepted' : 'friend_request_rejected',
    sender_id: null,
    push: true,
  });
}

/** 11) Signalement envoyé (confirmation à l’émetteur) */
export async function notifyReportSubmitted({ reporterId, reportedUserName }) {
  await notifyUser({
    user_id: reporterId,
    title: 'Signalement envoyé',
    body: `${reportedUserName} a été signalé avec succès.`,
    type: 'user_reported',
    sender_id: null,
    push: true,
  });
}

/** 12) 2h après la session : demander de laisser un avis sur CHAQUE participant */
export async function notifyLeaveReviewForParticipants({ sessionId, requesterId, participantIds = [] }) {
  // requesterId = l’utilisateur à qui on demande de laisser des avis
  await notifyMany(participantIds, () => ({
    user_id: requesterId, // 👉 on notifie la même personne plusieurs fois ? No: on envoie UNE notif "laisse un avis" (pas une par participant)
    title: 'Donne ton avis',
    body: 'Laisse un avis sur tes coéquipiers de cette session.',
    type: 'leave_review',
    session_id: sessionId,
    sender_id: null,
    push: true,
  }));
  // Variante : si tu veux une seule notif (recommandé), appelle plutôt ceci :
  // await notifyUser({ user_id: requesterId, title: 'Donne ton avis', body: 'Laisse un avis sur tes coéquipiers de cette session.', type: 'leave_review', session_id: sessionId, push: true });
}

/** 13) Avis reçu d’un coéquipier */
export async function notifyReviewReceived({ recipientId, reviewerName, sessionId }) {
  await notifyUser({
    user_id: recipientId,
    title: 'Nouvel avis reçu',
    body: `${reviewerName} t’a laissé un avis.`,
    type: 'review_received',
    session_id: sessionId,
    sender_id: null,
    push: true,
  });
}

/** 14) Rappel : la session commence dans 2h */
export async function notifySessionStartingSoon({ userIds = [], sessionId, minutes = 120 }) {
  await notifyMany(userIds, () => ({
    title: 'Rappel',
    body: `Ta session commence dans ${minutes} minutes.`,
    type: 'session_start_soon',
    session_id: sessionId,
    sender_id: null,
    push: true,
  }));
}

/** 15) Badge reçu */
export async function notifyBadgeAwarded({ userId, badgeName }) {
  await notifyUser({
    user_id: userId,
    title: 'Nouveau badge',
    body: `Tu as reçu le badge “${badgeName}”.`,
    type: 'badge_awarded',
    sender_id: null,
    push: true,
  });
}

/** 16) Un ami rejoint une session (feed social) */
export async function notifyFriendJoinedSession({ audienceUserIds = [], friendName, sessionId }) {
  await notifyMany(audienceUserIds, () => ({
    title: 'Ton ami est actif !',
    body: `${friendName} a rejoint une session.`,
    type: 'friend_joined_session',
    session_id: sessionId,
    sender_id: null,
    push: true,
  }));
}

/** 17) Un ami crée une session (feed social) */
export async function notifyFriendCreatedSession({ audienceUserIds = [], friendName, sessionId }) {
  await notifyMany(audienceUserIds, () => ({
    title: 'Nouvelle session d’un ami',
    body: `${friendName} vient de créer une session.`,
    type: 'friend_created_session',
    session_id: sessionId,
    sender_id: null,
    push: true,
  }));
}

/** 18) Quitter une session (créateur + quittant) */
export async function notifyLeftSession({ sessionId, creatorId, leaverId, leaverName, otherParticipantIds = [] }) {
  // Créateur
  if (creatorId) {
    await notifyUser({
      user_id: creatorId,
      title: 'Un participant est parti',
      body: `${leaverName} a quitté votre session.`,
      type: 'left_session',
      session_id: sessionId,
      sender_id: leaverId,
      push: true,
    });
  }
  // Le quittant (confirmation)
  await notifyUser({
    user_id: leaverId,
    title: 'Vous avez quitté la session',
    body: 'Vous avez quitté la session avec succès.',
    type: 'left_session',
    session_id: sessionId,
    sender_id: null,
    push: false,
  });
  // Autres participants (optionnel)
  const audience = (otherParticipantIds || []).filter((id) => id && id !== leaverId && id !== creatorId);
  await notifyMany(audience, () => ({
    title: 'Un participant est parti',
    body: `${leaverName} a quitté la session.`,
    type: 'left_session',
    session_id: sessionId,
    sender_id: leaverId,
    push: false,
  }));
}
