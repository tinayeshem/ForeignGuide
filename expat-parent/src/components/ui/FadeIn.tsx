import { ReactNode, useEffect, useState } from 'react'
import { Animated, Easing, Platform, StyleProp, ViewStyle } from 'react-native'

type Props = {
  children: ReactNode
  delay?: number
  distance?: number
  duration?: number
  style?: StyleProp<ViewStyle>
}

/** Fades and slides its content in when it first appears. */
export function FadeIn({ children, delay = 0, distance = 18, duration = 550, style }: Props) {
  const [progress] = useState(() => new Animated.Value(0))

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start()
  }, [progress, delay, duration])

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  )
}
