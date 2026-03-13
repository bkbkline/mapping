import { describe, it, expect } from 'vitest';
import { calculateFeasibility } from '@/lib/calculations/feasibility';
import type { FeasibilityInputs } from '@/types';

const baseInputs: FeasibilityInputs = {
  land_cost: 5_000_000,
  building_sf: 100_000,
  construction_cost_psf: 85,
  hard_cost_contingency: 0.05, // 5%
  soft_costs: 0.15, // 15%
  stabilized_rent_psf: 12, // $12/SF/year NNN
  vacancy_rate: 0.05, // 5%
  cap_rate: 0.055, // 5.5%
  loan_to_cost: 0.65, // 65% LTC
  interest_rate: 0.06, // 6%
  loan_term: 25, // 25 years
};

describe('calculateFeasibility', () => {
  it('should calculate total hard costs correctly', () => {
    const result = calculateFeasibility(baseInputs);
    // Hard costs = 5,000,000 + (100,000 * 85) * (1 + 0.05) = 5,000,000 + 8,925,000 = 13,925,000
    expect(result.total_hard_costs).toBeCloseTo(13_925_000, 0);
  });

  it('should calculate total project cost correctly', () => {
    const result = calculateFeasibility(baseInputs);
    // Total project cost = 13,925,000 * (1 + 0.15) = 16,013,750
    expect(result.total_project_cost).toBeCloseTo(16_013_750, 0);
  });

  it('should calculate stabilized NOI correctly', () => {
    const result = calculateFeasibility(baseInputs);
    // Gross income = 12 * 100,000 = 1,200,000
    // EGI = 1,200,000 * (1 - 0.05) = 1,140,000
    // OpEx = 1,200,000 * 0.15 = 180,000
    // NOI = 1,140,000 - 180,000 = 960,000
    expect(result.stabilized_noi).toBeCloseTo(960_000, 0);
  });

  it('should calculate stabilized value correctly', () => {
    const result = calculateFeasibility(baseInputs);
    // Value = 960,000 / 0.055 = 17,454,545.45
    expect(result.stabilized_value).toBeCloseTo(17_454_545.45, 0);
  });

  it('should calculate return on cost correctly', () => {
    const result = calculateFeasibility(baseInputs);
    // ROC = (17,454,545.45 - 16,013,750) / 16,013,750 = 0.09
    const expectedROC = (17_454_545.45 - 16_013_750) / 16_013_750;
    expect(result.return_on_cost).toBeCloseTo(expectedROC, 4);
  });

  it('should calculate required equity correctly', () => {
    const result = calculateFeasibility(baseInputs);
    // Equity = 16,013,750 * (1 - 0.65) = 5,604,812.50
    expect(result.required_equity).toBeCloseTo(5_604_812.5, 0);
  });

  it('should calculate max loan correctly', () => {
    const result = calculateFeasibility(baseInputs);
    // Max Loan = 16,013,750 * 0.65 = 10,408,937.50
    expect(result.max_loan).toBeCloseTo(10_408_937.5, 0);
  });

  it('should calculate annual debt service correctly', () => {
    const result = calculateFeasibility(baseInputs);
    // PMT on 10,408,937.50 at 6% for 25 years
    // Monthly rate = 0.005, n = 300
    // Monthly PMT = 10,408,937.50 * [0.005 * (1.005)^300] / [(1.005)^300 - 1]
    // Annual = monthly * 12
    expect(result.annual_debt_service).toBeGreaterThan(0);
    // Rough sanity check: annual debt service should be in the range of $800K-$900K
    expect(result.annual_debt_service).toBeGreaterThan(700_000);
    expect(result.annual_debt_service).toBeLessThan(1_000_000);
  });

  it('should calculate DSCR correctly', () => {
    const result = calculateFeasibility(baseInputs);
    // DSCR = NOI / Annual Debt Service
    expect(result.dscr).toBeCloseTo(result.stabilized_noi / result.annual_debt_service, 4);
    // DSCR should be > 1 for a viable deal
    expect(result.dscr).toBeGreaterThan(1);
  });

  it('should calculate profit correctly', () => {
    const result = calculateFeasibility(baseInputs);
    // Profit = Stabilized Value - Total Project Cost
    expect(result.profit).toBeCloseTo(result.stabilized_value - result.total_project_cost, 0);
  });

  // Edge cases
  describe('edge cases', () => {
    it('should handle zero building SF', () => {
      const inputs: FeasibilityInputs = { ...baseInputs, building_sf: 0 };
      const result = calculateFeasibility(inputs);
      expect(result.total_hard_costs).toBe(5_000_000); // just land cost
      expect(result.stabilized_noi).toBe(0);
      expect(result.stabilized_value).toBe(0);
    });

    it('should handle zero cap rate', () => {
      const inputs: FeasibilityInputs = { ...baseInputs, cap_rate: 0 };
      const result = calculateFeasibility(inputs);
      expect(result.stabilized_value).toBe(0);
      expect(result.return_on_cost).toBeCloseTo(-1, 1); // (0 - cost) / cost
    });

    it('should handle zero loan to cost', () => {
      const inputs: FeasibilityInputs = { ...baseInputs, loan_to_cost: 0 };
      const result = calculateFeasibility(inputs);
      expect(result.max_loan).toBe(0);
      expect(result.annual_debt_service).toBe(0);
      expect(result.dscr).toBe(0);
      expect(result.required_equity).toBeCloseTo(result.total_project_cost, 0);
    });

    it('should handle 100% vacancy', () => {
      const inputs: FeasibilityInputs = { ...baseInputs, vacancy_rate: 1 };
      const result = calculateFeasibility(inputs);
      // EGI = 0, OpEx = 15% of gross still applies
      // NOI = 0 - 180,000 = -180,000
      expect(result.stabilized_noi).toBeLessThan(0);
    });

    it('should handle zero interest rate', () => {
      const inputs: FeasibilityInputs = { ...baseInputs, interest_rate: 0 };
      const result = calculateFeasibility(inputs);
      expect(result.annual_debt_service).toBe(0);
    });

    it('should handle zero land cost', () => {
      const inputs: FeasibilityInputs = { ...baseInputs, land_cost: 0 };
      const result = calculateFeasibility(inputs);
      // Hard costs = 0 + (100,000 * 85) * 1.05 = 8,925,000
      expect(result.total_hard_costs).toBeCloseTo(8_925_000, 0);
    });
  });
});
