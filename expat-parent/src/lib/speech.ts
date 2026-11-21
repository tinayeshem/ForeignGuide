import * as Speech from 'expo-speech'

// Cached Polish voice ID (only cached once found)
let polishVoiceId: string | null = null

function isPolish(language: string | undefined): boolean {
  if (!language) return false
  return language.toLowerCase().replace('_', '-').startsWith('pl')
}

/**
 * Finds the best Polish voice on this phone.
 * Prefers "Enhanced" quality. Returns null if none installed.
 */
export async function getPolishVoice(): Promise<string | null> {
  if (polishVoiceId) return polishVoiceId

  try {
    const voices = await Speech.getAvailableVoicesAsync()
    const polishVoices = voices.filter((v) => isPolish(v.language))

    const best =
      polishVoices.find((v) => v.quality === Speech.VoiceQuality.Enhanced) ??
      polishVoices[0]

    if (best) {
      polishVoiceId = best.identifier
      return polishVoiceId
    }
  } catch (e) {
    console.log('VOICE LOOKUP ERROR:', e)
  }

  return null
}

export async function hasPolishVoice(): Promise<boolean> {
  return (await getPolishVoice()) !== null
}

type SpeakOptions = {
  slow?: boolean
  onDone?: () => void
}

/**
 * Speaks Polish text using the best Polish voice available.
 * Use this everywhere in the app instead of calling expo-speech directly.
 */
export async function speakPolish(text: string, options: SpeakOptions = {}) {
  const voice = await getPolishVoice()

  Speech.stop()
  Speech.speak(text, {
    language: 'pl-PL',
    voice: voice ?? undefined,
    rate: options.slow ? 0.6 : 0.9,
    onDone: options.onDone,
    onStopped: options.onDone,
    onError: options.onDone,
  })
}

export function stopSpeaking() {
  Speech.stop()
}