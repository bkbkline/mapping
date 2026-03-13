'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Building2,
  Ruler,
  ArrowUpFromLine,
  Settings,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import type { ZoningLookupEntry } from '@/types';

interface ZoningPanelProps {
  zoningCode: string | null;
  zoningDescription: string | null;
  orgId: string | null;
}

export function ZoningPanel({ zoningCode, zoningDescription, orgId }: ZoningPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [lookup, setLookup] = useState<ZoningLookupEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!zoningCode || !orgId) return;
    const load = async () => {
      setLoading(true);
      // Look up zoning from org settings
      const { data } = await supabase
        .from('orgs')
        .select('settings')
        .eq('id', orgId)
        .single();

      if (data?.settings?.zoning_lookup) {
        const lookupTable = data.settings.zoning_lookup as ZoningLookupEntry[];
        const entry = lookupTable.find(
          (z) => z.code.toLowerCase() === zoningCode.toLowerCase()
        );
        if (entry) setLookup(entry);
      }
      setLoading(false);
    };
    load();
  }, [zoningCode, orgId, supabase]);

  const compatibilityBadge = () => {
    if (!lookup) return null;
    switch (lookup.industrial_compatibility) {
      case 'permitted':
        return (
          <Badge className="gap-1 bg-green-500/20 text-green-400">
            <CheckCircle className="h-3 w-3" />
            Industrial Permitted
          </Badge>
        );
      case 'conditional':
        return (
          <Badge className="gap-1 bg-yellow-500/20 text-yellow-400">
            <AlertCircle className="h-3 w-3" />
            Conditional Use
          </Badge>
        );
      case 'not_permitted':
        return (
          <Badge className="gap-1 bg-red-500/20 text-red-400">
            <XCircle className="h-3 w-3" />
            Not Permitted
          </Badge>
        );
    }
  };

  return (
    <Card className="border-[#374151] bg-[#1F2937]">
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#F59E0B]" />
            <CardTitle className="text-[#F9FAFB]">Zoning</CardTitle>
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
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-semibold text-[#F9FAFB]">
                {zoningCode || 'Unknown'}
              </p>
              <p className="text-sm text-[#9CA3AF]">
                {lookup?.description || zoningDescription || 'No description available'}
              </p>
            </div>
            {compatibilityBadge()}
          </div>

          {lookup && (
            <>
              {/* Permitted Uses */}
              {lookup.permitted_uses && lookup.permitted_uses.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                    Permitted Uses
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {lookup.permitted_uses.map((use) => (
                      <Badge
                        key={use}
                        variant="outline"
                        className="border-[#374151] text-[#9CA3AF]"
                      >
                        <Building2 className="mr-1 h-3 w-3" />
                        {use}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="bg-[#374151]" />

              {/* Development Standards */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                  Development Standards
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-[#374151] bg-[#111827] p-3">
                    <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                      <Ruler className="h-3 w-3" />
                      Max FAR
                    </div>
                    <p className="mt-1 text-sm font-medium text-[#F9FAFB]">
                      {lookup.max_far !== null ? lookup.max_far.toFixed(2) : '--'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#374151] bg-[#111827] p-3">
                    <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                      <Building2 className="h-3 w-3" />
                      Lot Coverage
                    </div>
                    <p className="mt-1 text-sm font-medium text-[#F9FAFB]">
                      {lookup.max_lot_coverage !== null
                        ? `${(lookup.max_lot_coverage * 100).toFixed(0)}%`
                        : '--'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#374151] bg-[#111827] p-3">
                    <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                      <ArrowUpFromLine className="h-3 w-3" />
                      Max Height
                    </div>
                    <p className="mt-1 text-sm font-medium text-[#F9FAFB]">
                      {lookup.max_height !== null ? `${lookup.max_height} ft` : '--'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#374151] bg-[#111827] p-3">
                    <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                      <Ruler className="h-3 w-3" />
                      Setbacks
                    </div>
                    <p className="mt-1 text-sm font-medium text-[#F9FAFB]">
                      {lookup.min_setbacks
                        ? `F: ${lookup.min_setbacks.front}' / R: ${lookup.min_setbacks.rear}' / S: ${lookup.min_setbacks.side}'`
                        : '--'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {!lookup && !loading && zoningCode && (
            <p className="text-xs text-[#9CA3AF]">
              No zoning lookup entry found for code &quot;{zoningCode}&quot;.
              Configure your zoning table in settings.
            </p>
          )}

          <Link href="/app/settings">
            <Button
              variant="ghost"
              className="gap-2 text-xs text-[#9CA3AF] hover:text-[#F9FAFB]"
            >
              <Settings className="h-3 w-3" />
              Edit Zoning Table
            </Button>
          </Link>
        </CardContent>
      )}
    </Card>
  );
}
