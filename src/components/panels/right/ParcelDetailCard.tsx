'use client';

import { useEffect } from 'react';
import { useMapStore } from '@/store/mapStore';
import { useParcelDetail } from '@/hooks/useParcelDetail';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, User, Ruler, DollarSign, FileText, Navigation } from 'lucide-react';
import ParcelActions from './ParcelActions';

export default function ParcelDetailCard() {
  const { selectedFeatureId } = useMapStore();
  const { parcel, loading, fetchParcel } = useParcelDetail();

  useEffect(() => {
    if (selectedFeatureId) {
      fetchParcel(selectedFeatureId);
    }
  }, [selectedFeatureId, fetchParcel]);

  if (loading) {
    return <p className="text-sm text-gray-400">Loading parcel...</p>;
  }

  if (!parcel) {
    return <p className="text-sm text-gray-400">Select a parcel on the map to view details.</p>;
  }

  return (
    <div className="space-y-3">
      {/* Address / APN */}
      <div>
        <h3 className="text-base font-semibold text-white">
          {parcel.situs_address || 'No Address'}
        </h3>
        {parcel.apn && (
          <p className="text-xs text-gray-400 mt-0.5">APN: {parcel.apn}</p>
        )}
      </div>

      <ParcelActions parcelId={parcel.id} />

      <Separator className="bg-white/10" />

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCard icon={Ruler} label="Acreage" value={parcel.acreage ? `${parcel.acreage.toFixed(2)} ac` : 'N/A'} />
        <MetricCard icon={FileText} label="Zoning" value={parcel.zoning || 'N/A'} />
        <MetricCard icon={DollarSign} label="Assessed Value" value={parcel.assessed_value ? `$${parcel.assessed_value.toLocaleString()}` : 'N/A'} />
        <MetricCard icon={MapPin} label="County" value={parcel.county || 'N/A'} />
      </div>

      <Separator className="bg-white/10" />

      {/* Owner info */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <User className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-medium text-gray-300">Owner</span>
        </div>
        <p className="text-sm text-white">{parcel.owner_name || 'Unknown'}</p>
        {parcel.owner_mailing_address && (
          <p className="text-xs text-gray-400 mt-0.5">{parcel.owner_mailing_address}</p>
        )}
      </div>

      {/* Additional details */}
      {parcel.zoning_description && (
        <>
          <Separator className="bg-white/10" />
          <div>
            <span className="text-xs font-medium text-gray-300">Zoning Description</span>
            <p className="text-xs text-gray-400 mt-0.5">{parcel.zoning_description}</p>
          </div>
        </>
      )}

      {parcel.legal_description && (
        <>
          <Separator className="bg-white/10" />
          <div>
            <span className="text-xs font-medium text-gray-300">Legal Description</span>
            <p className="text-xs text-gray-400 mt-0.5">{parcel.legal_description}</p>
          </div>
        </>
      )}

      {parcel.land_use_code && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Land Use:</span>
          <Badge variant="secondary" className="text-[10px] h-5 bg-white/10 text-gray-300">
            {parcel.land_use_code}
          </Badge>
        </div>
      )}

      {/* Coordinates */}
      {parcel.geometry && (
        <>
          <Separator className="bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Navigation className="h-3 w-3 text-gray-500" />
            <span className="text-[10px] text-gray-500 font-mono">
              {parcel.geometry.coordinates[0]?.[0]?.[0]
                ? `${parcel.geometry.coordinates[0][0][0][1].toFixed(6)}, ${parcel.geometry.coordinates[0][0][0][0].toFixed(6)}`
                : 'N/A'}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className="h-3 w-3 text-gray-500" />
          <span className="text-[10px] text-gray-500">{label}</span>
        </div>
        <p className="text-sm text-white font-medium">{value}</p>
      </CardContent>
    </Card>
  );
}
