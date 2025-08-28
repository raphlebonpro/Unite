import React, { memo } from 'react';
import { Text, View, PixelRatio } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const GRADIENT_COLORS = ['#FFAD75', '#FF8269', '#FF5361'];

function GradientTitle({ children, style, width }) {
  const titleWidth = width ? wp(width) : wp('48%');
  const titleHeight = hp('3.3%'); // légèrement plus haut
  const fontSizeDefault = wp('4.5%'); // augmenté

  const h = Math.ceil(PixelRatio.roundToNearestPixel(titleHeight));

  return (
    <View style={{ width: titleWidth, height: h, alignItems: 'center', justifyContent: 'center' }}>
      <MaskedView
        style={{ flex: 1, flexDirection: 'row', height: h }}
        maskElement={
          <Text
            style={[
              {
                backgroundColor: 'transparent',
                width: titleWidth,
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: fontSizeDefault,
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
        }
      >
        <LinearGradient
          colors={GRADIENT_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, height: h }}
        />
      </MaskedView>
    </View>
  );
}

export default memo(GradientTitle);

