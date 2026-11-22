import { useEffect, useState } from 'react'
import { Animated, Easing, StyleProp, Text, TextStyle } from 'react-native'

type Props = {
  value: number
  format: (n: number) => string
  style?: StyleProp<TextStyle>
  duration?: number
}

/** Counts smoothly from the previous value to the new one. */
export function AnimatedNumber({ value, format, style, duration = 650 }: Props) {
  const [anim] = useState(() => new Animated.Value(value))
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setDisplay(v))
    Animated.timing(anim, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
    return () => anim.removeListener(id)
  }, [anim, value, duration])

  return <Text style={style}>{format(display)}</Text>
}
