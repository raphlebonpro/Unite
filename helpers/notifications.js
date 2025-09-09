// helpers/notifications.js
import { supabase } from '../lib/supabaseClient';

/* ===========================
   🔵 Core – fonction centrale
   =========================== */

export async function notifyUser({
  user_id,
  title,
  body,
  message,
  type,
  session_id = null,
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

/** Envoi groupé séquentiel */
async function notifyMany(userIds = [], buildPayload) {
  for (const uid of userIds) {
    const payload = buildPayload(uid);
    if (!payload?.user_id) payload.user_id = uid;
    await notifyUser(payload);
  }
}

/* ===========================
   📌 Sessions
   =========================== */

export async function notifySessionCreated({ creatorId, sessionId, title }) {
  await notifyUser({
    user_id: creatorId,
    title: 'Session créée',
    body: `Ta session "${title}" a bien été créée.`,
    type: 'session_created',
    session_id: sessionId,
    sender_id: creatorId,
    push: false, // confirmation locale
  });
}

export async function notifySessionDeletedCreator({ creatorId, sessionTitle, sessionId }) {
  await notifyUser({
    user_id: creatorId,
    title: 'Session supprimée',
    body: `Ta session "${sessionTitle}" a bien été supprimée.`,
    type: 'session_deleted_creator',
    session_id: sessionId,
    sender_id: creatorId,
    push: false,
  });
}

export async function notifySessionDeletedParticipants({ participantIds = [], sessionTitle, sessionId }) {
  await notifyMany(participantIds, () => ({
    title: 'Session annulée',
    body: `La session "${sessionTitle}" à laquelle tu participais a été annulée.`,
    type: 'session_deleted_participant',
    session_id: sessionId,
    push: true,
  }));
}

export async function notifySessionUpdatedCreator({ creatorId, sessionTitle, sessionId }) {
  await notifyUser({
    user_id: creatorId,
    title: 'Session modifiée',
    body: `Ta session "${sessionTitle}" a bien été modifiée.`,
    type: 'session_updated_creator',
    session_id: sessionId,
    sender_id: creatorId,
    push: true,
  });
}

export async function notifySessionUpdatedParticipants({ participantIds = [], sessionTitle, sessionId }) {
  await notifyMany(participantIds, () => ({
    title: 'Session modifiée',
    body: `La session "${sessionTitle}" à laquelle tu participes a été modifiée.`,
    type: 'session_updated_participant',
    session_id: sessionId,
    push: true,
  }));
}

export async function notifySessionStartingSoon({ userIds = [], sessionTitle, sessionId, minutes = 120 }) {
  await notifyMany(userIds, () => ({
    title: 'Rappel',
    body: `Ta session "${sessionTitle}" commence dans ${minutes} minutes.`,
    type: 'session_start_soon',
    session_id: sessionId,
    push: true,
  }));
}

export async function notifySessionEnded({ userIds = [], sessionId }) {
  await notifyMany(userIds, () => ({
    title: 'Session terminée',
    body: `Ta session est terminée ! Laisse un avis sur tes coéquipiers.`,
    type: 'leave_review',
    session_id: sessionId,
    push: true,
  }));
}

export async function notifySessionFull({ creatorId, sessionTitle, sessionId }) {
  await notifyUser({
    user_id: creatorId,
    title: 'Session complète',
    body: `Ta session "${sessionTitle}" est maintenant complète.`,
    type: 'session_full',
    session_id: sessionId,
    push: true,
  });
}

/* ===========================
   👥 Participants
   =========================== */

export async function notifyParticipantJoinedCreator({ creatorId, joinerId, joinerName, sessionTitle, sessionId }) {
  await notifyUser({
    user_id: creatorId,
    title: 'Nouveau participant',
    body: `${joinerName} a rejoint ta session "${sessionTitle}".`,
    type: 'participant_joined_creator',
    session_id: sessionId,
    sender_id: joinerId,
    push: true,
  });
}

export async function notifyParticipantJoinedOthers({ participantIds = [], joinerId, joinerName, sessionTitle, sessionId }) {
  await notifyMany(participantIds, () => ({
    title: 'Nouveau participant',
    body: `${joinerName} a rejoint la session "${sessionTitle}" à laquelle tu participes.`,
    type: 'participant_joined_participant',
    session_id: sessionId,
    sender_id: joinerId,
    push: true,
  }));
}

export async function notifyYouJoinedSession({ userId, sessionTitle, sessionId }) {
  await notifyUser({
    user_id: userId,
    title: 'Inscription confirmée',
    body: `Tu as bien rejoint la session "${sessionTitle}".`,
    type: 'session_joined',
    session_id: sessionId,
    sender_id: userId,
    push: true, // confirmation locale
  });
}

export async function notifyParticipantLeft({ creatorId, leaverId, leaverName, sessionTitle, sessionId, otherParticipantIds = [] }) {
  // Notifier le créateur
  if (creatorId && leaverId !== creatorId) {
    await notifyUser({
      user_id: creatorId,
      title: 'Participant parti',
      body: `${leaverName} a quitté ta session "${sessionTitle}".`,
      type: 'participant_left_creator',
      session_id: sessionId,
      sender_id: leaverId,
      push: true,
    });
  }

  // Notifier les autres participants
  await notifyMany(otherParticipantIds, () => ({
    title: 'Participant parti',
    body: `${leaverName} a quitté la session "${sessionTitle}".`,
    type: 'participant_left_participant',
    session_id: sessionId,
    sender_id: leaverId,
    push: true,
  }));

  // Confirmation au quittant (push pas nécessaire)
  await notifyUser({
    user_id: leaverId,
    title: 'Tu as quitté la session',
    body: `Tu as bien quitté la session "${sessionTitle}".`,
    type: 'participant_left_self',
    session_id: sessionId,
    push: false,
  });
}

export async function notifyExclusion({ creatorId, excludedId, excludedName, sessionTitle, sessionId, otherParticipantIds = [] }) {
  // Notifier l'exclu
  await notifyUser({
    user_id: excludedId,
    title: 'Exclusion',
    body: `Tu as été exclu de la session "${sessionTitle}".`,
    type: 'excluded_from_session',
    session_id: sessionId,
    sender_id: creatorId,
    push: true,
  });

  // Notifier le créateur (confirmation)
  if (creatorId) {
    await notifyUser({
      user_id: creatorId,
      title: 'Exclusion effectuée',
      body: `Tu as exclu ${excludedName} de la session "${sessionTitle}".`,
      type: 'exclude_user',
      session_id: sessionId,
      sender_id: excludedId,
      push: false,
    });
  }

  // Notifier les autres participants
  await notifyMany(otherParticipantIds, () => ({
    title: 'Exclusion',
    body: `${excludedName} a été exclu de la session "${sessionTitle}".`,
    type: 'excluded_participant',
    session_id: sessionId,
    sender_id: creatorId,
    push: true,
  }));
}

/* ===========================
   💬 Messages
   =========================== */

export async function notifyNewMessage({ recipientId, senderId, senderName, sessionTitle, sessionId }) {
  // Ne pas notifier si sender == recipient
  if (recipientId === senderId) return;

  await notifyUser({
    user_id: recipientId,
    title: `Nouveau message`,
    body: `${senderName} a envoyé un message dans la session "${sessionTitle}".`,
    type: 'new_message',
    session_id: sessionId,
    sender_id: senderId,
    push: true,
  });
}


/* ===========================
   🤝 Amis
   =========================== */

export async function notifyFriendRequestReceived({ recipientId, senderId, senderName }) {
  await notifyUser({
    user_id: recipientId,
    title: 'Nouvelle demande d’ami',
    body: `${senderName} t’a envoyé une demande d’ami.`,
    type: 'friend_request',
    sender_id: senderId,
    push: true,
  });
}

export async function notifyFriendRequestSent({ senderId, receiverName }) {
  await notifyUser({
    user_id: senderId,
    title: 'Demande envoyée',
    body: `Ta demande d’ami à ${receiverName} a bien été envoyée.`,
    type: 'friend_request_sent',
    sender_id: senderId,
    push: false, // confirmation locale
  });
}

export async function notifyFriendRequestAcceptedSender({ senderId, receiverName }) {
  await notifyUser({
    user_id: senderId,
    title: 'Demande acceptée',
    body: `${receiverName} a accepté ta demande, vous êtes désormais coéquipiers !`,
    type: 'friend_request_accepted',
    sender_id: null,
    push: true,
  });
}

export async function notifyFriendRequestRejectedSender({ senderId, receiverName }) {
  await notifyUser({
    user_id: senderId,
    title: 'Demande refusée',
    body: `${receiverName} a refusé ta demande d’ami.`,
    type: 'friend_request_rejected',
    sender_id: null,
    push: true,
  });
}

export async function notifyFriendRequestAcceptedReceiver({ receiverId, senderName }) {
  await notifyUser({
    user_id: receiverId,
    title: 'Nouveau coéquipier',
    body: `Tu es désormais coéquipier avec ${senderName}.`,
    type: 'friend_request_accepted_self',
    sender_id: null,
    push: false, // confirmation locale
  });
}

/* ===========================
   🏅 Social / Progression
   =========================== */

export async function notifyFriendJoinedSession({ audienceUserIds = [], friendName, sessionTitle, sessionId }) {
  await notifyMany(audienceUserIds, () => ({
    title: 'Ton ami est actif !',
    body: `${friendName} a rejoint la session "${sessionTitle}".`,
    type: 'friend_joined_session',
    session_id: sessionId,
    push: true,
  }));
}

export async function notifyBadgeAwarded({ userId, badgeName }) {
  await notifyUser({
    user_id: userId,
    title: 'Nouveau badge',
    body: `Tu as obtenu le badge "${badgeName}" !`,
    type: 'badge_awarded',
    push: true,
  });
}

export async function notifyNewSessionNearby({ userId, sport, distance }) {
  await notifyUser({
    user_id: userId,
    title: 'Nouvelle session près de toi',
    body: `Une session de ${sport} vient d’être créée à ${distance} km de ta localisation.`,
    type: 'new_session_nearby',
    push: true,
  });
}

export async function notifyCollectiveChallenge({ audienceUserIds = [], challengeTitle, challengeId }) {
  await notifyMany(audienceUserIds, () => ({
    title: 'Nouveau défi collectif',
    body: challengeTitle || 'Un nouveau défi vient de commencer, rejoins-le !',
    type: 'collective_challenge',
    session_id: challengeId || null,
    push: true,
  }));
}

export async function notifyReviewReceived({ recipientId, reviewerName, sessionId }) {
  await notifyUser({
    user_id: recipientId,
    title: 'Nouvel avis reçu',
    body: `${reviewerName} a laissé un avis sur ton profil.`,
    type: 'review_received',
    session_id: sessionId,
    push: true,
  });
}

/* ===========================
   ⚙️ Préférences & Profil
   =========================== */

export async function notifyProfileUpdated({ userId }) {
  await notifyUser({
    user_id: userId,
    title: 'Profil mis à jour',
    body: 'Ton profil a bien été modifié.',
    type: 'profile_updated',
    push: false, // confirmation locale
  });
}

export async function notifyLocationPreferencesUpdated({ userId }) {
  await notifyUser({
    user_id: userId,
    title: 'Localisation enregistrée',
    body: 'Tes préférences de localisation ont été enregistrées.',
    type: 'location_preferences_updated',
    push: false,
  });
}

export async function notifyNotificationPreferencesUpdated({ userId }) {
  await notifyUser({
    user_id: userId,
    title: 'Notifications enregistrées',
    body: 'Tes préférences de notification ont été enregistrées.',
    type: 'notification_preferences_updated',
    push: false,
  });
}

export async function notifyReviewUpdated({ recipientId, reviewerName }) {
  await notifyUser({
    user_id: recipientId,
    title: 'Avis modifié',
    body: `${reviewerName} a mis à jour son avis sur ton profil.`,
    type: 'review_updated',
    push: true,
  });
}

export async function notifyReportConfirmation({ reporterId, targetName }) {
  await notifyUser({
    user_id: reporterId,
    title: 'Signalement confirmé',
    body: `Ton signalement concernant ${targetName} a bien été pris en compte.`,
    type: 'report_confirmation',
    push: false, // confirmation locale
  });
}

export async function notifyReportedUser({ reportedId }) {
  await notifyUser({
    user_id: reportedId,
    title: 'Compte signalé',
    body: `Ton comportement a été signalé par un utilisateur.`,
    type: 'user_reported',
    push: true,
  });
}

export async function notifyFeedbackReceived({ userId, feedbackId }) {
  // Ici tu peux cibler un compte admin fixe (par ex. ADMIN_USER_ID),
  // ou une liste d’admins stockés en base
  const ADMIN_USER_ID = process.env.EXPO_PUBLIC_ADMIN_USER_ID || null;
  if (!ADMIN_USER_ID) return;

  await notifyUser({
    user_id: ADMIN_USER_ID,
    title: 'Nouveau feedback reçu',
    body: `Un utilisateur a soumis un feedback (#${feedbackId}).`,
    type: 'feedback_received',
    sender_id: userId,
    push: true,
  });
}

export async function notifyNearbyUsersOnSessionCreated({ sessionId, sport, lat, lng, creatorId, radiusKm = 20 }) {
  try {
    // 🔑 Récupérer le token de session (auth)
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';
    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!baseUrl) throw new Error('EXPO_PUBLIC_SUPABASE_URL manquant');

    // 🌍 Appel de l’edge function
    const res = await fetch(`${baseUrl}/functions/v1/notify_nearby_sessions`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        sport,
        lat,
        lng,
        creatorId,
        radiusKm, // par défaut 20 km mais override possible
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`notify_nearby_sessions failed: ${res.status} ${txt}`);
    }

    const result = await res.json();
    console.log('✅ notifyNearbyUsersOnSessionCreated OK:', result);
    return true;
  } catch (e) {
    console.warn('[notifyNearbyUsersOnSessionCreated] fail:', e?.message || e);
    return false;
  }
}
