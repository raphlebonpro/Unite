import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { RARITY, getBadgeRarity } from '../constants/badges';

// ─── BADGE PILL ───────────────────────────────────────────────────────────────

const BadgePill = ({ badge, onPress }) => {
  const rarity = getBadgeRarity(badge.code);

  return (
    <TouchableOpacity
      onPress={() => onPress(badge)}
      activeOpacity={0.78}
      style={[
        S.pill,
        {
          backgroundColor: rarity.bg,
          borderColor:      rarity.border,
        },
      ]}
    >
      <Text style={S.pillEmoji}>{badge.emoji}</Text>
      <Text style={[S.pillLabel, { color: rarity.color }]}>{badge.label}</Text>
    </TouchableOpacity>
  );
};

// ─── BADGE DETAIL MODAL ───────────────────────────────────────────────────────

const BadgeModal = ({ badge, visible, onClose }) => {
  if (!badge) return null;
  const rarity = getBadgeRarity(badge.code);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={S.overlay} onPress={onClose}>
        <Pressable style={S.modalCard} onPress={() => {}}>
          {/* Indicateur de rareté */}
          <View style={[S.rarityBar, { backgroundColor: rarity.color }]} />

          {/* Emoji */}
          <Text style={S.modalEmoji}>{badge.emoji}</Text>

          {/* Rareté label */}
          <View style={[S.rarityPill, { backgroundColor: rarity.bg, borderColor: rarity.border }]}>
            <Text style={[S.rarityPillText, { color: rarity.color }]}>
              {rarity.label}
            </Text>
          </View>

          {/* Titre + description */}
          <Text style={S.modalTitle}>{badge.label}</Text>
          <Text style={S.modalDesc}>{badge.desc}</Text>

          {/* Fermer */}
          <TouchableOpacity style={[S.modalCloseBtn, { backgroundColor: rarity.color }]} onPress={onClose} activeOpacity={0.88}>
            <Text style={S.modalCloseBtnText}>Fermer</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function UserBadges({ badges }) {
  const [selected, setSelected] = useState(null);

  if (!badges || badges.length === 0) return null;

  // Trie par rareté : legendary > special > gold > silver > bronze
  const RARITY_ORDER = ['legendary', 'special', 'gold', 'silver', 'bronze'];
  const sorted = [...badges].sort((a, b) => {
    const ra = BADGE_ICONS_MAP[a.code]?.rarity ?? 'bronze';
    const rb = BADGE_ICONS_MAP[b.code]?.rarity ?? 'bronze';
    return RARITY_ORDER.indexOf(ra) - RARITY_ORDER.indexOf(rb);
  });

  return (
    <>
      <View style={S.container}>
        {sorted.map(badge => (
          <BadgePill
            key={badge.code}
            badge={badge}
            onPress={setSelected}
          />
        ))}
      </View>

      <BadgeModal
        badge={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

// Map locale pour accéder à la rareté sans circular import
import { BADGE_ICONS as BADGE_ICONS_MAP } from '../constants/badges';

// ─── STYLES ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: hp('1%'),
    marginBottom: hp('1.6%'),
    paddingHorizontal: wp('2%'),
  },

  // Pill
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.8%'),
    borderRadius: 20,
    borderWidth: 1.5,
  },
  pillEmoji: {
    fontSize: wp('4.5%'),
  },
  pillLabel: {
    fontSize: wp('3.4%'),
    fontWeight: '700',
  },

  // Modal overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('8%'),
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 24,
    paddingHorizontal: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  rarityBar: {
    width: '100%',
    height: 5,
    marginBottom: 20,
  },
  modalEmoji: {
    fontSize: 52,
    marginBottom: 12,
  },
  rarityPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  rarityPillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  modalDesc: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
    paddingHorizontal: 8,
  },
  modalCloseBtn: {
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 14,
  },
  modalCloseBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});
