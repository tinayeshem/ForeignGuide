import { ReactNode, useState } from 'react'
import { Animated, Platform, Pressable, StyleProp, ViewStyle } from 'react-native'
import { shadow } from './theme'

type Props = {
  children: ReactNode
  onPress?: () => void
  /** Style for the outer clickable area (use for flex / width in grids) */
  containerStyle?: StyleProp<ViewStyle>
  /** Style for the card itself */
  style?: StyleProp<ViewStyle>
  lift?: number
}

/** A card that lifts on hover and squishes when pressed. */
export function HoverCard({ children, onPress, containerStyle, style, lift = 6 }: Props) {
  const [anim] = useState(() => new Animated.Value(0))
  const [hovered, setHovered] = useState(false)

  const animateTo = (value: number) => {
    Animated.spring(anim, {
      toValue: value,
      speed: 22,
      bounciness: 7,
      useNativeDriver: Platform.OS !== 'web',
    }).start()
  }

  return (
    <Pressable
      onPress={onPress}
      style={containerStyle}
      onHoverIn={() => {
        setHovered(true)
        animateTo(1)
      }}
      onHoverOut={() => {
        setHovered(false)
        animateTo(0)
      }}
      onPressIn={() => animateTo(-1)}
      onPressOut={() => animateTo(hovered ? 1 : 0)}
    >
      <Animated.View
        style={[
          style,
          hovered ? shadow.cardHover : shadow.card,
          {
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [0, 0, -lift],
                }),
              },
              {
                scale: anim.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [0.97, 1, 1.02],
                }),
              },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  )
}
