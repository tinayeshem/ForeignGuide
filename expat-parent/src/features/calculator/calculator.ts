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

export function calculate(params: Params, input: CalculatorInput): CalculatorResult {
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
        `Leave on maternity-leave terms is only available for a child up to ${maxAge} years old.`
      )
      return { limits, bases, periods, totals: summarize(periods), warnings, notes }
    }
  }

  const motherOk = input.mother.insured
  const fatherOk = input.father.insured

  if (!motherOk) {
    warnings.push(
      isBirth
        ? 'The mother is not covered by sickness insurance on the birth date, so she has no right to maternity benefit. Ask ZUS about other support (e.g. "świadczenie rodzicielskie").'
        : 'Parent 1 is not covered by sickness insurance, so there is no right to maternity benefit.'
    )
  }

  if ((motherOk && bases.mother === 0) || (fatherOk && bases.father === 0)) {
    notes.push('Enter the salary or benefit base to see the amounts.')
  }

  const useSingle = input.singleApplication && isBirth && motherOk
  if (input.singleApplication && !useSingle) {
    warnings.push('The 81.5% option is only available to an insured mother after giving birth.')
  }

  // ----- Maternity leave (or leave on maternity-leave terms) -----
  if (motherOk) {
    let transfer = 0
    if (input.maternityTransferWeeks > 0) {
      if (!isBirth) {
        warnings.push('Handing over maternity leave only applies after a birth.')
      } else if (!fatherOk) {
        warnings.push('Maternity leave can only be handed over to an insured father.')
      } else {
        transfer = clamp(Math.round(input.maternityTransferWeeks), 0, limits.maternityTransferMax)
        if (input.maternityTransferWeeks > limits.maternityTransferMax) {
          warnings.push(
            `The mother must use at least ${limits.personalWeeks} weeks herself, so at most ${limits.maternityTransferMax} weeks can be handed over.`
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
        warnings.push(`Supplementary maternity leave is limited to ${limits.supplementaryMax} weeks.`)
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
        `Each parent can use at most ${limits.parentalMaxPerParent} weeks of parental leave (${limits.reservedWeeks} weeks are reserved for the other parent).`
      )
    }
  }

  let fatherParental = 0
  if (fatherOk) {
    const available = Math.min(limits.parentalMaxPerParent, limits.parentalTotal - motherParental)
    fatherParental = clamp(Math.round(input.father.parentalWeeks), 0, available)
    if (input.father.parentalWeeks > available) {
      warnings.push(`Only ${available} weeks of parental leave are left for the father.`)
    }
  } else if (motherOk) {
    warnings.push(
      `The father is not insured, so his ${limits.reservedWeeks} reserved weeks of parental leave cannot be used.`
    )
  }

  for (const pk of ['mother', 'father'] as ParentKey[]) {
    if (input[pk].workPercent > workMax) {
      warnings.push(`You can work at most ${workMax}% of full time while on parental leave.`)
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
      warnings.push('Paternity leave benefit requires the father to be covered by sickness insurance.')
    } else {
      periods.push(makePeriod('father', 'paternity', limits.paternityWeeks, ratePaternity, bases.father))
      notes.push(
        isBirth
          ? `Paternity leave must be used before the child turns ${paternityMonths} months – in one block or two blocks of at least 7 days.`
          : 'After adoption, paternity leave must be used within 12 months of the adoption becoming final (child under 14).'
      )
    }
  }

  // ----- 81.5% option notes -----
  if (useSingle) {
    notes.push(
      `81.5% option: the mother must apply for the full maternity and parental leave no later than ${singleDeadline} days after the birth.`
    )
    if (fatherParental > 0 || motherParental < limits.parentalMaxPerParent) {
      warnings.push(
        'The 81.5% option assumes the mother applies for the full leave. If plans change (e.g. the father takes part of the parental leave), the benefit is recalculated – confirm with ZUS or your employer.'
      )
    }
  }

  if (isBirth && (motherParental > 0 || fatherParental > 0)) {
    notes.push(
      'Parental leave can be split into up to 5 parts, used until the end of the calendar year in which the child turns 6.'
    )
  }

  return { limits, bases, periods, totals: summarize(periods), warnings, notes }
}