import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { userApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { ErrorState } from '../../components/ui/ErrorState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { Gender } from '../../types/api';

interface ProfileForm {
  fullName: string;
  phoneNumber: string;
  gender?: Gender;
  profileImage?: string;
}

export function ProfilePage() {
  const { pushToast } = useToast();
  const profileQuery = useQuery({ queryKey: ['my-profile'], queryFn: userApi.getProfile });

  const { register, handleSubmit, reset } = useForm<ProfileForm>();

  useEffect(() => {
    if (profileQuery.data) {
      reset({
        fullName: profileQuery.data.fullName,
        phoneNumber: profileQuery.data.phoneNumber,
        gender: profileQuery.data.gender,
        profileImage: profileQuery.data.profileImage ?? '',
      });
    }
  }, [profileQuery.data, reset]);

  const updateMutation = useMutation({
    mutationFn: (values: ProfileForm) => userApi.updateProfile({ ...values }),
    onSuccess: () => {
      pushToast('Profile updated', 'success');
      void profileQuery.refetch();
    },
    onError: (err: Error) => pushToast(err.message, 'error'),
  });

  if (profileQuery.isLoading) return <div className="glass-panel h-64 animate-pulse rounded-2xl" />;
  if (profileQuery.isError || !profileQuery.data) {
    return <ErrorState message={(profileQuery.error as Error)?.message ?? 'Failed to load profile'} onRetry={() => void profileQuery.refetch()} />;
  }

  const u = profileQuery.data;

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Account Profile</h1>
          <p className="text-xs text-slate-400">{u.email} · {u.role.replace('_', ' ')}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={u.accountStatus} />
          <span className={`rounded-full px-2.5 py-0.5 text-xs ${u.emailVerified ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
            {u.emailVerified ? 'Email Verified' : 'Email Unverified'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit((v) => updateMutation.mutate(v))} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="prof-name" className="block text-sm text-slate-300">Full Name</label>
            <input id="prof-name" {...register('fullName', { required: true })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white" />
          </div>
          <div>
            <label htmlFor="prof-phone" className="block text-sm text-slate-300">Phone Number</label>
            <input id="prof-phone" {...register('phoneNumber', { required: true })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white" />
          </div>
          <div>
            <label htmlFor="prof-gender" className="block text-sm text-slate-300">Gender</label>
            <select id="prof-gender" {...register('gender')} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white">
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="prof-img" className="block text-sm text-slate-300">Profile Image URL</label>
            <input id="prof-img" {...register('profileImage')} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white" />
          </div>
        </div>
        <button type="submit" disabled={updateMutation.isPending} className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white">
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
