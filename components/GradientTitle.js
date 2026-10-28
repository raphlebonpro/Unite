import React, { memo } from 'react';
import { Text, PixelRatio } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const TITLE_COLOR = '#FE5D02';

function GradientTitle({ children, style, width }) {
  const titleWidth = width ? wp(width) : wp('48%');
  const titleHeight = hp('3.3%');
  const fontSizeDefault = wp('4.5%');
  const h = Math.ceil(PixelRatio.roundToNearestPixel(titleHeight));

  return (
    <Text
      style={[
        {
          width: titleWidth,
          height: h,
          fontWeight: 'bold',
          fontSize: fontSizeDefault,
          color: TITLE_COLOR,
          textAlign: 'center',
        },
        style,
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.9}
      ellipsizeMode="tail"
    >
      {children}
    </Text>
  );
}

export default memo(GradientTitle);
