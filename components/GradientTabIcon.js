import React from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

const GRADIENT_COLORS = ['#FF9D3C', '#FF6C4A', '#FF375E'];

export default function GradientTabIcon({ IconComponent, name, size, style }) {
  return (
    <MaskedView
      maskElement={
        <IconComponent name={name} size={size} color="black" style={style} />
      }
    >
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: size, height: size }}
      />
    </MaskedView>
  );
}
