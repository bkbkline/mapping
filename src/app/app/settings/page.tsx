'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Building2,
  Users,
  Database,
  Layers,
  MapPin,
  Puzzle,
  CreditCard,
  Save,
  Upload,
  Trash2,
  Plus,
  Mail,
  Loader2,
  Shield,
  Eye,
  Edit3,
  Key,
} from 'lucide-react';
import type { ZoningLookupEntry, LayerPreset, UserRole } from '@/types';

interface OrgMember {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
}

interface WmsCredential {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
}

export default function SettingsPage() {
  const { profile, org, role } = useAuth();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<string | number>('profile');
  const [saving, setSaving] = useState(false);

  // Profile state
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Org state
  const [orgName, setOrgName] = useState(org?.name ?? '');
  const [orgLogoFile, setOrgLogoFile] = useState<File | null>(null);
  const [defaultCenter, setDefaultCenter] = useState<{ lat: number; lng: number }>({
    lat: (org?.settings as Record<string, unknown>)?.default_lat as number ?? 34.0522,
    lng: (org?.settings as Record<string, unknown>)?.default_lng as number ?? -118.2437,
  });
  const [defaultZoom, setDefaultZoom] = useState<number>(
    ((org?.settings as Record<string, unknown>)?.default_zoom as number) ?? 10
  );

  // Members state
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Data Sources state
  const [regridKey, setRegridKey] = useState('');
  const [attomKey, setAttomKey] = useState('');
  const [wmsCredentials, setWmsCredentials] = useState<WmsCredential[]>([]);

  // Layer Presets state
  const [presets, setPresets] = useState<LayerPreset[]>([]);

  // Zoning Lookup state
  const [zoningEntries, setZoningEntries] = useState<ZoningLookupEntry[]>([]);

  // Load members
  const loadMembers = useCallback(async () => {
    if (!org?.id) return;
    setLoadingMembers(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('org_id', org.id)
      .order('full_name');
    if (data) setMembers(data);
    setLoadingMembers(false);
  }, [org?.id, supabase]);

  // Load presets
  const loadPresets = useCallback(async () => {
    if (!org?.id) return;
    const { data } = await supabase
      .from('layer_presets')
      .select('*')
      .or(`org_id.eq.${org.id},is_public.eq.true`)
      .order('sort_order');
    if (data) setPresets(data);
  }, [org?.id, supabase]);

  // Load settings from org
  const loadOrgSettings = useCallback(() => {
    if (!org?.settings) return;
    const settings = org.settings as Record<string, unknown>;
    if (settings.regrid_key) setRegridKey(settings.regrid_key as string);
    if (settings.attom_key) setAttomKey(settings.attom_key as string);
    if (settings.wms_credentials) setWmsCredentials(settings.wms_credentials as WmsCredential[]);
    if (settings.zoning_lookup) setZoningEntries(settings.zoning_lookup as ZoningLookupEntry[]);
  }, [org?.settings]);

  useEffect(() => {
    loadMembers();
    loadPresets();
    loadOrgSettings();
  }, [loadMembers, loadPresets, loadOrgSettings]);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
  }, [profile?.full_name]);

  useEffect(() => {
    setOrgName(org?.name ?? '');
  }, [org?.name]);

  // Handlers
  const handleSaveProfile = async () => {
    if (!profile?.id) return;
    setSaving(true);

    let avatarUrl = profile.avatar_url;
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const path = `avatars/${profile.id}.${ext}`;
      await supabase.storage.from('assets').upload(path, avatarFile, { upsert: true });
      const { data: urlData } = supabase.storage.from('assets').getPublicUrl(path);
      avatarUrl = urlData.publicUrl;
    }

    await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword || newPassword.length < 8) return;
    setSaving(true);
    await supabase.auth.updateUser({ password: newPassword });
    setNewPassword('');
    setConfirmPassword('');
    setSaving(false);
  };

  const handleSaveOrg = async () => {
    if (!org?.id) return;
    setSaving(true);

    let logoUrl = org.logo_url;
    if (orgLogoFile) {
      const ext = orgLogoFile.name.split('.').pop();
      const path = `logos/${org.id}.${ext}`;
      await supabase.storage.from('assets').upload(path, orgLogoFile, { upsert: true });
      const { data: urlData } = supabase.storage.from('assets').getPublicUrl(path);
      logoUrl = urlData.publicUrl;
    }

    const currentSettings = (org.settings ?? {}) as Record<string, unknown>;
    await supabase
      .from('orgs')
      .update({
        name: orgName,
        logo_url: logoUrl,
        settings: {
          ...currentSettings,
          default_lat: defaultCenter.lat,
          default_lng: defaultCenter.lng,
          default_zoom: defaultZoom,
        },
      })
      .eq('id', org.id);
    setSaving(false);
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !org?.id) return;
    setSaving(true);
    // In production, this would send an invite email via edge function
    await supabase.from('invitations').insert({
      org_id: org.id,
      email: inviteEmail.trim(),
      role: 'viewer',
      invited_by: profile?.id,
    });
    setInviteEmail('');
    setSaving(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (role !== 'admin') return;
    await supabase.from('profiles').update({ org_id: null }).eq('id', memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const handleChangeMemberRole = async (memberId: string, newRole: string) => {
    if (role !== 'admin') return;
    await supabase
      .from('profiles')
      .update({ role: newRole as UserRole })
      .eq('id', memberId);
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole as UserRole } : m))
    );
  };

  const handleSaveDataSources = async () => {
    if (!org?.id) return;
    setSaving(true);
    const currentSettings = (org.settings ?? {}) as Record<string, unknown>;
    await supabase
      .from('orgs')
      .update({
        settings: {
          ...currentSettings,
          regrid_key: regridKey,
          attom_key: attomKey,
          wms_credentials: wmsCredentials,
        },
      })
      .eq('id', org.id);
    setSaving(false);
  };

  const addWmsCredential = () => {
    setWmsCredentials((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: '', url: '', username: '', password: '' },
    ]);
  };

  const removeWmsCredential = (id: string) => {
    setWmsCredentials((prev) => prev.filter((c) => c.id !== id));
  };

  const updateWmsCredential = (id: string, field: keyof WmsCredential, value: string) => {
    setWmsCredentials((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSaveZoning = async () => {
    if (!org?.id) return;
    setSaving(true);
    const currentSettings = (org.settings ?? {}) as Record<string, unknown>;
    await supabase
      .from('orgs')
      .update({
        settings: {
          ...currentSettings,
          zoning_lookup: zoningEntries,
        },
      })
      .eq('id', org.id);
    setSaving(false);
  };

  const addZoningEntry = () => {
    setZoningEntries((prev) => [
      ...prev,
      {
        code: '',
        description: '',
        permitted_uses: [],
        max_far: null,
        max_lot_coverage: null,
        min_setbacks: null,
        max_height: null,
        industrial_compatibility: 'not_permitted',
      },
    ]);
  };

  const removeZoningEntry = (idx: number) => {
    setZoningEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateZoningEntry = (idx: number, field: string, value: unknown) => {
    setZoningEntries((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e))
    );
  };

  const handleTogglePreset = async (presetId: string, isPublic: boolean) => {
    await supabase
      .from('layer_presets')
      .update({ is_public: !isPublic })
      .eq('id', presetId);
    setPresets((prev) =>
      prev.map((p) => (p.id === presetId ? { ...p, is_public: !isPublic } : p))
    );
  };

  const roleIcon = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return <Shield className="h-3 w-3 text-[#F59E0B]" />;
      case 'editor':
        return <Edit3 className="h-3 w-3 text-blue-400" />;
      default:
        return <Eye className="h-3 w-3 text-[#9CA3AF]" />;
    }
  };

  return (
    <div className="min-h-full bg-[#0A0E1A] p-4 lg:p-6">
      <h1 className="mb-6 text-xl font-bold text-[#F9FAFB]">Settings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line" className="mb-6 flex-wrap">
          <TabsTrigger value="profile" className="gap-1.5 text-[#9CA3AF] data-active:text-[#F9FAFB]">
            <User className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="organization" className="gap-1.5 text-[#9CA3AF] data-active:text-[#F9FAFB]">
            <Building2 className="h-4 w-4" /> Organization
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5 text-[#9CA3AF] data-active:text-[#F9FAFB]">
            <Users className="h-4 w-4" /> Members
          </TabsTrigger>
          <TabsTrigger value="datasources" className="gap-1.5 text-[#9CA3AF] data-active:text-[#F9FAFB]">
            <Database className="h-4 w-4" /> Data Sources
          </TabsTrigger>
          <TabsTrigger value="presets" className="gap-1.5 text-[#9CA3AF] data-active:text-[#F9FAFB]">
            <Layers className="h-4 w-4" /> Layer Presets
          </TabsTrigger>
          <TabsTrigger value="zoning" className="gap-1.5 text-[#9CA3AF] data-active:text-[#F9FAFB]">
            <MapPin className="h-4 w-4" /> Zoning Lookup
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1.5 text-[#9CA3AF] data-active:text-[#F9FAFB]">
            <Puzzle className="h-4 w-4" /> Integrations
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5 text-[#9CA3AF] data-active:text-[#F9FAFB]">
            <CreditCard className="h-4 w-4" /> Billing
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="max-w-2xl space-y-6">
            <Card className="border-[#374151] bg-[#1F2937]">
              <CardHeader>
                <CardTitle className="text-[#F9FAFB]">Profile</CardTitle>
                <CardDescription className="text-[#9CA3AF]">
                  Manage your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#9CA3AF]">Full Name</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="border-[#374151] bg-[#111827] text-[#F9FAFB]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#9CA3AF]">Avatar</Label>
                  <div className="flex items-center gap-4">
                    {profile?.avatar_url && (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    )}
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#374151] bg-[#111827] px-3 py-2 text-sm text-[#9CA3AF] transition-colors hover:bg-[#1F2937]">
                      <Upload className="h-4 w-4" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    {avatarFile && (
                      <span className="text-xs text-[#9CA3AF]">{avatarFile.name}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#9CA3AF]">Email</Label>
                  <Input
                    value={profile?.email ?? ''}
                    disabled
                    className="border-[#374151] bg-[#111827] text-[#9CA3AF]"
                  />
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="gap-2 bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#D97706]"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-[#374151] bg-[#1F2937]">
              <CardHeader>
                <CardTitle className="text-[#F9FAFB]">Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#9CA3AF]">New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="border-[#374151] bg-[#111827] text-[#F9FAFB]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#9CA3AF]">Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-[#374151] bg-[#111827] text-[#F9FAFB]"
                  />
                </div>
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-400">Passwords do not match</p>
                )}
                <Button
                  onClick={handleChangePassword}
                  disabled={saving || newPassword !== confirmPassword || newPassword.length < 8}
                  variant="outline"
                  className="gap-2 border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
                >
                  <Key className="h-4 w-4" />
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization">
          <div className="max-w-2xl">
            <Card className="border-[#374151] bg-[#1F2937]">
              <CardHeader>
                <CardTitle className="text-[#F9FAFB]">Organization</CardTitle>
                <CardDescription className="text-[#9CA3AF]">
                  Manage your organization settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#9CA3AF]">Organization Name</Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="border-[#374151] bg-[#111827] text-[#F9FAFB]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#9CA3AF]">Logo</Label>
                  <div className="flex items-center gap-4">
                    {org?.logo_url && (
                      <img
                        src={org.logo_url}
                        alt="Org Logo"
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    )}
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#374151] bg-[#111827] px-3 py-2 text-sm text-[#9CA3AF] transition-colors hover:bg-[#1F2937]">
                      <Upload className="h-4 w-4" />
                      Upload Logo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setOrgLogoFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#9CA3AF]">Slug (read-only)</Label>
                  <Input
                    value={org?.slug ?? ''}
                    disabled
                    className="border-[#374151] bg-[#111827] text-[#9CA3AF]"
                  />
                </div>

                <Separator className="bg-[#374151]" />

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-[#9CA3AF]">Default Latitude</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={defaultCenter.lat}
                      onChange={(e) =>
                        setDefaultCenter((prev) => ({
                          ...prev,
                          lat: Number(e.target.value),
                        }))
                      }
                      className="border-[#374151] bg-[#111827] text-[#F9FAFB]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#9CA3AF]">Default Longitude</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={defaultCenter.lng}
                      onChange={(e) =>
                        setDefaultCenter((prev) => ({
                          ...prev,
                          lng: Number(e.target.value),
                        }))
                      }
                      className="border-[#374151] bg-[#111827] text-[#F9FAFB]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#9CA3AF]">Default Zoom</Label>
                    <Input
                      type="number"
                      min={1}
                      max={22}
                      value={defaultZoom}
                      onChange={(e) => setDefaultZoom(Number(e.target.value))}
                      className="border-[#374151] bg-[#111827] text-[#F9FAFB]"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveOrg}
                  disabled={saving}
                  className="gap-2 bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#D97706]"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Organization'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <div className="max-w-3xl space-y-4">
            <Card className="border-[#374151] bg-[#1F2937]">
              <CardHeader>
                <CardTitle className="text-[#F9FAFB]">Team Members</CardTitle>
                <CardDescription className="text-[#9CA3AF]">
                  Manage who has access to your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Invite */}
                {role === 'admin' && (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                      <Input
                        placeholder="Invite by email..."
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="border-[#374151] bg-[#111827] pl-10 text-[#F9FAFB]"
                      />
                    </div>
                    <Button
                      onClick={handleInviteMember}
                      disabled={saving || !inviteEmail.trim()}
                      className="gap-2 bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#D97706]"
                    >
                      <Plus className="h-4 w-4" />
                      Invite
                    </Button>
                  </div>
                )}

                <Separator className="bg-[#374151]" />

                {/* Members Table */}
                {loadingMembers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#F59E0B]" />
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-[#374151]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#374151]">
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#9CA3AF]">
                            Member
                          </th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#9CA3AF]">
                            Email
                          </th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#9CA3AF]">
                            Role
                          </th>
                          {role === 'admin' && (
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#9CA3AF]">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member) => (
                          <tr key={member.id} className="border-b border-[#374151]/50">
                            <td className="px-4 py-2.5 text-[#F9FAFB]">
                              {member.full_name || 'Unnamed'}
                            </td>
                            <td className="px-4 py-2.5 text-[#9CA3AF]">{member.email}</td>
                            <td className="px-4 py-2.5">
                              {role === 'admin' && member.id !== profile?.id ? (
                                <Select
                                  value={member.role}
                                  onValueChange={(val) =>
                                    handleChangeMemberRole(member.id, val as string)
                                  }
                                >
                                  <SelectTrigger className="h-7 w-28 border-[#374151] bg-[#111827] text-xs text-[#F9FAFB]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="border-[#374151] bg-[#1F2937]">
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="editor">Editor</SelectItem>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  {roleIcon(member.role)}
                                  <span className="capitalize text-[#9CA3AF]">
                                    {member.role}
                                  </span>
                                </div>
                              )}
                            </td>
                            {role === 'admin' && (
                              <td className="px-4 py-2.5 text-right">
                                {member.id !== profile?.id && (
                                  <Button
                                    size="icon-xs"
                                    variant="ghost"
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="text-[#9CA3AF] hover:text-red-400"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Data Sources Tab */}
        <TabsContent value="datasources">
          <div className="max-w-2xl space-y-6">
            <Card className="border-[#374151] bg-[#1F2937]">
              <CardHeader>
                <CardTitle className="text-[#F9FAFB]">API Keys</CardTitle>
                <CardDescription className="text-[#9CA3AF]">
                  Configure parcel data provider credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#9CA3AF]">Regrid API Key</Label>
                  <Input
                    type="password"
                    value={regridKey}
                    onChange={(e) => setRegridKey(e.target.value)}
                    placeholder="Enter your Regrid API key..."
                    className="border-[#374151] bg-[#111827] text-[#F9FAFB]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#9CA3AF]">ATTOM API Key</Label>
                  <Input
                    type="password"
                    value={attomKey}
                    onChange={(e) => setAttomKey(e.target.value)}
                    placeholder="Enter your ATTOM API key..."
                    className="border-[#374151] bg-[#111827] text-[#F9FAFB]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#374151] bg-[#1F2937]">
              <CardHeader>
                <CardTitle className="text-[#F9FAFB]">Custom WMS Credentials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {wmsCredentials.map((cred) => (
                  <div
                    key={cred.id}
                    className="grid grid-cols-4 gap-2 rounded-lg border border-[#374151] bg-[#111827] p-3"
                  >
                    <Input
                      placeholder="Name"
                      value={cred.name}
                      onChange={(e) => updateWmsCredential(cred.id, 'name', e.target.value)}
                      className="border-[#374151] bg-transparent text-[#F9FAFB] text-sm"
                    />
                    <Input
                      placeholder="URL"
                      value={cred.url}
                      onChange={(e) => updateWmsCredential(cred.id, 'url', e.target.value)}
                      className="border-[#374151] bg-transparent text-[#F9FAFB] text-sm"
                    />
                    <Input
                      placeholder="Username"
                      value={cred.username}
                      onChange={(e) =>
                        updateWmsCredential(cred.id, 'username', e.target.value)
                      }
                      className="border-[#374151] bg-transparent text-[#F9FAFB] text-sm"
                    />
                    <div className="flex gap-1">
                      <Input
                        type="password"
                        placeholder="Password"
                        value={cred.password}
                        onChange={(e) =>
                          updateWmsCredential(cred.id, 'password', e.target.value)
                        }
                        className="border-[#374151] bg-transparent text-[#F9FAFB] text-sm"
                      />
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => removeWmsCredential(cred.id)}
                        className="shrink-0 text-[#9CA3AF] hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addWmsCredential}
                  className="gap-1 border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
                >
                  <Plus className="h-3 w-3" />
                  Add WMS Source
                </Button>

                <Separator className="bg-[#374151]" />

                <Button
                  onClick={handleSaveDataSources}
                  disabled={saving}
                  className="gap-2 bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#D97706]"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Data Sources'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Layer Presets Tab */}
        <TabsContent value="presets">
          <div className="max-w-2xl">
            <Card className="border-[#374151] bg-[#1F2937]">
              <CardHeader>
                <CardTitle className="text-[#F9FAFB]">Layer Presets</CardTitle>
                <CardDescription className="text-[#9CA3AF]">
                  Manage organization and system layer presets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {presets.length === 0 ? (
                  <p className="py-4 text-sm text-[#9CA3AF]">No layer presets configured.</p>
                ) : (
                  presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between rounded-lg border border-[#374151] bg-[#111827] px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#F9FAFB]">{preset.name}</p>
                        <p className="text-xs text-[#9CA3AF]">
                          {preset.category ?? 'Uncategorized'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={preset.org_id ? 'outline' : 'secondary'}
                          className={
                            preset.org_id
                              ? 'border-[#374151] text-[#9CA3AF]'
                              : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                          }
                        >
                          {preset.org_id ? 'Org' : 'System'}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#9CA3AF]">Enabled</span>
                          <Switch
                            checked={preset.is_public}
                            onCheckedChange={() =>
                              handleTogglePreset(preset.id, preset.is_public)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Zoning Lookup Tab */}
        <TabsContent value="zoning">
          <div className="max-w-4xl">
            <Card className="border-[#374151] bg-[#1F2937]">
              <CardHeader>
                <CardTitle className="text-[#F9FAFB]">Zoning Lookup Table</CardTitle>
                <CardDescription className="text-[#9CA3AF]">
                  Map zoning codes to descriptions, permitted uses, and development standards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#374151]">
                        {[
                          'Code',
                          'Description',
                          'Permitted Uses',
                          'Max FAR',
                          'Max Height',
                          'Setbacks (F/R/S)',
                          'Industrial',
                          '',
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-2 py-2 text-left text-xs font-semibold text-[#9CA3AF]"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {zoningEntries.map((entry, idx) => (
                        <tr key={idx} className="border-b border-[#374151]/50">
                          <td className="px-1 py-1">
                            <Input
                              value={entry.code}
                              onChange={(e) =>
                                updateZoningEntry(idx, 'code', e.target.value)
                              }
                              className="h-7 w-20 border-[#374151] bg-transparent text-xs text-[#F9FAFB]"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <Input
                              value={entry.description}
                              onChange={(e) =>
                                updateZoningEntry(idx, 'description', e.target.value)
                              }
                              className="h-7 w-36 border-[#374151] bg-transparent text-xs text-[#F9FAFB]"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <Input
                              value={entry.permitted_uses.join(', ')}
                              onChange={(e) =>
                                updateZoningEntry(
                                  idx,
                                  'permitted_uses',
                                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                                )
                              }
                              placeholder="Comma-separated"
                              className="h-7 w-36 border-[#374151] bg-transparent text-xs text-[#F9FAFB]"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={entry.max_far ?? ''}
                              onChange={(e) =>
                                updateZoningEntry(
                                  idx,
                                  'max_far',
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                              className="h-7 w-16 border-[#374151] bg-transparent text-xs text-[#F9FAFB]"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <Input
                              type="number"
                              value={entry.max_height ?? ''}
                              onChange={(e) =>
                                updateZoningEntry(
                                  idx,
                                  'max_height',
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                              className="h-7 w-16 border-[#374151] bg-transparent text-xs text-[#F9FAFB]"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <Input
                              placeholder="F/R/S"
                              value={
                                entry.min_setbacks
                                  ? `${entry.min_setbacks.front}/${entry.min_setbacks.rear}/${entry.min_setbacks.side}`
                                  : ''
                              }
                              onChange={(e) => {
                                const parts = e.target.value.split('/').map(Number);
                                if (parts.length === 3 && parts.every((p) => !isNaN(p))) {
                                  updateZoningEntry(idx, 'min_setbacks', {
                                    front: parts[0],
                                    rear: parts[1],
                                    side: parts[2],
                                  });
                                } else if (!e.target.value) {
                                  updateZoningEntry(idx, 'min_setbacks', null);
                                }
                              }}
                              className="h-7 w-20 border-[#374151] bg-transparent text-xs text-[#F9FAFB]"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <Select
                              value={entry.industrial_compatibility}
                              onValueChange={(val) =>
                                updateZoningEntry(idx, 'industrial_compatibility', val)
                              }
                            >
                              <SelectTrigger className="h-7 w-28 border-[#374151] bg-transparent text-xs text-[#F9FAFB]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="border-[#374151] bg-[#1F2937]">
                                <SelectItem value="permitted">Permitted</SelectItem>
                                <SelectItem value="conditional">Conditional</SelectItem>
                                <SelectItem value="not_permitted">Not Permitted</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-1 py-1">
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              onClick={() => removeZoningEntry(idx)}
                              className="text-[#9CA3AF] hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addZoningEntry}
                    className="gap-1 border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
                  >
                    <Plus className="h-3 w-3" />
                    Add Entry
                  </Button>
                  <Button
                    onClick={handleSaveZoning}
                    disabled={saving}
                    className="gap-2 bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#D97706]"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Zoning Table'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="max-w-3xl">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                {
                  name: 'Salesforce',
                  description: 'Sync parcels and deals with Salesforce CRM',
                  icon: '🔄',
                },
                {
                  name: 'CoStar',
                  description: 'Import market analytics and comps data',
                  icon: '📊',
                },
                {
                  name: 'DocuSign',
                  description: 'Send documents for e-signature',
                  icon: '✍️',
                },
                {
                  name: 'Slack',
                  description: 'Get notifications about parcel updates',
                  icon: '💬',
                },
                {
                  name: 'Google Sheets',
                  description: 'Two-way sync with spreadsheets',
                  icon: '📋',
                },
                {
                  name: 'Zapier',
                  description: 'Connect with 5,000+ apps via Zapier',
                  icon: '⚡',
                },
              ].map((integration) => (
                <Card key={integration.name} className="border-[#374151] bg-[#1F2937]">
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#111827] text-xl">
                      {integration.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#F9FAFB]">
                          {integration.name}
                        </p>
                        <Badge className="bg-[#374151] text-[#9CA3AF]">Coming Soon</Badge>
                      </div>
                      <p className="mt-1 text-xs text-[#9CA3AF]">
                        {integration.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <div className="max-w-2xl">
            <Card className="border-[#374151] bg-[#1F2937]">
              <CardHeader>
                <CardTitle className="text-[#F9FAFB]">Billing & Plan</CardTitle>
                <CardDescription className="text-[#9CA3AF]">
                  Manage your subscription and billing information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#F59E0B]">Professional Plan</p>
                      <p className="text-xs text-[#9CA3AF]">
                        Unlimited maps, 10 team members, all features
                      </p>
                    </div>
                    <Badge className="bg-[#F59E0B]/20 text-[#F59E0B]">Active</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-[#374151] bg-[#111827] p-4">
                    <p className="text-xs text-[#9CA3AF]">Next billing date</p>
                    <p className="mt-1 text-sm font-medium text-[#F9FAFB]">April 1, 2026</p>
                  </div>
                  <div className="rounded-lg border border-[#374151] bg-[#111827] p-4">
                    <p className="text-xs text-[#9CA3AF]">Monthly cost</p>
                    <p className="mt-1 text-sm font-medium text-[#F9FAFB]">$199/mo</p>
                  </div>
                </div>

                <Separator className="bg-[#374151]" />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
                  >
                    Change Plan
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
                  >
                    Update Payment Method
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
                  >
                    View Invoices
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
