// PickerModal.js
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, Platform } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

export default function PickerModal({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={{marginTop: 10}}>
            {options.map((opt, i) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.optionBtn,
                  value === opt && styles.optionBtnSelected,
                ]}
                onPress={() => {
                  onSelect(opt);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    value === opt && styles.optionTextSelected,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(30,30,30,0.35)' : '#0006',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: wp('86%'),                    // 86% largeur écran
    borderRadius: wp('5.5%'),            // ~22 sur base 390px
    backgroundColor: '#fff',
    paddingVertical: hp('2.5%'),         // ~20
    paddingHorizontal: wp('3.6%'),       // ~14
    alignItems: 'center',
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: wp('4.3%'),            // ~17
    shadowOffset: { width: 0, height: hp('1.1%') }, // ~9
  },
  modalTitle: {
    fontWeight: '700',
    fontSize: wp('4.6%'),                // ~18
    color: '#222',
    marginBottom: hp('0.7%'),            // ~6
    letterSpacing: 0.2,
  },
  optionBtn: {
    paddingVertical: hp('1.9%'),         // ~15
    width: wp('52%'),                    // ~200 sur base 390px
    alignItems: 'center',
    borderRadius: wp('3.9%'),            // ~15
    marginBottom: hp('0.75%'),           // ~6
    backgroundColor: '#F7F8FA',
  },
  optionBtnSelected: {
    backgroundColor: '#4C8BF5',
  },
  optionText: {
    fontSize: wp('4.4%'),                // ~17
    color: '#333',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
});
