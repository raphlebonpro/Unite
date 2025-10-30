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
  group_id = null,
  sender_id = null,
  push = false,
}) {
  const safeTitle = (title ?? 'Notification').toString();
  const safeMessage = (message ?? body ?? '').toString();
  const safeType = (type ?? 'default').toString();

  try {
    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!baseUrl) throw new Error('EXPO_PUBLIC_SUPABASE_URL manquant');

    // 🔑 Récupérer le token utilisateur
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';

    const res = await fetch(`${baseUrl}/functions/v1/send_notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // ✅ ajout du header
      },
      body: JSON.stringify({
        user_id,
        title: safeTitle,
        message: safeMessage,
        type: safeType,
        session_id,
        group_id,
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
    push: true,
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
  if (recipientId === senderId) return;
  await notifyUser({
    user_id: recipientId,
    title: 'Nouveau message',
    body: `${senderName} a écrit dans "${sessionTitle}".\n👉 Clique pour ouvrir la conversation.`,
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
    body: `${senderName} t’a envoyé une demande d’ami 👋\n👉 Clique pour voir sa demande et y répondre.`,
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

export async function notifyNewSessionNearby({ userId, sport, distance, sessionId }) {
  await notifyUser({
    user_id: userId,
    title: 'Nouvelle session près de toi',
    body: `Une session de ${sport} vient d’être créée à ${distance} km de ta localisation.`,
    type: 'new_session_nearby',
    session_id: sessionId,  // ✅ Ajout
    push: true,
  });
}

export async function notifyCollectiveChallenge({ audienceUserIds = [], challengeTitle, challengeId }) {
  await notifyMany(audienceUserIds, () => ({
    title: 'Nouveau défi collectif',
    body: `${challengeTitle || 'Un nouveau défi vient de commencer !'}\n👉 Clique pour voir les détails et participer.`,
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
    push: true, // confirmation locale
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

export async function notifyFeedbackConfirmation({ userId }) {
  await notifyUser({
    user_id: userId,
    title: 'Merci pour ton retour 🙌',
    body: 'Ton feedback a bien été pris en compte.',
    type: 'feedback_received',
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

export async function notifyNewsletterSubscribed({ userId, email }) {
  await notifyUser({
    user_id: userId,
    title: 'Inscription réussie 🎉',
    body: `Ton email ${email} a bien été inscrit à la newsletter Unite.`,
    type: 'newsletter_subscribed',
    push: true,
  });
}

/* ===========================
   🤝 Amis – suppression
   =========================== */

export async function notifyFriendRemovedSender({ senderId, removedName }) {
  await notifyUser({
    user_id: senderId,
    title: 'Coéquipier supprimé',
    body: `Tu as retiré ${removedName} de tes coéquipiers.`,
    type: 'friend_removed_sender',
    sender_id: null,
    push: false, // confirmation locale
  });
}

export async function notifyFriendRemovedReceiver({ receiverId, removerName }) {
  await notifyUser({
    user_id: receiverId,
    title: 'Coéquipier supprimé',
    body: `${removerName} t’a retiré de ses coéquipiers.`,
    type: 'friend_removed_receiver',
    sender_id: null,
    push: true, // notif visible
  });
}

export async function notifyFriendInvitedToSession({ invitedId, inviterId, inviterName, sessionTitle, sessionId }) {
  await notifyUser({
    user_id: invitedId,
    sender_id: inviterId,
    session_id: sessionId,
    type: 'friend_invited_session',
    title: 'Invitation à une session',
    message: `${inviterName} t’a invité à rejoindre sa session "${sessionTitle}". Clique ici pour la voir.`,
    push: true,
  });
}

/* ===========================
   👥 Groupes
   =========================== */

export async function notifyGroupCreated({ creatorId, groupId, groupName }) {
  if (!creatorId || !groupId) return;
  await notifyUser({
    user_id: creatorId,
    title: 'Groupe créé',
    body: `Le groupe "${groupName}" a bien été créé.`,
    type: 'group_created',
    sender_id: creatorId,
    group_id: groupId,
    push: false,
  });
}

export async function notifyGroupJoinedSelf({ userId, groupName, groupId }) {
  if (!userId || !groupId) return;
  await notifyUser({
    user_id: userId,
    title: 'Groupe rejoint',
    body: `Tu as bien rejoint le groupe "${groupName}".`,
    type: 'group_joined_self',
    sender_id: userId,
    group_id: groupId, // ✅ AJOUT
    push: true,
  });
}

export async function notifyGroupLeftSelf({ userId, groupName, groupId }) {
  if (!userId || !groupId) return;
  await notifyUser({
    user_id: userId,
    title: 'Groupe quitté',
    body: `Tu as bien quitté le groupe "${groupName}".`,
    type: 'group_left_self',
    sender_id: userId,
    group_id: groupId, // ✅ AJOUT
    push: false,
  });
}

export async function notifyGroupDeleted({ creatorId, groupName, groupId }) {
  if (!creatorId || !groupId) return;
  await notifyUser({
    user_id: creatorId,
    title: 'Groupe supprimé',
    body: `Le groupe "${groupName}" a bien été supprimé.`,
    type: 'group_deleted',
    sender_id: creatorId,
    group_id: groupId, // ✅ AJOUT
    push: true,
  });
}

export async function notifyGroupUpdated({ creatorId, groupName, groupId }) {
  if (!creatorId || !groupId) return;
  await notifyUser({
    user_id: creatorId,
    title: 'Groupe modifié',
    body: `Le groupe "${groupName}" a bien été modifié.`,
    type: 'group_updated',
    sender_id: creatorId,
    group_id: groupId, // ✅ AJOUT
    push: true,
  });
}

export async function notifyGroupMemberJoined({ memberName, groupName, groupId, otherMemberIds = [] }) {
  if (!groupId || !otherMemberIds?.length) return;
  await notifyMany(otherMemberIds, () => ({
    title: 'Nouveau membre',
    body: `${memberName} a rejoint le groupe "${groupName}".`,
    type: 'group_member_joined',
    sender_id: null,
    group_id: groupId, // ✅ AJOUT
    push: true,
  }));
}

export async function notifyGroupMemberLeft({ memberName, groupName, groupId, otherMemberIds = [] }) {
  if (!groupId || !otherMemberIds?.length) return;
  await notifyMany(otherMemberIds, () => ({
    title: 'Membre parti',
    body: `${memberName} a quitté le groupe "${groupName}".`,
    type: 'group_member_left',
    sender_id: null,
    group_id: groupId, // ✅ AJOUT
    push: true,
  }));
}

export async function notifyGroupExclusion({ excludedId, excludedName, groupName, groupId, creatorId, otherMemberIds = [] }) {
  if (!groupId) return;

  // Exclu
  if (excludedId) {
    await notifyUser({
      user_id: excludedId,
      title: 'Exclusion du groupe',
      body: `Tu as été exclu du groupe "${groupName}".`,
      type: 'group_excluded_self',
      sender_id: creatorId,
      group_id: groupId, // ✅ AJOUT
      push: true,
    });
  }

  // Créateur (confirmation)
  if (creatorId) {
    await notifyUser({
      user_id: creatorId,
      title: 'Exclusion effectuée',
      body: `Tu as exclu ${excludedName} du groupe "${groupName}".`,
      type: 'group_exclusion_done',
      sender_id: excludedId,
      group_id: groupId, // ✅ AJOUT
      push: false,
    });
  }

  // Autres membres
  if (otherMemberIds?.length) {
    await notifyMany(otherMemberIds, () => ({
      title: 'Membre exclu',
      body: `${excludedName} a été exclu du groupe "${groupName}".`,
      type: 'group_excluded_others',
      sender_id: creatorId,
      group_id: groupId, // ✅ AJOUT
      push: true,
    }));
  }
}

/* ===========================
   👥 Groupes – Sessions
   =========================== */

export async function notifyGroupSessionCreated({ groupId, creatorId, sessionTitle, sessionId }) {
  if (!groupId || !creatorId) return;

  try {
    // 🔹 Récupère tous les membres du groupe sauf le créateur
    const { data: members, error: groupErr } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    if (groupErr) throw groupErr;

    const memberIds = (members || [])
      .map(m => m.user_id)
      .filter(uid => uid !== creatorId);

    if (memberIds.length === 0) return;

    // 🔹 Envoie la notification à chaque membre
    await Promise.all(
      memberIds.map(uid =>
        notifyUser({
          user_id: uid,
          title: 'Nouvelle session dans ton groupe',
          body: `Une nouvelle session "${sessionTitle}" vient d’être créée dans ton groupe.`,
          type: 'group_session_created',
          session_id: sessionId,
          group_id: groupId,
          sender_id: creatorId,
          push: true,
        })
      )
    );

    // 🔹 Confirmation pour le créateur (optionnelle)
    await notifyUser({
      user_id: creatorId,
      title: 'Session créée dans ton groupe',
      body: `Ta session "${sessionTitle}" a bien été publiée dans ton groupe.`,
      type: 'group_session_created_self',
      session_id: sessionId,
      group_id: groupId,
      sender_id: creatorId,
      push: false,
    });

  } catch (e) {
    console.warn('❌ notifyGroupSessionCreated error:', e?.message || e);
  }
}

/* ===========================
   👥 Sessions de groupe — NOTIFS SPÉCIFIQUES
   =========================== */

// 🔹 Quand une session est créée dans un groupe
export async function notifyGroupSessionCreatedForMembers({ groupId, creatorId, sessionTitle, sessionId }) {
  if (!groupId || !creatorId) return;

  try {
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    const memberIds = (members || [])
      .map(m => m.user_id)
      .filter(uid => uid !== creatorId);

    if (memberIds.length === 0) return;

    await Promise.all(
      memberIds.map(uid =>
        notifyUser({
          user_id: uid,
          title: 'Nouvelle session dans ton groupe',
          body: `Une session "${sessionTitle}" vient d’être créée dans ton groupe.`,
          type: 'group_session_created',
          session_id: sessionId,
          group_id: groupId, // ✅ clé essentielle
          sender_id: creatorId,
          push: true,
        })
      )
    );

    // Confirmation pour le créateur (non push)
    await notifyUser({
      user_id: creatorId,
      title: 'Session publiée dans ton groupe',
      body: `Ta session "${sessionTitle}" a bien été publiée dans ton groupe.`,
      type: 'group_session_created_self',
      session_id: sessionId,
      group_id: groupId,
      sender_id: creatorId,
      push: false,
    });
  } catch (e) {
    console.warn('❌ notifyGroupSessionCreatedForMembers error:', e?.message || e);
  }
}

// 🔹 Quand une session de groupe est modifiée
export async function notifyGroupSessionUpdatedForMembers({ groupId, sessionTitle, sessionId, editorId }) {
  if (!groupId || !sessionId) return;

  try {
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    const memberIds = (members || [])
      .map(m => m.user_id)
      .filter(uid => uid !== editorId);

    if (memberIds.length === 0) return;

    await Promise.all(
      memberIds.map(uid =>
        notifyUser({
          user_id: uid,
          title: 'Session mise à jour dans ton groupe',
          body: `La session "${sessionTitle}" de ton groupe a été modifiée.`,
          type: 'group_session_updated',
          session_id: sessionId,
          group_id: groupId,
          sender_id: editorId,
          push: true,
        })
      )
    );
  } catch (e) {
    console.warn('❌ notifyGroupSessionUpdatedForMembers error:', e?.message || e);
  }
}

// 🔹 Quand un membre rejoint une session de groupe
export async function notifyGroupSessionJoinedForMembers({ groupId, joinerName, sessionTitle, sessionId, joinerId }) {
  if (!groupId || !sessionId) return;

  try {
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    const memberIds = (members || [])
      .map(m => m.user_id)
      .filter(uid => uid !== joinerId);

    if (memberIds.length === 0) return;

    await Promise.all(
      memberIds.map(uid =>
        notifyUser({
          user_id: uid,
          title: 'Nouveau participant dans une session du groupe',
          body: `${joinerName} a rejoint la session "${sessionTitle}" du groupe.`,
          type: 'group_session_joined',
          session_id: sessionId,
          group_id: groupId,
          sender_id: joinerId,
          push: true,
        })
      )
    );
  } catch (e) {
    console.warn('❌ notifyGroupSessionJoinedForMembers error:', e?.message || e);
  }
}

/* ===========================
   💬 Messages – Groupes
   =========================== */

export async function notifyGroupNewMessage({ groupId, senderId, senderName, groupName }) {
  try {
    // 🔹 Récupère les membres du groupe sauf l’expéditeur
    const { data: members, error: groupErr } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    if (groupErr) throw groupErr;

    const memberIds = (members || [])
      .map(m => m.user_id)
      .filter(uid => uid !== senderId);

    if (memberIds.length === 0) return;

    // 🔹 Envoie la notif à chaque autre membre
    await Promise.all(
      memberIds.map(uid =>
        notifyUser({
          user_id: uid,
          title: 'Nouveau message dans le groupe',
          body: `${senderName} a écrit dans "${groupName}".`,
          type: 'group_new_message',
          group_id: groupId,
          sender_id: senderId,
          push: true,
        })
      )
    );

    console.log(`📩 notifyGroupNewMessage envoyé à ${memberIds.length} membres`);
  } catch (e) {
    console.warn('❌ notifyGroupNewMessage error:', e?.message || e);
  }
}

/* ===========================
   💳 Paiement Unite+
   =========================== */

export async function notifyPaymentSuccess({ userId }) {
  await notifyUser({
    user_id: userId,
    title: 'Paiement réussi !',
    body: 'Votre paiement a été accepté ! Bienvenue sur Unite+',
    type: 'payment_success',
    push: true,
  });
}

