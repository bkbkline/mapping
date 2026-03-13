'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ChevronDown,
  ChevronUp,
  Calculator,
  Save,
  FileDown,
  Copy,
} from 'lucide-react';
import type { FeasibilityInputs, FeasibilityOutputs } from '@/types';

interface FeasibilityCalculatorProps {
  parcelId: string;
  defaultLandCost?: number;
  defaultBuildingSf?: number;
}

const defaultInputs: FeasibilityInputs = {
  land_cost: 0,
  building_sf: 0,
  construction_cost_psf: 85,
  hard_cost_contingency: 0.05,
  soft_costs: 0.10,
  stabilized_rent_psf: 0,
  vacancy_rate: 0.05,
  cap_rate: 0.055,
  loan_to_cost: 0.65,
  interest_rate: 0.065,
  loan_term: 10,
};

function computeOutputs(inputs: FeasibilityInputs): FeasibilityOutputs {
  const hardCostsBase = inputs.building_sf * inputs.construction_cost_psf;
  const hardCostContingency = hardCostsBase * inputs.hard_cost_contingency;
  const total_hard_costs = hardCostsBase + hardCostContingency;
  const softCosts = total_hard_costs * inputs.soft_costs;
  const total_project_cost = inputs.land_cost + total_hard_costs + softCosts;

  const grossRevenue = inputs.building_sf * inputs.stabilized_rent_psf;
  const vacancyLoss = grossRevenue * inputs.vacancy_rate;
  const stabilized_noi = grossRevenue - vacancyLoss;

  const stabilized_value = inputs.cap_rate > 0 ? stabilized_noi / inputs.cap_rate : 0;
  const return_on_cost = total_project_cost > 0 ? stabilized_noi / total_project_cost : 0;

  const max_loan = total_project_cost * inputs.loan_to_cost;
  const required_equity = total_project_cost - max_loan;

  // Annual debt service using mortgage constant (annual payment on a fully amortizing loan)
  const monthlyRate = inputs.interest_rate / 12;
  const numPayments = inputs.loan_term * 12;
  let annual_debt_service = 0;
  if (monthlyRate > 0 && numPayments > 0 && max_loan > 0) {
    const monthlyPayment =
      max_loan * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);
    annual_debt_service = monthlyPayment * 12;
  }

  const dscr = annual_debt_service > 0 ? stabilized_noi / annual_debt_service : 0;
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

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

function formatPercent(val: number): string {
  return (val * 100).toFixed(2) + '%';
}

function formatNumber(val: number, decimals = 2): string {
  return val.toFixed(decimals);
}

function rocColor(roc: number): string {
  if (roc >= 0.15) return 'text-green-400';
  if (roc >= 0.10) return 'text-yellow-400';
  return 'text-red-400';
}

