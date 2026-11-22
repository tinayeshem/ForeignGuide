import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { Stack, router, Href } from 'expo-router'
import { useIsAdmin } from '../features/admin/useIsAdmin'

type Tile = {
  icon: string
  title: string
  description: string
  href: Href
}

const TILES: Tile[] = [
  {
    icon: '🧮',
    title: 'Benefit calculator',
    description: 'How long and how much maternity benefit you and your partner can get.',
    href: '/calculator',
  },
  {
    icon: '📂',
    title: 'Sample cases',
    description: 'Pick a ZUS sample case, check insurance and compare the calculation.',
    href: '/cases',
  },
  {
    icon: '🤰',
    title: 'Benefits in pregnancy',
    description: 'Can you get sickness benefit while pregnant? Who pays and what to submit.',
    href: '/pregnancy',
  },
  {
    icon: '⚠️',
    title: 'Risks & your rights',
    description: 'What can cost you your benefits – and how the law protects you.',
    href: '/risks',
  },
  {
    icon: '✅',
    title: 'My checklist',
    description: 'Your personal deadlines, documents and where to go.',
    href: '/timeline',
  },
  {
    icon: '🗣️',
    title: 'Phrasebook',
    description: 'Polish phrases for ZUS, the office, hospital and doctor – with audio.',
    href: '/phrasebook',
  },
]

const ADMIN_TILE: Tile = {
  icon: '🛠️',
  title: 'Admin panel',
  description: 'Edit benefit rates, leave lengths and information cards.',
  href: '/admin',
}

export default function HomeScreen() {
  const { isAdmin } = useIsAdmin()
  const tiles = isAdmin ? [...TILES, ADMIN_TILE] : TILES

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Parent Guide' }} />

      <Text style={styles.title}>Your guide to parental benefits 👶</Text>
      <Text style={styles.subtitle}>
        Pregnancy, birth, adoption – what ZUS pays, how to apply, and what not to miss.
      </Text>

      <View style={styles.grid}>
        {tiles.map((tile) => (
          <Pressable key={tile.title} style={styles.tile} onPress={() => router.push(tile.href)}>
            <Text style={styles.tileIcon}>{tile.icon}</Text>
            <Text style={styles.tileTitle}>{tile.title}</Text>
            <Text style={styles.tileText}>{tile.description}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    flexGrow: 1,
    flexBasis: 220,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    gap: 6,
    elevation: 2,
  },
  tileIcon: { fontSize: 32 },
  tileTitle: { fontSize: 17, fontWeight: '700', color: '#0b3a5e' },
  tileText: { fontSize: 14, color: '#555', lineHeight: 20 },
})
