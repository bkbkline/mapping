import type { FeasibilityInputs, FeasibilityOutputs } from '@/types';

/**
 * Calculate the PMT (Payment) for a loan given principal, annual rate, and term in years.
 * Returns annual debt service (12 monthly payments).
 */
function calculateAnnualDebtService(
  loanAmount: number,
  annualRate: number,
  termYears: number
): number {
  if (loanAmount <= 0 || annualRate <= 0 || termYears <= 0) return 0;

  const monthlyRate = annualRate / 12;
  const numPayments = termYears * 12;

  // PMT formula: P * [r(1+r)^n] / [(1+r)^n - 1]
  const factor = Math.pow(1 + monthlyRate, numPayments);
  const monthlyPayment = loanAmount * (monthlyRate * factor) / (factor - 1);

  return monthlyPayment * 12;
}

export function calculateFeasibility(inputs: FeasibilityInputs): FeasibilityOutputs {
  const {
    land_cost,
    building_sf,
    construction_cost_psf,
    hard_cost_contingency,
    soft_costs,
    stabilized_rent_psf,
    vacancy_rate,
    cap_rate,
    loan_to_cost,
    interest_rate,
    loan_term,
  } = inputs;

  // Total Hard Costs = Land + (SF x $/SF) x (1 + contingency)
  const construction_costs = building_sf * construction_cost_psf;
  const total_hard_costs = land_cost + construction_costs * (1 + hard_cost_contingency);

  // Total Project Cost = Hard costs x (1 + soft costs)
  const total_project_cost = total_hard_costs * (1 + soft_costs);

  // Gross Income = Rent x SF x (1 - vacancy)
  const gross_income = stabilized_rent_psf * building_sf;
  const effective_gross_income = gross_income * (1 - vacancy_rate);

  // OpEx estimated at 15% of gross income
  const opex = gross_income * 0.15;

  // Stabilized NOI = Effective Gross Income - OpEx
  const stabilized_noi = effective_gross_income - opex;

  // Stabilized Value = NOI / Cap Rate
  const stabilized_value = cap_rate > 0 ? stabilized_noi / cap_rate : 0;

  // Return on Cost = (Value - Total Cost) / Total Cost
  const return_on_cost = total_project_cost > 0
    ? (stabilized_value - total_project_cost) / total_project_cost
    : 0;

  // Required Equity = Total Cost x (1 - LTC)
  const required_equity = total_project_cost * (1 - loan_to_cost);

  // Max Loan = Total Cost x LTC
  const max_loan = total_project_cost * loan_to_cost;

  // Annual Debt Service = PMT formula
  const annual_debt_service = calculateAnnualDebtService(max_loan, interest_rate, loan_term);

  // DSCR = NOI / Annual Debt Service
  const dscr = annual_debt_service > 0 ? stabilized_noi / annual_debt_service : 0;

  // Profit = Stabilized Value - Total Project Cost
  const profit = stabilized_value - total_project_cost;

  return {
    total_hard_costs,
    total_project_cost,
    stabilized_noi,
    stabilized_value,
    return_on_cost,
    required_equity,
    max_loan,
    annual_debt_service,
    dscr,
    profit,
  };
}
