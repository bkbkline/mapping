'use client';

import { useEffect } from 'react';
import { useComps } from '@/hooks/useComps';
import { useMapStore } from '@/store/mapStore';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import CompDetailCard from './CompDetailCard';

export default function CompAnalytics() {
  const { selectedFeatureId } = useMapStore();
  const { comps, loading, analytics, fetchCompsByParcel } = useComps();

  useEffect(() => {
    if (selectedFeatureId) {
      fetchCompsByParcel(selectedFeatureId);
    }
  }, [selectedFeatureId, fetchCompsByParcel]);

  if (loading) {
    return <p className="text-sm text-gray-400">Loading comps...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {analytics && (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Total Comps" value={analytics.count.toString()} />
          <StatCard
            label="Avg $/SF"
            value={analytics.avgPricePerSf ? `$${analytics.avgPricePerSf.toFixed(2)}` : 'N/A'}
          />
          <StatCard
            label="Median $/SF"
            value={analytics.medianPricePerSf ? `$${analytics.medianPricePerSf.toFixed(2)}` : 'N/A'}
          />
          <StatCard
            label="Avg $/Acre"
            value={analytics.avgPricePerAcre ? `$${Math.round(analytics.avgPricePerAcre).toLocaleString()}` : 'N/A'}
          />
        </div>
      )}

      <Separator className="bg-white/10" />

      {/* Comp list */}
      {comps.length === 0 ? (
        <p className="text-sm text-gray-400">No comparable sales found.</p>
      ) : (
        <div className="space-y-2">
          {comps.map((comp) => (
            <CompDetailCard key={comp.id} comp={comp} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-2.5">
        <p className="text-[10px] text-gray-500">{label}</p>
        <p className="text-sm text-white font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
