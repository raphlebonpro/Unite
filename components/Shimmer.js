// components/Shimmer.js
import React, { useRef, useEffect } from "react";
import { Animated, View, StyleSheet } from "react-native";

export default function Shimmer({ height = 140, radius = 14, style }) {
  const translate = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(translate, { toValue: 200, duration: 1400, useNativeDriver: true })
    ).start();
  }, [translate]);

  return (
    <View style={[styles.container, { height, borderRadius: radius }, style]}>
      <Animated.View
        style={[
          styles.shine,
          { transform: [{ translateX: translate }], height, borderRadius: radius },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#EEE",
    overflow: "hidden",
  },
  shine: {
    width: 80,
    backgroundColor: "rgba(255,255,255,0.6)",
    opacity: 0.7,
    transform: [{ rotate: "12deg" }],
  },
});
