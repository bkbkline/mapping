'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Comp } from '@/types';

export default function CompDetailCard({ comp }: { comp: Comp }) {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white font-medium">{comp.address || 'Unknown Address'}</p>
            {comp.sale_date && (
              <p className="text-xs text-gray-400">{new Date(comp.sale_date).toLocaleDateString()}</p>
            )}
          </div>
          {comp.sale_price && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
              ${comp.sale_price.toLocaleString()}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {comp.building_sf && (
            <div>
              <span className="text-gray-500">Building SF:</span>
              <span className="text-gray-300 ml-1">{comp.building_sf.toLocaleString()}</span>
            </div>
          )}
          {comp.land_sf && (
            <div>
              <span className="text-gray-500">Land SF:</span>
              <span className="text-gray-300 ml-1">{comp.land_sf.toLocaleString()}</span>
            </div>
          )}
          {comp.price_per_sf && (
            <div>
              <span className="text-gray-500">$/SF:</span>
              <span className="text-gray-300 ml-1">${comp.price_per_sf.toFixed(2)}</span>
            </div>
          )}
          {comp.price_per_acre && (
            <div>
              <span className="text-gray-500">$/Acre:</span>
              <span className="text-gray-300 ml-1">${comp.price_per_acre.toLocaleString()}</span>
            </div>
          )}
          {comp.buyer && (
            <div>
              <span className="text-gray-500">Buyer:</span>
              <span className="text-gray-300 ml-1">{comp.buyer}</span>
            </div>
          )}
          {comp.seller && (
            <div>
              <span className="text-gray-500">Seller:</span>
              <span className="text-gray-300 ml-1">{comp.seller}</span>
            </div>
          )}
          {comp.zoning && (
            <div>
              <span className="text-gray-500">Zoning:</span>
              <span className="text-gray-300 ml-1">{comp.zoning}</span>
            </div>
          )}
          {comp.clear_height && (
            <div>
              <span className="text-gray-500">Clear Height:</span>
              <span className="text-gray-300 ml-1">{comp.clear_height}&apos;</span>
            </div>
          )}
        </div>

        {comp.notes && (
          <p className="text-xs text-gray-400 border-t border-white/5 pt-2">{comp.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}
