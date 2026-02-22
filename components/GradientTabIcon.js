import React from 'react';

const ICON_COLOR = '#FE5D02';

export default function GradientTabIcon({ IconComponent, name, size, style }) {
  return (
    <IconComponent
      name={name}
      size={size}
      color={ICON_COLOR}
      style={style}
    />
  );
}
