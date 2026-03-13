'use client';

import { useState } from 'react';
import {
  Globe,
  Lock,
  Link2,
  Copy,
  CheckCircle2,
  Send,
  Code,
  UserPlus,
  Trash2,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { useMapStore } from '@/store/mapStore';
import { useUIStore } from '@/store/uiStore';
import { createClient } from '@/lib/supabase/client';
import type { ShareMode } from '@/types';

interface InvitedUser {
  email: string;
  role: 'view' | 'edit';
}

const SHARE_MODES: { id: ShareMode; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'private',
    label: 'Private',
    description: 'Only invited users can access',
    icon: <Lock className="size-4" />,
  },
  {
    id: 'unlisted',
    label: 'Unlisted',
    description: 'Anyone with the link can view',
    icon: <Link2 className="size-4" />,
  },
  {
    id: 'public',
    label: 'Public',
    description: 'Visible to everyone',
    icon: <Globe className="size-4" />,
  },
];

export default function ShareModal() {
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);
  const activeMapId = useMapStore((s) => s.activeMapId);

  const isOpen = activeModal === 'share';

  const [shareMode, setShareMode] = useState<ShareMode>('private');
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'view' | 'edit'>('view');
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([]);
  const [embedWidth, setEmbedWidth] = useState('800');
  const [embedHeight, setEmbedHeight] = useState('600');
  const [saving, setSaving] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/maps/${activeMapId || 'map'}`
    : '';

  const embedCode = `<iframe src="${shareUrl}?embed=1" width="${embedWidth}" height="${embedHeight}" frameborder="0" style="border:0" allowfullscreen></iframe>`;

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) return;
    if (invitedUsers.some((u) => u.email === inviteEmail.trim())) return;

    setInvitedUsers((prev) => [...prev, { email: inviteEmail.trim(), role: inviteRole }]);
    setInviteEmail('');
  };

  const removeInvitedUser = (email: string) => {
    setInvitedUsers((prev) => prev.filter((u) => u.email !== email));
  };

  const handleSave = async () => {
    if (!activeMapId) return;
    setSaving(true);

    try {
      const supabase = createClient();

      // Update share mode on the map
      await supabase
        .from('maps')
        .update({ share_mode: shareMode })
        .eq('id', activeMapId);

      // Create map_grants for invited users
      for (const user of invitedUsers) {
        // Look up user by email (best-effort)
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', user.email)
          .single();

        if (profile) {
          await supabase.from('map_grants').upsert({
            map_id: activeMapId,
            user_id: profile.id,
            can_edit: user.role === 'edit',
          });
        }
      }

      closeModal();
    } catch {
      // Handle error silently for now
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-md bg-[#1F2937] border-[#374151] text-[#F9FAFB]">
        <DialogHeader>
          <DialogTitle className="text-[#F9FAFB]">Share Map</DialogTitle>
          <DialogDescription className="text-[#9CA3AF]">
            Control who can access this map and how.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Share mode selector */}
          <div className="space-y-2">
            <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Access Level</Label>
            <div className="grid grid-cols-3 gap-2">
              {SHARE_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setShareMode(mode.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors ${
                    shareMode === mode.id
                      ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]'
                      : 'border-[#374151] text-[#9CA3AF] hover:border-[#9CA3AF] bg-[#111827]'
                  }`}
                >
                  {mode.icon}
                  <span className="text-xs font-medium">{mode.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#9CA3AF]">
              {SHARE_MODES.find((m) => m.id === shareMode)?.description}
            </p>
          </div>

          {/* Shareable link (for unlisted/public) */}
          {shareMode !== 'private' && (
            <>
              <Separator className="bg-[#374151]" />
              <div className="space-y-2">
                <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Shareable Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="bg-[#111827] border-[#374151] text-[#F9FAFB] text-xs font-mono flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(shareUrl)}
                    className="border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB] shrink-0"
                  >
                    {copied ? (
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Invite users */}
          <Separator className="bg-[#374151]" />
          <div className="space-y-2">
            <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1">
              <UserPlus className="size-3" /> Invite Users
            </Label>
            <div className="flex gap-2">
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail((e.target as HTMLInputElement).value)}
                placeholder="user@example.com"
                type="email"
                className="bg-[#111827] border-[#374151] text-[#F9FAFB] text-sm flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              />
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'view' | 'edit')}>
                <SelectTrigger className="bg-[#111827] border-[#374151] text-[#F9FAFB] text-xs w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1F2937] border-[#374151]">
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={handleInvite}
                disabled={!inviteEmail.trim()}
                className="border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB] shrink-0"
              >
                <Send className="size-4" />
              </Button>
            </div>

            {/* Invited users list */}
            {invitedUsers.length > 0 && (
              <div className="space-y-1 mt-2">
                {invitedUsers.map((user) => (
                  <div
                    key={user.email}
                    className="flex items-center justify-between rounded-md border border-[#374151] bg-[#111827] px-2.5 py-1.5"
                  >
                    <span className="text-xs text-[#F9FAFB]">{user.email}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[#9CA3AF] uppercase">
                        {user.role}
                      </span>
                      <button
                        onClick={() => removeInvitedUser(user.email)}
                        className="text-[#9CA3AF] hover:text-red-400"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Embed code */}
          {shareMode !== 'private' && (
            <>
              <Separator className="bg-[#374151]" />
              <div className="space-y-2">
                <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1">
                  <Code className="size-3" /> Embed Code
                </Label>
                <div className="flex gap-2 mb-2">
                  <div className="space-y-1 flex-1">
                    <Label className="text-[9px] text-[#9CA3AF]">Width</Label>
                    <Input
                      value={embedWidth}
                      onChange={(e) => setEmbedWidth((e.target as HTMLInputElement).value)}
                      className="bg-[#111827] border-[#374151] text-[#F9FAFB] text-xs h-7"
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <Label className="text-[9px] text-[#9CA3AF]">Height</Label>
                    <Input
                      value={embedHeight}
                      onChange={(e) => setEmbedHeight((e.target as HTMLInputElement).value)}
                      className="bg-[#111827] border-[#374151] text-[#F9FAFB] text-xs h-7"
                    />
                  </div>
                </div>
                <div className="relative">
                  <pre className="rounded-md border border-[#374151] bg-[#111827] p-2.5 text-[10px] text-[#9CA3AF] font-mono overflow-x-auto whitespace-pre-wrap break-all">
                    {embedCode}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleCopy(embedCode)}
                    className="absolute top-1.5 right-1.5 text-[#9CA3AF] hover:text-[#F9FAFB]"
                  >
                    <Copy className="size-3" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Save button */}
          <Separator className="bg-[#374151]" />
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0E1A] font-semibold"
          >
            {saving ? 'Saving...' : 'Save Sharing Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
