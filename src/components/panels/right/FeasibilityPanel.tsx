'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { calculateFeasibility } from '@/lib/calculations/feasibility';
import type { FeasibilityInputs } from '@/types';

const defaultInputs: FeasibilityInputs = {
  land_cost: 5000000,
  building_sf: 200000,
  construction_cost_psf: 85,
  hard_cost_contingency: 0.05,
  soft_costs: 2000000,
  stabilized_rent_psf: 0.85,
  vacancy_rate: 0.05,
  cap_rate: 0.055,
  loan_to_cost: 0.65,
  interest_rate: 0.06,
  loan_term: 25,
};

export default function FeasibilityPanel() {
  const [inputs, setInputs] = useState<FeasibilityInputs>(defaultInputs);

  const outputs = useMemo(() => {
    try {
      return calculateFeasibility(inputs);
    } catch {
      return null;
    }
  }, [inputs]);

  const updateInput = (key: keyof FeasibilityInputs, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <div className="grid grid-cols-2 gap-2">
        <InputField label="Land Cost ($)" value={inputs.land_cost} onChange={(v) => updateInput('land_cost', v)} />
        <InputField label="Building SF" value={inputs.building_sf} onChange={(v) => updateInput('building_sf', v)} />
        <InputField label="Construction $/SF" value={inputs.construction_cost_psf} onChange={(v) => updateInput('construction_cost_psf', v)} />
        <InputField label="Contingency (%)" value={inputs.hard_cost_contingency * 100} onChange={(v) => updateInput('hard_cost_contingency', (Number(v) / 100).toString())} />
        <InputField label="Soft Costs ($)" value={inputs.soft_costs} onChange={(v) => updateInput('soft_costs', v)} />
        <InputField label="Rent $/SF/mo" value={inputs.stabilized_rent_psf} onChange={(v) => updateInput('stabilized_rent_psf', v)} />
        <InputField label="Vacancy (%)" value={inputs.vacancy_rate * 100} onChange={(v) => updateInput('vacancy_rate', (Number(v) / 100).toString())} />
        <InputField label="Cap Rate (%)" value={inputs.cap_rate * 100} onChange={(v) => updateInput('cap_rate', (Number(v) / 100).toString())} />
        <InputField label="LTC (%)" value={inputs.loan_to_cost * 100} onChange={(v) => updateInput('loan_to_cost', (Number(v) / 100).toString())} />
        <InputField label="Interest (%)" value={inputs.interest_rate * 100} onChange={(v) => updateInput('interest_rate', (Number(v) / 100).toString())} />
        <InputField label="Loan Term (yrs)" value={inputs.loan_term} onChange={(v) => updateInput('loan_term', v)} />
      </div>

      {outputs && (
        <>
          <Separator className="bg-white/10" />
          <div className="grid grid-cols-2 gap-2">
            <ResultCard label="Total Project Cost" value={fmt(outputs.total_project_cost)} />
            <ResultCard label="Stabilized NOI" value={fmt(outputs.stabilized_noi)} />
            <ResultCard label="Stabilized Value" value={fmt(outputs.stabilized_value)} />
            <ResultCard label="Return on Cost" value={pct(outputs.return_on_cost)} highlight />
            <ResultCard label="Profit" value={fmt(outputs.profit)} highlight={outputs.profit > 0} />
            <ResultCard label="DSCR" value={outputs.dscr.toFixed(2) + 'x'} />
            <ResultCard label="Required Equity" value={fmt(outputs.required_equity)} />
            <ResultCard label="Annual Debt Service" value={fmt(outputs.annual_debt_service)} />
          </div>
        </>
      )}

      {!outputs && (
        <p className="text-xs text-gray-500">Enter values above to calculate feasibility.</p>
      )}
    </div>
  );
}

function InputField({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-[10px] text-gray-500">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 bg-white/5 border-white/10 text-white text-xs mt-0.5"
      />
    </div>
  );
}

function ResultCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-2">
        <p className="text-[10px] text-gray-500">{label}</p>
        <p className={`text-sm font-semibold ${highlight ? 'text-green-400' : 'text-white'}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
