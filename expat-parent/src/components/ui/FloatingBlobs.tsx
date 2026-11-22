import { useEffect, useState } from 'react'
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native'

/** Soft, slowly floating circles for gradient backgrounds. */
export function FloatingBlobs() {
  const [a] = useState(() => new Animated.Value(0))
  const [b] = useState(() => new Animated.Value(0))

  useEffect(() => {
    const loop = (value: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(value, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      )

    const l1 = loop(a, 4200)
    const l2 = loop(b, 5600)
    l1.start()
    l2.start()
    return () => {
      l1.stop()
      l2.stop()
    }
  }, [a, b])

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          styles.blob,
          styles.blobOne,
          {
            transform: [
              { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, 26] }) },
              { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }) },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blobTwo,
          {
            transform: [
              { translateY: b.interpolate({ inputRange: [0, 1], outputRange: [0, -22] }) },
              { translateX: b.interpolate({ inputRange: [0, 1], outputRange: [0, 18] }) },
            ],
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  blob: { position: 'absolute', borderRadius: 999 },
  blobOne: {
    width: 260,
    height: 260,
    right: -60,
    top: -80,
    backgroundColor: 'rgba(255, 200, 87, 0.28)',
  },
  blobTwo: {
    width: 200,
    height: 200,
    left: -50,
    bottom: -90,
    backgroundColor: 'rgba(255, 122, 89, 0.22)',
  },
})
