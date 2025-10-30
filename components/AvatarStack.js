// components/AvatarStack.js
import React from "react";
import { View, Image, StyleSheet } from "react-native";

export default function AvatarStack({ urls = [], size = 28, limit = 3 }) {
  const slice = urls.slice(0, limit);
  return (
    <View style={styles.row}>
      {slice.map((u, idx) => (
        <Image
          key={idx}
          source={{ uri: u }}
          style={[
            styles.avatar,
            { width: size, height: size, borderRadius: size / 2, left: idx * (size * 0.55) },
          ]}
        />
      ))}
      {urls.length > limit && (
        <View
          style={[
            styles.more,
            { width: size, height: size, borderRadius: size / 2, left: limit * (size * 0.55) },
          ]}
        >
          <Image source={{ uri: urls[limit] }} style={{ width: size, height: size, opacity: 0 }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 28, position: "relative" },
  avatar: { position: "absolute", borderWidth: 2, borderColor: "#fff" },
  more: {
    position: "absolute",
    backgroundColor: "#ddd",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
