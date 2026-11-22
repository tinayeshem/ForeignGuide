import type { Lang } from '../../i18n/translations'

export type Params = Record<string, number>
export type Mode = 'birth' | 'adoption' | 'foster'
export type ParentKey = 'mother' | 'father'
export type PeriodType = 'maternity' | 'supplementary' | 'parental' | 'paternity'

export type ParentInput = {
  insured: boolean
  amount: number // gross monthly salary OR benefit base
  amountIsBase: boolean // true = amount is already the benefit base (e.g. from Z-3)
  parentalWeeks: number
  workPercent: number // % of full time worked during parental leave (0–50)
}

export type CalculatorInput = {
  mode: Mode
  children: number
  zaZyciem: boolean
  childAgeYears: number
  singleApplication: boolean // 81.5% option
  supplementaryWeeks: number
  maternityTransferWeeks: number // maternity weeks handed to the father
  fatherPaternity: boolean
  mother: ParentInput
  father: ParentInput
}

export type Period = {
  parent: ParentKey
  type: PeriodType
  baseWeeks: number // weeks of leave entitlement
  weeks: number // calendar weeks (longer if combined with work)
  ratePercent: number
  workPercent: number
  monthlyAmount: number
  totalAmount: number
}

export type Limits = {
  maternityWeeks: number
  personalWeeks: number
  maternityTransferMax: number
  parentalTotal: number
  reservedWeeks: number
  parentalMaxPerParent: number
  supplementaryMax: number
  paternityWeeks: number
  workMaxPercent: number
}

export type ParentTotal = { weeks: number; amount: number }

export type CalculatorResult = {
  limits: Limits
  bases: Record<ParentKey, number>
  periods: Period[]
  totals: { mother: ParentTotal; father: ParentTotal; all: number }
  warnings: string[]
  notes: string[]
}

// ---------- helpers ----------

const round2 = (n: number) => Math.round(n * 100) / 100
const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)

function param(params: Params, key: string, fallback: number): number {
  const v = params[key]
  return typeof v === 'number' && !isNaN(v) ? v : fallback
}

export function getLimits(params: Params, input: CalculatorInput): Limits {
  const kids = clamp(Math.round(input.children), 1, 5)
  const multiple = kids > 1
  const maternityWeeks = param(params, `maternity_weeks_${kids}`, 20)
  const personalWeeks = param(params, 'maternity_personal_weeks', 14)
  const reservedWeeks = param(params, 'parental_reserved_weeks', 9)

  const parentalTotal = input.zaZyciem
    ? param(params, multiple ? 'parental_weeks_zz_multiple' : 'parental_weeks_zz_single', multiple ? 67 : 65)
    : param(params, multiple ? 'parental_weeks_multiple' : 'parental_weeks_single', multiple ? 43 : 41)

  return {
    maternityWeeks,
    personalWeeks,
    maternityTransferMax: input.mode === 'birth' ? Math.max(0, maternityWeeks - personalWeeks) : 0,
    parentalTotal,
    reservedWeeks,
    parentalMaxPerParent: parentalTotal - reservedWeeks,
    supplementaryMax: input.mode === 'birth' ? param(params, 'supplementary_max_weeks', 15) : 0,
    paternityWeeks: param(params, 'paternity_weeks', 2),
    workMaxPercent: param(params, 'work_max_fraction', 50),
  }
}

export function benefitBase(parent: ParentInput, params: Params): number {
  if (!parent.insured || parent.amount <= 0) return 0
  if (parent.amountIsBase) return round2(parent.amount)
  const contributions = param(params, 'social_contribution_rate', 13.71)
  return round2(parent.amount * (1 - contributions / 100))
}

function makePeriod(
  parent: ParentKey,
  type: PeriodType,
  baseWeeks: number,
  ratePercent: number,
  base: number,
  workPercent = 0
): Period {
  const f = workPercent / 100
  const weeks = f > 0 ? baseWeeks / (1 - f) : baseWeeks
  // Benefit for a full month (30 days); reduced when working part-time
  const monthlyAmount = round2(base * (ratePercent / 100) * (1 - f))
  // Total stays the same when working – it is spread over a longer period
  const totalAmount = round2(((base * (ratePercent / 100)) / 30) * baseWeeks * 7)

  return {
    parent,
    type,
    baseWeeks,
    weeks: round2(weeks),
    ratePercent,
    workPercent,
    monthlyAmount,
    totalAmount,
  }
}

function summarize(periods: Period[]) {
  const sum = (pk: ParentKey): ParentTotal => {
    const ps = periods.filter((p) => p.parent === pk)
    return {
      weeks: round2(ps.reduce((s, p) => s + p.weeks, 0)),
      amount: round2(ps.reduce((s, p) => s + p.totalAmount, 0)),
    }
  }
  const mother = sum('mother')
  const father = sum('father')
  return { mother, father, all: round2(mother.amount + father.amount) }
}

// ---------- main calculation ----------

