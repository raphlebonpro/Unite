import React from 'react';
import { Platform, StatusBar, KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ResponsiveScreen({
  children,
  scroll = true,
  bg = '#fff',
  padH = 20,
  padV = 0,
  contentStyle,
  footer,
  footerPadded = true,
}) {
  const insets = useSafeAreaInsets();

  const Inner = (
    <View style={[{ flexGrow: 1, paddingHorizontal: padH, paddingVertical: padV }, contentStyle]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top','left','right']}>
      {Platform.OS === 'android' ? <View style={{ height: StatusBar.currentHeight ?? 0 }} /> : null}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {Inner}
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>{Inner}</View>
        )}
      </KeyboardAvoidingView>

      {footer ? (
        <View style={{ position: 'absolute', left: padH, right: padH, bottom: (footerPadded ? insets.bottom : 0) + 12 }}>
          {footer}
        </View>
      ) : null}
    </SafeAreaView>
  );
}
