import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { StatusBadge } from '../../components/ui/StatusBadge';

export function AdminUsersPropertiesPage() {
  const { pushToast } = useToast();
  const qc = useQueryClient();
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description: string;
    action: () => Promise<void>;
  } | null>(null);

  const usersQuery = useQuery({ queryKey: ['admin-users'], queryFn: () => adminApi.listUsers({ page: 0, size: 50 }) });
  const propsQuery = useQuery({ queryKey: ['admin-properties'], queryFn: () => adminApi.listProperties({ page: 0, size: 50 }) });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['admin-users'] });
    void qc.invalidateQueries({ queryKey: ['admin-properties'] });
  };

  const allUsers = usersQuery.data?.content ?? [];
  const customers = allUsers.filter((u) => u.role === 'CUSTOMER');
  const owners = allUsers.filter((u) => u.role === 'PROPERTY_OWNER');

  const renderUserRow = (u: (typeof allUsers)[number]) => (
    <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm">
      <div>
        <p className="font-semibold text-white">{u.fullName}</p>
        <p className="text-xs text-slate-400">{u.email} · {u.phoneNumber}</p>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={u.accountStatus} />
        <button
          type="button"
          onClick={() =>
            setConfirmState({
              title: u.accountStatus === 'ACTIVE' ? `Suspend ${u.fullName}?` : `Activate ${u.fullName}?`,
              description: 'This immediately updates the user account access across the platform.',
              action: async () => {
                await adminApi.updateUserStatus(u.id, u.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                pushToast('User status updated', 'success');
                refresh();
              },
            })
          }
          className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
        >
          {u.accountStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-bold text-white">Customers (Users)</h1>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
              {customers.length}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {customers.length === 0 ? (
              <p className="text-xs text-slate-400">No registered customers yet.</p>
            ) : (
              customers.map(renderUserRow)
            )}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-white">Property Owners</h2>
            <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
              {owners.length}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {owners.length === 0 ? (
              <p className="text-xs text-slate-400">No registered property owners yet.</p>
            ) : (
              owners.map(renderUserRow)
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white">Properties &amp; Verification</h2>
        <div className="mt-4 space-y-3">
          {propsQuery.data?.content.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">{p.name} ({p.city})</p>
                  <p className="text-xs text-slate-400">Owner: {p.ownerName} · {p.propertyType}</p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={p.verificationStatus} />
                  <StatusBadge status={p.listingStatus} />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmState({
                      title: `Approve ${p.name}?`,
                      description: 'Approved properties become visible in public search and bookable.',
                      action: async () => {
                        await adminApi.approveProperty(p.id);
                        pushToast('Property approved', 'success');
                        refresh();
                      },
                    })
                  }
                  className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmState({
                      title: `Reject ${p.name}?`,
                      description: 'The owner will be notified that verification was rejected.',
                      action: async () => {
                        await adminApi.rejectProperty(p.id, 'Incomplete documentation');
                        pushToast('Property rejected', 'info');
                        refresh();
                      },
                    })
                  }
                  className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmState({
                      title: `Suspend ${p.name}?`,
                      description: 'Suspending removes the property from active listings.',
                      action: async () => {
                        await adminApi.suspendProperty(p.id);
                        pushToast('Property suspended', 'info');
                        refresh();
                      },
                    })
                  }
                  className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white"
                >
                  Suspend
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title ?? ''}
        description={confirmState?.description ?? ''}
        tone="danger"
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          if (confirmState) {
            void confirmState.action().finally(() => setConfirmState(null));
          }
        }}
      />
    </div>
  );
}

export function AdminVerificationsPage() {
  const { pushToast } = useToast();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['admin-owner-verifications'],
    queryFn: () => adminApi.listOwnerVerifications({ page: 0, size: 20 }),
  });

  return (
    <div className="glass-panel rounded-2xl p-6">
      <h1 className="text-xl font-bold text-white">Owner KYC Verifications</h1>
      <div className="mt-4 space-y-3">
        {query.data?.content.map((v) => (
          <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
            <div>
              <p className="font-semibold text-white">{v.ownerName} · {v.documentType}</p>
              <p className="text-xs text-slate-400">Contact: {v.contactDetails} · Ref: {v.documentReference}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={v.verificationStatus} />
              {v.verificationStatus === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => void adminApi.reviewOwnerVerification(v.id, true, 'Verified').then(() => { pushToast('Owner verified', 'success'); void qc.invalidateQueries({ queryKey: ['admin-owner-verifications'] }); })}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void adminApi.reviewOwnerVerification(v.id, false, 'Invalid document').then(() => { pushToast('Rejected', 'info'); void qc.invalidateQueries({ queryKey: ['admin-owner-verifications'] }); })}
                    className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
