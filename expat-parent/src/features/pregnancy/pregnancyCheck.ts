export type ContractType = 'employment' | 'mandate' | 'self_employed' | 'none'
export type JobLoss = 'no' | 'bankruptcy' | 'unlawful'
export type PregnancyStatus = 'eligible' | 'waiting' | 'not_insured' | 'special_allowance'

export type PregnancyInput = {
  contract: ContractType
  insuredSince: string // YYYY-MM-DD
  voluntarySickness: boolean // mandate / self-employed: joined voluntary sickness insurance?
  sickLeaveStart: string // YYYY-MM-DD (planned or actual first day of sick leave)
  grossSalary: number // gross salary or declared contribution base, zł / month
  age50plus: boolean
  unpaidContributions: boolean // self-employed only
  jobLoss: JobLoss
}

export type PregnancyResult = {
  status: PregnancyStatus
  headline: string
  waitingDays: number
  daysInsured: number | null
  daysLeft: number
  eligibleFrom: Date | null
  base: number
  monthlyAmount: number
  dailyAmount: number
  whoPays: string[]
  documents: string[]
  warnings: string[]
  notes: string[]
}

type Params = Record<string, number>

const DAY_MS = 24 * 60 * 60 * 1000
const round2 = (n: number) => Math.round(n * 100) / 100

function param(params: Params, key: string, fallback: number): number {
  const v = params[key]
  return typeof v === 'number' && !isNaN(v) ? v : fallback
}

export function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return date
}

export function todayString(): string {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${mm}-${dd}`
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS)
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function checkPregnancy(params: Params, input: PregnancyInput): PregnancyResult {
  const warnings: string[] = []
  const notes: string[] = []
  const whoPays: string[] = []
  const documents: string[] = []

  const contributions = param(params, 'social_contribution_rate', 13.71)
  const rate = param(params, 'sickness_rate_pregnancy', 100)
  const maxDays = param(params, 'sickness_max_days', 270)
  const employerDays = input.age50plus
    ? param(params, 'employer_sick_pay_days_50plus', 14)
    : param(params, 'employer_sick_pay_days', 33)

  const base = input.grossSalary > 0 ? round2(input.grossSalary * (1 - contributions / 100)) : 0
  const monthlyAmount = round2(base * (rate / 100))
  const dailyAmount = round2(monthlyAmount / 30)

  const empty = {
    waitingDays: 0,
    daysInsured: null,
    daysLeft: 0,
    eligibleFrom: null,
    base,
    monthlyAmount,
    dailyAmount,
  }

  // ----- Special case: job lost during pregnancy -----
  if (input.jobLoss !== 'no') {
    documents.push(
      input.jobLoss === 'bankruptcy'
        ? 'Proof that the employment ended because of the employer\'s bankruptcy, liquidation or death'
        : 'Final (legally binding) court judgment confirming the termination broke the law'
    )
    documents.push('Application for the benefit, submitted to ZUS')
    whoPays.push('ZUS pays the benefit until the day of the birth.')
    notes.push('After the birth, ask ZUS about your right to maternity benefit.')
    return {
      status: 'special_allowance',
      headline: `You may get a benefit equal to maternity benefit (${param(params, 'rate_maternity', 100)}% of your benefit base) until the birth.`,
      ...empty,
      whoPays,
      documents,
      warnings,
      notes,
    }
  }

  // ----- No insurance title -----
  if (input.contract === 'none') {
    notes.push(
      'Sickness benefit is only for people covered by sickness insurance (e.g. employment contract, or a mandate contract / business with voluntary sickness insurance).'
    )
    return {
      status: 'not_insured',
      headline: 'Without sickness insurance you have no right to sickness benefit in pregnancy.',
      ...empty,
      whoPays,
      documents,
      warnings,
      notes,
    }
  }

  // ----- Mandate / self-employed without voluntary sickness insurance -----
  if (input.contract !== 'employment' && !input.voluntarySickness) {
    notes.push(
      `You can join voluntary sickness insurance. The right to benefit usually starts after ${param(params, 'sickness_wait_voluntary_days', 90)} days of insurance.`
    )
    warnings.push(
      'Joining insurance or raising your contribution base during pregnancy only to get higher benefits can be challenged by ZUS.'
    )
    return {
      status: 'not_insured',
      headline: 'You are not covered by voluntary sickness insurance, so no sickness benefit is paid.',
      ...empty,
      whoPays,
      documents,
      warnings,
      notes,
    }
  }

  // ----- Waiting period -----
  const waitingDays =
    input.contract === 'employment'
      ? param(params, 'sickness_wait_compulsory_days', 30)
      : param(params, 'sickness_wait_voluntary_days', 90)

  const since = parseDate(input.insuredSince)
  const start = parseDate(input.sickLeaveStart) ?? parseDate(todayString())!

  let daysInsured: number | null = null
  let daysLeft = 0
  let eligibleFrom: Date | null = null
  let status: PregnancyStatus = 'eligible'

  if (!since) {
    notes.push('Enter the date your insurance started to check the waiting period.')
  } else {
    daysInsured = Math.max(0, daysBetween(since, start))
    eligibleFrom = addDays(since, waitingDays)
    if (daysInsured < waitingDays) {
      status = 'waiting'
      daysLeft = waitingDays - daysInsured
    }
  }

  notes.push(
    'Earlier insurance periods can count towards the waiting period (e.g. if the break was no longer than 30 days). ZUS checks this individually.'
  )

  // ----- Who pays -----
  if (input.contract === 'employment') {
    whoPays.push(
      `First ${employerDays} days of sick leave in a calendar year: your employer pays sick pay (wynagrodzenie chorobowe).`
    )
    whoPays.push(
      'After that: sickness benefit from your employer if it has more than 20 insured people, otherwise from ZUS.'
    )
    documents.push('Doctor\'s e-ZLA with code "B" (pregnancy) – sent electronically to ZUS and your employer')
    documents.push('Inform your employer about your absence')
    documents.push('If ZUS pays: your employer sends the Z-3 form (ZAS-12 for further periods)')
  } else if (input.contract === 'mandate') {
    whoPays.push('From the first day: sickness benefit from ZUS, or from the payer if it has more than 20 insured people.')
    documents.push('Doctor\'s e-ZLA with code "B" (pregnancy)')
    documents.push('Stop working during the sick leave')
    documents.push('If ZUS pays: the payer sends the Z-3a form')
  } else {
    whoPays.push('From the first day: sickness benefit from ZUS.')
    documents.push('Doctor\'s e-ZLA with code "B" (pregnancy)')
    documents.push('Stop working during the sick leave')
    documents.push('Submit the ZAS-53 application to ZUS')
    if (input.unpaidContributions) {
      warnings.push(
        'You have unpaid contributions. ZUS will not pay the benefit until the debt from the day your right begins is paid – check your account on PUE/eZUS.'
      )
    }
  }

  notes.push(
    `In pregnancy the benefit is ${rate}% of your benefit base (code "B" on the e-ZLA), for up to ${maxDays} days.`
  )
  notes.push('If you are still on sick leave at the birth, maternity benefit starts after the birth.')

  const headline =
    status === 'waiting'
      ? `Not yet – ${daysLeft} more day${daysLeft === 1 ? '' : 's'} of insurance needed.`
      : `You can get sickness benefit in pregnancy at ${rate}%.`

  return {
    status,
    headline,
    waitingDays,
    daysInsured,
    daysLeft,
    eligibleFrom,
    base,
    monthlyAmount,
    dailyAmount,
    whoPays,
    documents,
    warnings,
    notes,
  }
}