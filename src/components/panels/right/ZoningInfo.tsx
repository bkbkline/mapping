'use client';

import { useEffect, useState } from 'react';
import { useParcelDetail } from '@/hooks/useParcelDetail';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { ZoningLookupEntry } from '@/types';

export default function ZoningInfo() {
  const { parcel } = useParcelDetail();
  const [info, setInfo] = useState<ZoningLookupEntry | null>(null);

  useEffect(() => {
    if (parcel?.zoning) {
      // lookupZoning requires a table; without one, show null
      setInfo(null);
    } else {
      setInfo(null);
    }
  }, [parcel?.zoning]);

  if (!parcel) {
    return <p className="text-sm text-gray-400">Select a parcel to view zoning info.</p>;
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-white">
          {parcel.zoning || 'Unknown Zoning'}
        </h3>
        {parcel.zoning_description && (
          <p className="text-xs text-gray-400 mt-0.5">{parcel.zoning_description}</p>
        )}
      </div>

      {info && (
        <>
          <Separator className="bg-white/10" />

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-300">{info.description}</p>
            </div>

            {info.permitted_uses.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Permitted Uses</p>
                <div className="flex flex-wrap gap-1">
                  {info.permitted_uses.map((use) => (
                    <Badge key={use} variant="secondary" className="text-[10px] bg-white/10 text-gray-300">
                      {use}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              {info.max_far && (
                <div>
                  <span className="text-gray-500">Max FAR:</span>
                  <span className="text-gray-300 ml-1">{info.max_far}</span>
                </div>
              )}
              {info.max_lot_coverage && (
                <div>
                  <span className="text-gray-500">Max Coverage:</span>
                  <span className="text-gray-300 ml-1">{info.max_lot_coverage * 100}%</span>
                </div>
              )}
              {info.max_height && (
                <div>
                  <span className="text-gray-500">Max Height:</span>
                  <span className="text-gray-300 ml-1">{info.max_height}&apos;</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Industrial:</span>
                <Badge
                  variant="secondary"
                  className={`ml-1 text-[10px] ${
                    info.industrial_compatibility === 'permitted'
                      ? 'bg-green-500/20 text-green-400'
                      : info.industrial_compatibility === 'conditional'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {info.industrial_compatibility}
                </Badge>
              </div>
            </div>

            {info.min_setbacks && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Setbacks</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Front:</span>
                    <span className="text-gray-300 ml-1">{info.min_setbacks.front}&apos;</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Rear:</span>
                    <span className="text-gray-300 ml-1">{info.min_setbacks.rear}&apos;</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Side:</span>
                    <span className="text-gray-300 ml-1">{info.min_setbacks.side}&apos;</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {!info && parcel.zoning && (
        <p className="text-xs text-gray-500">
          No detailed zoning information available for code &ldquo;{parcel.zoning}&rdquo;.
        </p>
      )}
    </div>
  );
}