export function calculate(
  params: Params,
  input: CalculatorInput,
  lang: Lang = 'en'
): CalculatorResult {
  const L = (en: string, pl: string) => (lang === 'pl' ? pl : en)
  const limits = getLimits(params, input)
  const warnings: string[] = []
  const notes: string[] = []
  const periods: Period[] = []

  const bases = {
    mother: benefitBase(input.mother, params),
    father: benefitBase(input.father, params),
  }

  const isBirth = input.mode === 'birth'
  const rateMaternity = param(params, 'rate_maternity', 100)
  const rateSupplementary = param(params, 'rate_supplementary', 100)
  const ratePaternity = param(params, 'rate_paternity', 100)
  const rateParental = param(params, 'rate_parental', 70)
  const rateSingle = param(params, 'rate_single_application', 81.5)
  const singleDeadline = param(params, 'single_application_deadline_days', 21)
  const paternityMonths = param(params, 'paternity_max_child_age_months', 12)

  // Adoption / foster care: child age limit
  if (!isBirth) {
    const maxAge =
      input.mode === 'foster'
        ? param(params, 'adoption_max_age_foster', 7)
        : param(params, 'adoption_max_age_adoption', 14)

    if (input.childAgeYears > maxAge) {
      warnings.push(
        L(
          `Leave on maternity-leave terms is only available for a child up to ${maxAge} years old.`,
          `Urlop na warunkach urlopu macierzyńskiego przysługuje tylko na dziecko do ${maxAge}. roku życia.`
        )
      )
      return { limits, bases, periods, totals: summarize(periods), warnings, notes }
    }
  }

  const motherOk = input.mother.insured
  const fatherOk = input.father.insured

  if (!motherOk) {
    warnings.push(
      isBirth
        ? L(
            'The mother is not covered by sickness insurance on the birth date, so she has no right to maternity benefit. Ask ZUS about other support (e.g. "świadczenie rodzicielskie").',
            'Matka nie podlega ubezpieczeniu chorobowemu w dniu porodu, więc zasiłek macierzyński jej nie przysługuje. Zapytaj o inne wsparcie (np. świadczenie rodzicielskie).'
          )
        : L(
            'Parent 1 is not covered by sickness insurance, so there is no right to maternity benefit.',
            'Rodzic 1 nie podlega ubezpieczeniu chorobowemu, więc zasiłek macierzyński nie przysługuje.'
          )
    )
  }

  if ((motherOk && bases.mother === 0) || (fatherOk && bases.father === 0)) {
    notes.push(
      L(
        'Enter the salary or benefit base to see the amounts.',
        'Wpisz wynagrodzenie lub podstawę wymiaru, aby zobaczyć kwoty.'
      )
    )
  }

  const useSingle = input.singleApplication && isBirth && motherOk
  if (input.singleApplication && !useSingle) {
    warnings.push(
      L(
        'The 81.5% option is only available to an insured mother after giving birth.',
        'Opcja 81,5% przysługuje tylko ubezpieczonej matce po porodzie.'
      )
    )
  }

  // ----- Maternity leave (or leave on maternity-leave terms) -----
  if (motherOk) {
    let transfer = 0
    if (input.maternityTransferWeeks > 0) {
      if (!isBirth) {
        warnings.push(
          L(
            'Handing over maternity leave only applies after a birth.',
            'Przekazanie urlopu macierzyńskiego dotyczy tylko sytuacji po porodzie.'
          )
        )
      } else if (!fatherOk) {
        warnings.push(
          L(
            'Maternity leave can only be handed over to an insured father.',
            'Urlop macierzyński można przekazać tylko ubezpieczonemu ojcu.'
          )
        )
      } else {
        transfer = clamp(Math.round(input.maternityTransferWeeks), 0, limits.maternityTransferMax)
        if (input.maternityTransferWeeks > limits.maternityTransferMax) {
          warnings.push(
            L(
              `The mother must use at least ${limits.personalWeeks} weeks herself, so at most ${limits.maternityTransferMax} weeks can be handed over.`,
              `Matka musi wykorzystać co najmniej ${limits.personalWeeks} tygodni, więc przekazać można maksymalnie ${limits.maternityTransferMax} tyg.`
            )
          )
        }
      }
    }

    periods.push(
      makePeriod(
        'mother',
        'maternity',
        limits.maternityWeeks - transfer,
        useSingle ? rateSingle : rateMaternity,
        bases.mother
      )
    )

    if (transfer > 0) {
      periods.push(makePeriod('father', 'maternity', transfer, rateMaternity, bases.father))
    }

    // ----- Supplementary maternity leave (premature / hospitalised baby) -----
    if (isBirth && input.supplementaryWeeks > 0) {
      const w = clamp(Math.round(input.supplementaryWeeks), 0, limits.supplementaryMax)
      if (input.supplementaryWeeks > limits.supplementaryMax) {
        warnings.push(
          L(
            `Supplementary maternity leave is limited to ${limits.supplementaryMax} weeks.`,
            `Uzupełniający urlop macierzyński wynosi maksymalnie ${limits.supplementaryMax} tyg.`
          )
        )
      }
      periods.push(makePeriod('mother', 'supplementary', w, rateSupplementary, bases.mother))
    }
  }

  // ----- Parental leave -----
  const workMax = limits.workMaxPercent

  let motherParental = 0
  if (motherOk) {
    motherParental = clamp(Math.round(input.mother.parentalWeeks), 0, limits.parentalMaxPerParent)
    if (input.mother.parentalWeeks > limits.parentalMaxPerParent) {
      warnings.push(
        L(
          `Each parent can use at most ${limits.parentalMaxPerParent} weeks of parental leave (${limits.reservedWeeks} weeks are reserved for the other parent).`,
          `Każdy z rodziców może wykorzystać maksymalnie ${limits.parentalMaxPerParent} tyg. urlopu rodzicielskiego (${limits.reservedWeeks} tyg. jest zarezerwowanych dla drugiego rodzica).`
        )
      )
    }
  }

  let fatherParental = 0
  if (fatherOk) {
    const available = Math.min(limits.parentalMaxPerParent, limits.parentalTotal - motherParental)
    fatherParental = clamp(Math.round(input.father.parentalWeeks), 0, available)
    if (input.father.parentalWeeks > available) {
      warnings.push(
        L(
          `Only ${available} weeks of parental leave are left for the father.`,
          `Dla ojca pozostało tylko ${available} tyg. urlopu rodzicielskiego.`
        )
      )
    }
  } else if (motherOk) {
    warnings.push(
      L(
        `The father is not insured, so his ${limits.reservedWeeks} reserved weeks of parental leave cannot be used.`,
        `Ojciec nie jest ubezpieczony, więc jego ${limits.reservedWeeks} tyg. zarezerwowanego urlopu rodzicielskiego nie może zostać wykorzystanych.`
      )
    )
  }

  for (const pk of ['mother', 'father'] as ParentKey[]) {
    if (input[pk].workPercent > workMax) {
      warnings.push(
        L(
          `You can work at most ${workMax}% of full time while on parental leave.`,
          `W trakcie urlopu rodzicielskiego można pracować maksymalnie w wymiarze ${workMax}% etatu.`
        )
      )
      break
    }
  }

  if (motherParental > 0) {
    periods.push(
      makePeriod(
        'mother',
        'parental',
        motherParental,
        useSingle ? rateSingle : rateParental,
        bases.mother,
        clamp(input.mother.workPercent, 0, workMax)
      )
    )
  }

  if (fatherParental > 0) {
    periods.push(
      makePeriod(
        'father',
        'parental',
        fatherParental,
        rateParental,
        bases.father,
        clamp(input.father.workPercent, 0, workMax)
      )
    )
  }

  // ----- Paternity leave -----
  if (input.fatherPaternity) {
    if (!fatherOk) {
      warnings.push(
        L(
          'Paternity leave benefit requires the father to be covered by sickness insurance.',
          'Zasiłek za okres urlopu ojcowskiego wymaga, aby ojciec podlegał ubezpieczeniu chorobowemu.'
        )
      )
    } else {
      periods.push(makePeriod('father', 'paternity', limits.paternityWeeks, ratePaternity, bases.father))
      notes.push(
        isBirth
          ? L(
              `Paternity leave must be used before the child turns ${paternityMonths} months – in one block or two blocks of at least 7 days.`,
              `Urlop ojcowski trzeba wykorzystać, zanim dziecko skończy ${paternityMonths} miesięcy – jednorazowo lub w dwóch częściach, po co najmniej 7 dni.`
            )
          : L(
              'After adoption, paternity leave must be used within 12 months of the adoption becoming final (child under 14).',
              'Po adopcji urlop ojcowski trzeba wykorzystać w ciągu 12 miesięcy od uprawomocnienia się postanowienia (dziecko do 14. roku życia).'
            )
      )
    }
  }

  // ----- 81.5% option notes -----
  if (useSingle) {
    notes.push(
      L(
        `81.5% option: the mother must apply for the full maternity and parental leave no later than ${singleDeadline} days after the birth.`,
        `Opcja 81,5%: matka musi złożyć wniosek o cały urlop macierzyński i rodzicielski najpóźniej ${singleDeadline} dni po porodzie.`
      )
    )
    if (fatherParental > 0 || motherParental < limits.parentalMaxPerParent) {
      warnings.push(
        L(
          'The 81.5% option assumes the mother applies for the full leave. If plans change (e.g. the father takes part of the parental leave), the benefit is recalculated – confirm with ZUS or your employer.',
          'Opcja 81,5% zakłada wniosek o cały urlop. Jeśli plany się zmienią (np. ojciec weźmie część urlopu rodzicielskiego), zasiłek zostanie przeliczony – potwierdź to w ZUS lub u pracodawcy.'
        )
      )
    }
  }

  if (isBirth && (motherParental > 0 || fatherParental > 0)) {
    notes.push(
      L(
        'Parental leave can be split into up to 5 parts, used until the end of the calendar year in which the child turns 6.',
        'Urlop rodzicielski można podzielić na maksymalnie 5 części i wykorzystać do końca roku kalendarzowego, w którym dziecko kończy 6 lat.'
      )
    )
  }

  return { limits, bases, periods, totals: summarize(periods), warnings, notes }
}