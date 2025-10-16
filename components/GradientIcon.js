import React, { memo } from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { PixelRatio } from 'react-native';

const GRADIENT_COLORS = ['#FF9D3C', '#FF6C4A', '#FF375E'];

function GradientIcon({ name, size = 18, type = 'Feather', style }) {
  const s = Math.ceil(PixelRatio.roundToNearestPixel(size));

  const IconSet = type === 'Ionicons' ? Ionicons : Feather;

  return (
    <MaskedView maskElement={<IconSet name={name} size={s} color="black" style={style} />}>
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: s, height: s }}
      />
    </MaskedView>
  );
}

export default memo(GradientIcon);
