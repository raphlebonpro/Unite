import React, { memo } from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { PixelRatio } from 'react-native';

const GRADIENT_COLORS = ['#FFAD75', '#FF8269', '#FF5361'];

function GradientIcon({ name, size = 18, style }) {
  const s = Math.ceil(PixelRatio.roundToNearestPixel(size));

  return (
    <MaskedView
      maskElement={<Feather name={name} size={s} color="black" style={style} />}
    >
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
