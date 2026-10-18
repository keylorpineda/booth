import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Plus, ShieldCheck, Trash2, UserCheck, Users, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  type CreateInvitationInput,
  createInvitationInputSchema,
  type Store,
  type StoreMembership,
  type StoreRole,
} from '@booth/shared';

import {
  useCancelInvitationMutation,
  useCreateInvitationMutation,
  useRemoveMemberMutation,
  useTeamInvitationsQuery,
  useTeamMembersQuery,
  useUpdateMemberRoleMutation,
} from './api';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { CopyButton } from '../../../components/ui/copy-button';
import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Skeleton } from '../../../components/ui/skeleton';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { useFormError } from '../../../hooks/use-form-error';
import { useCanWrite } from '../../auth/use-can-write';

export function TeamPanel({ store: _store }: { store: Store }) {
  const { t } = useTranslation();
  const canWrite = useCanWrite();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<StoreMembership | null>(null);

  const membersQuery = useTeamMembersQuery();
  const invitationsQuery = useTeamInvitationsQuery();
  const createInviteMutation = useCreateInvitationMutation();
  const cancelInviteMutation = useCancelInvitationMutation();
  const updateRoleMutation = useUpdateMemberRoleMutation();
  const removeMemberMutation = useRemoveMemberMutation();
  const errorMessage = useErrorMessage();

  const form = useForm<CreateInvitationInput>({
    resolver: zodResolver(createInvitationInputSchema),
    defaultValues: {
      email: '',
      role: 'STAFF',
    },
  });
  const error = useFormError(form);

  const onInviteSubmit = async (values: CreateInvitationInput) => {
    try {
      await createInviteMutation.mutateAsync(values);
      toast.success(t('settings.team.inviteSent'));
      form.reset();
      setShowInviteForm(false);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const handleRoleChange = async (memberId: string, role: StoreRole) => {
    try {
      await updateRoleMutation.mutateAsync({ memberId, role });
      toast.success(t('settings.team.roleUpdated'));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await removeMemberMutation.mutateAsync(memberToRemove.id);
      toast.success(t('settings.team.memberRemoved'));
      setMemberToRemove(null);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    try {
      await cancelInviteMutation.mutateAsync(invitationId);
      toast.success(t('settings.team.inviteCanceled'));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (membersQuery.isLoading) {
    return <Skeleton className="h-[32rem] max-w-2xl rounded-card" />;
  }

  const members = membersQuery.data ?? [];
  const invitations = invitationsQuery.data ?? [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Team Header Card */}
      <div className="flex flex-col gap-4 rounded-card border border-line bg-surface-raised p-5 shadow-card sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-control bg-brand-soft text-brand-ink">
              <Users className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold sm:text-lg">{t('settings.team.title')}</h2>
              <p className="text-sm text-ink-muted">{t('settings.team.description')}</p>
            </div>
          </div>
          {!showInviteForm ? (
            <Button
              size="sm"
              disabled={!canWrite}
              onClick={() => {
                setShowInviteForm(true);
              }}
              className="shrink-0"
            >
              <Plus className="size-4" />
              <span>{t('settings.team.inviteButton')}</span>
            </Button>
          ) : null}
        </div>

        {/* Invite Form */}
        {showInviteForm ? (
          <form
            onSubmit={(event) => void form.handleSubmit(onInviteSubmit)(event)}
            className="mt-2 rounded-control border border-line bg-surface p-4"
          >
            <div className="flex items-center justify-between pb-3">
              <span className="font-semibold">{t('settings.team.inviteTitle')}</span>
              <button
                type="button"
                onClick={() => {
                  setShowInviteForm(false);
                }}
                className="rounded-full p-1 text-ink-muted hover:bg-surface-sunken"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              <Field label={t('auth.emailLabel')} error={error('email')}>
                {(control) => (
                  <Input
                    type="email"
                    placeholder="empleado@ejemplo.com"
                    autoComplete="off"
                    {...control}
                    {...form.register('email')}
                  />
                )}
              </Field>

              <Field label={t('settings.team.roleLabel')} error={error('role')}>
                {(control) => (
                  <Select {...control} {...form.register('role')}>
                    <option value="STAFF">{t('settings.team.roles.staff')}</option>
                    <option value="CATALOG_MANAGER">
                      {t('settings.team.roles.catalogManager')}
                    </option>
                    <option value="OWNER">{t('settings.team.roles.owner')}</option>
                  </Select>
                )}
              </Field>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowInviteForm(false);
                  }}
                >
                  {t('actions.cancel')}
                </Button>
                <Button type="submit" size="sm" loading={createInviteMutation.isPending}>
                  {t('settings.team.sendInvite')}
                </Button>
              </div>
            </div>
          </form>
        ) : null}
      </div>

      {/* Pending Invitations Card */}
      {invitations.length > 0 ? (
        <div className="flex flex-col gap-4 rounded-card border border-line bg-surface-raised p-5 shadow-card sm:p-6">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-ink-muted" />
            <h3 className="font-bold">{t('settings.team.pendingInvitations')}</h3>
            <Badge tone="neutral">{invitations.length}</Badge>
          </div>

          <div className="divide-y divide-line rounded-control border border-line">
            {invitations.map((inv) => {
              const inviteUrl = `${window.location.origin}/invite/${inv.token}`;
              return (
                <div
                  key={inv.id}
                  className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{inv.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge tone={inv.role === 'STAFF' ? 'warning' : 'brand'}>
                        {t(`settings.team.roles.${inv.role.toLowerCase()}` as never)}
                      </Badge>
                      <span className="text-xs text-ink-muted">
                        {t('settings.team.expiresAt', {
                          date: new Date(inv.expiresAt).toLocaleDateString(),
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <CopyButton value={inviteUrl} label={t('settings.team.copyInviteLink')} />
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canWrite}
                      onClick={() => void handleCancelInvite(inv.id)}
                      className="text-danger hover:bg-danger/10"
                    >
                      {t('actions.cancel')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Active Members Card */}
      <div className="flex flex-col gap-4 rounded-card border border-line bg-surface-raised p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-2">
          <UserCheck className="size-4 text-ink-muted" />
          <h3 className="font-bold">{t('settings.team.activeMembers')}</h3>
          <Badge tone="neutral">{members.length}</Badge>
        </div>

        <div className="divide-y divide-line rounded-control border border-line">
          {members.map((member) => {
            const isStoreOwner = member.role === 'OWNER';
            return (
              <div
                key={member.id}
                className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{member.user.name}</p>
                    {isStoreOwner ? (
                      <Badge tone="brand">
                        <ShieldCheck className="size-3" />
                        {t('settings.team.roles.owner')}
                      </Badge>
                    ) : (
                      <Badge tone={member.role === 'STAFF' ? 'warning' : 'brand'}>
                        {t(`settings.team.roles.${member.role.toLowerCase()}` as never)}
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-ink-muted">{member.user.email}</p>
                </div>

                {!isStoreOwner ? (
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <select
                      value={member.role}
                      disabled={!canWrite}
                      onChange={(e) =>
                        void handleRoleChange(member.id, e.target.value as StoreRole)
                      }
                      className="h-9 rounded-control border border-line bg-surface px-2.5 text-xs font-medium"
                    >
                      <option value="STAFF">{t('settings.team.roles.staff')}</option>
                      <option value="CATALOG_MANAGER">
                        {t('settings.team.roles.catalogManager')}
                      </option>
                      <option value="OWNER">{t('settings.team.roles.owner')}</option>
                    </select>

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canWrite}
                      onClick={() => {
                        setMemberToRemove(member);
                      }}
                      className="text-danger hover:bg-danger/10"
                      aria-label={t('settings.team.removeMember')}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirm Remove Member Dialog */}
      <ConfirmDialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => {
          if (!open) setMemberToRemove(null);
        }}
        title={t('settings.team.removeMemberTitle')}
        description={t('settings.team.removeMemberDescription', {
          name: memberToRemove?.user.name,
        })}
        confirmLabel={t('settings.team.removeConfirm')}
        destructive
        loading={removeMemberMutation.isPending}
        onConfirm={() => void handleRemoveMember()}
      />
    </div>
  );
}
