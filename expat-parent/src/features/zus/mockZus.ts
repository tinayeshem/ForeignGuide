// =====================================================
// SIMULATED ZUS DATA – fictional people, for the demo only.
// No real personal data. No real connection to ZUS or mObywatel.
// =====================================================

export type SicknessCover = 'compulsory' | 'voluntary' | 'none'

export type InsurancePeriod = {
  payer: string
  title: string
  from: string
  to: string | null
  sickness: SicknessCover
}

export type EZla = {
  number: string
  from: string
  to: string
  code: string
  reason: string
  status: string
}

export type MockProfile = {
  id: string
  name: string
  summary: string
  pesel: string
  insurance: InsurancePeriod[]
  arrears: number
  ezla: EZla[]
}

export const MOCK_PROFILES: MockProfile[] = [
  {
    id: 'anna',
    name: 'Anna Nowak (fictional)',
    summary: 'Employment contract, insured, 2 sick leaves in pregnancy',
    pesel: '•••••••••••',
    insurance: [
      {
        payer: 'Example Logistics Sp. z o.o.',
        title: 'Employment contract (umowa o pracę)',
        from: '2023-03-01',
        to: null,
        sickness: 'compulsory',
      },
      {
        payer: 'Sample Retail S.A.',
        title: 'Employment contract (umowa o pracę)',
        from: '2020-06-01',
        to: '2023-02-28',
        sickness: 'compulsory',
      },
    ],
    arrears: 0,
    ezla: [
      {
        number: 'SIM-ZLA-104512',
        from: '2026-09-01',
        to: '2026-09-30',
        code: 'B',
        reason: 'Sick leave during pregnancy',
        status: 'Sent to employer',
      },
      {
        number: 'SIM-ZLA-109873',
        from: '2026-10-01',
        to: '2026-10-31',
        code: 'B',
        reason: 'Sick leave during pregnancy',
        status: 'Sent to employer',
      },
    ],
  },
  {
    id: 'marta',
    name: 'Marta Wiśniewska (fictional)',
    summary: 'Own business, NO voluntary sickness insurance, unpaid contributions',
    pesel: '•••••••••••',
    insurance: [
      {
        payer: 'Own business (JDG)',
        title: 'Self-employment',
        from: '2025-02-01',
        to: null,
        sickness: 'none',
      },
    ],
    arrears: 1250.4,
    ezla: [
      {
        number: 'SIM-ZLA-201337',
        from: '2026-10-15',
        to: '2026-11-14',
        code: 'B',
        reason: 'Sick leave during pregnancy',
        status: 'Received by ZUS',
      },
    ],
  },
]

export function getMockProfile(id: string): MockProfile {
  return MOCK_PROFILES.find((p) => p.id === id) ?? MOCK_PROFILES[0]
}

export function isSicknessInsuredToday(profile: MockProfile): boolean {
  return profile.insurance.some((p) => p.to === null && p.sickness !== 'none')
}

export function simulatedReference(prefix: string): string {
  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const random = Math.floor(100000 + Math.random() * 900000)
  return `${prefix}-${stamp}-${random}`
}