export function FeasibilityCalculator({
  defaultLandCost,
  defaultBuildingSf,
}: FeasibilityCalculatorProps) {
  const [expanded, setExpanded] = useState(false);
  const [inputs, setInputs] = useState<FeasibilityInputs>({
    ...defaultInputs,
    land_cost: defaultLandCost ?? 0,
    building_sf: defaultBuildingSf ?? 0,
  });

  const outputs = useMemo(() => computeOutputs(inputs), [inputs]);

  const updateInput = (key: keyof FeasibilityInputs, value: number) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleCopyToClipboard = () => {
    const lines = [
      '=== Feasibility Analysis ===',
      '',
      '--- Inputs ---',
      `Land Cost: ${formatCurrency(inputs.land_cost)}`,
      `Building SF: ${inputs.building_sf.toLocaleString()}`,
      `Construction Cost/SF: ${formatCurrency(inputs.construction_cost_psf)}`,
      `Hard Cost Contingency: ${formatPercent(inputs.hard_cost_contingency)}`,
      `Soft Costs: ${formatPercent(inputs.soft_costs)}`,
      `Stabilized Rent/SF/Year: ${formatCurrency(inputs.stabilized_rent_psf)}`,
      `Vacancy Rate: ${formatPercent(inputs.vacancy_rate)}`,
      `Cap Rate: ${formatPercent(inputs.cap_rate)}`,
      `Loan-to-Cost: ${formatPercent(inputs.loan_to_cost)}`,
      `Interest Rate: ${formatPercent(inputs.interest_rate)}`,
      `Loan Term: ${inputs.loan_term} years`,
      '',
      '--- Outputs ---',
      `Total Hard Costs: ${formatCurrency(outputs.total_hard_costs)}`,
      `Total Project Cost: ${formatCurrency(outputs.total_project_cost)}`,
      `Stabilized NOI: ${formatCurrency(outputs.stabilized_noi)}`,
      `Stabilized Value: ${formatCurrency(outputs.stabilized_value)}`,
      `Return on Cost: ${formatPercent(outputs.return_on_cost)}`,
      `Required Equity: ${formatCurrency(outputs.required_equity)}`,
      `Max Loan: ${formatCurrency(outputs.max_loan)}`,
      `Annual Debt Service: ${formatCurrency(outputs.annual_debt_service)}`,
      `DSCR: ${formatNumber(outputs.dscr)}x`,
      `Profit: ${formatCurrency(outputs.profit)}`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
  };

  const currencyField = (label: string, key: keyof FeasibilityInputs, prefix = '$') => (
    <div className="space-y-1">
      <Label className="text-xs text-[#9CA3AF]">{label}</Label>
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">
          {prefix}
        </span>
        <Input
          type="number"
          value={inputs[key] || ''}
          onChange={(e) => updateInput(key, Number(e.target.value) || 0)}
          className="h-8 border-[#374151] bg-[#111827] pl-5 text-[#F9FAFB] text-sm"
          placeholder="0"
        />
      </div>
    </div>
  );

  const percentField = (label: string, key: keyof FeasibilityInputs) => (
    <div className="space-y-1">
      <Label className="text-xs text-[#9CA3AF]">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          step="0.1"
          value={inputs[key] ? (inputs[key] as number) * 100 : ''}
          onChange={(e) => updateInput(key, (Number(e.target.value) || 0) / 100)}
          className="h-8 border-[#374151] bg-[#111827] pr-6 text-[#F9FAFB] text-sm"
          placeholder="0"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">
          %
        </span>
      </div>
    </div>
  );

  const numField = (label: string, key: keyof FeasibilityInputs, suffix?: string) => (
    <div className="space-y-1">
      <Label className="text-xs text-[#9CA3AF]">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          value={inputs[key] || ''}
          onChange={(e) => updateInput(key, Number(e.target.value) || 0)}
          className="h-8 border-[#374151] bg-[#111827] text-[#F9FAFB] text-sm"
          placeholder="0"
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF]">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );

  const outputRow = (label: string, value: string, colorClass?: string) => (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-[#9CA3AF]">{label}</span>
      <span className={`text-sm font-medium ${colorClass ?? 'text-[#F9FAFB]'}`}>{value}</span>
    </div>
  );

  return (
    <Card className="border-[#374151] bg-[#1F2937]">
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-[#F59E0B]" />
            <CardTitle className="text-[#F9FAFB]">Feasibility Calculator</CardTitle>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-[#9CA3AF]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Inputs */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Inputs
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {currencyField('Land Cost', 'land_cost')}
              {numField('Building SF', 'building_sf', 'SF')}
              {currencyField('Construction Cost/SF', 'construction_cost_psf')}
              {percentField('Hard Cost Contingency', 'hard_cost_contingency')}
              {percentField('Soft Costs', 'soft_costs')}
              {currencyField('Stabilized Rent/SF/Yr', 'stabilized_rent_psf')}
              {percentField('Vacancy Rate', 'vacancy_rate')}
              {percentField('Cap Rate', 'cap_rate')}
              {percentField('Loan-to-Cost', 'loan_to_cost')}
              {percentField('Interest Rate', 'interest_rate')}
              {numField('Loan Term', 'loan_term', 'yr')}
            </div>
          </div>

          <Separator className="bg-[#374151]" />

          {/* Outputs */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Outputs
            </h4>
            <div className="rounded-lg border border-[#374151] bg-[#111827] px-4 py-2">
              {outputRow('Total Hard Costs', formatCurrency(outputs.total_hard_costs))}
              {outputRow('Total Project Cost', formatCurrency(outputs.total_project_cost))}
              <Separator className="my-1 bg-[#374151]" />
              {outputRow('Stabilized NOI', formatCurrency(outputs.stabilized_noi))}
              {outputRow('Stabilized Value', formatCurrency(outputs.stabilized_value))}
              {outputRow(
                'Return on Cost',
                formatPercent(outputs.return_on_cost),
                rocColor(outputs.return_on_cost)
              )}
              <Separator className="my-1 bg-[#374151]" />
              {outputRow('Required Equity', formatCurrency(outputs.required_equity))}
              {outputRow('Max Loan', formatCurrency(outputs.max_loan))}
              {outputRow('Annual Debt Service', formatCurrency(outputs.annual_debt_service))}
              {outputRow('DSCR', formatNumber(outputs.dscr) + 'x')}
              <Separator className="my-1 bg-[#374151]" />
              {outputRow(
                'Profit',
                formatCurrency(outputs.profit),
                outputs.profit >= 0 ? 'text-green-400' : 'text-red-400'
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button className="gap-2 bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#D97706]">
              <Save className="h-4 w-4" />
              Save Scenario
            </Button>
            <Button variant="outline" className="gap-2 border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]">
              <FileDown className="h-4 w-4" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
              onClick={handleCopyToClipboard}
            >
              <Copy className="h-4 w-4" />
              Copy to Clipboard
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
