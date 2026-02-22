import React, { memo } from 'react';
import { Ionicons, Feather } from '@expo/vector-icons';
import { PixelRatio } from 'react-native';

const ICON_COLOR = '#FE5D02';

function GradientIcon({ name, size = 18, type = 'Feather', style }) {
  const s = Math.ceil(PixelRatio.roundToNearestPixel(size));
  const IconSet = type === 'Ionicons' ? Ionicons : Feather;

  return (
    <IconSet
      name={name}
      size={s}
      color={ICON_COLOR}
      style={style}
    />
  );
}

export default memo(GradientIcon);
