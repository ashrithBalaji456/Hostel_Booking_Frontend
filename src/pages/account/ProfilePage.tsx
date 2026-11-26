import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Briefcase, GraduationCap, Upload, User as UserIcon } from 'lucide-react';
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
  occupationType?: string;
  organizationName?: string;
  courseOrRole?: string;
}

function compressAvatarFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        const maxDim = 400;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function ProfilePage() {
  const { pushToast } = useToast();
  const profileQuery = useQuery({ queryKey: ['my-profile'], queryFn: userApi.getProfile });
  const [avatarPreview, setAvatarPreview] = useState('');

  const { register, handleSubmit, reset, setValue, watch } = useForm<ProfileForm>();
  const currentOcc = watch('occupationType');
  const currentImg = watch('profileImage');

  useEffect(() => {
    if (profileQuery.data) {
      reset({
        fullName: profileQuery.data.fullName,
        phoneNumber: profileQuery.data.phoneNumber,
        gender: profileQuery.data.gender,
        profileImage: profileQuery.data.profileImage ?? '',
        occupationType: profileQuery.data.occupationType ?? 'STUDENT',
        organizationName: profileQuery.data.organizationName ?? '',
        courseOrRole: profileQuery.data.courseOrRole ?? '',
      });
      setAvatarPreview(profileQuery.data.profileImage ?? '');
    }
  }, [profileQuery.data, reset]);

  useEffect(() => {
    setAvatarPreview(currentImg ?? '');
  }, [currentImg]);

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
        <div className="flex items-center gap-3">
          {avatarPreview ? (
            <img src={avatarPreview} alt={u.fullName} className="h-12 w-12 rounded-full border border-cyan-400/50 object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-cyan-300">
              <UserIcon className="h-5 w-5" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-white">Account Profile</h1>
            <p className="text-xs text-slate-400">{u.email} · {u.role.replace('_', ' ')}</p>
          </div>
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
            <label htmlFor="prof-occ" className="block text-sm text-slate-300">Occupation</label>
            <select id="prof-occ" {...register('occupationType')} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white">
              <option value="STUDENT">Student</option>
              <option value="JOB_HOLDER">Job Holder / Working Professional</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="prof-org" className="flex items-center gap-1.5 text-sm text-slate-300">
              {currentOcc === 'JOB_HOLDER' ? <Briefcase className="h-3.5 w-3.5 text-cyan-400" /> : <GraduationCap className="h-3.5 w-3.5 text-cyan-400" />}
              {currentOcc === 'JOB_HOLDER' ? 'Company / Organization' : 'College / University / Company'}
            </label>
            <input
              id="prof-org"
              {...register('organizationName')}
              placeholder={currentOcc === 'JOB_HOLDER' ? 'e.g. TCS / Infosys' : 'e.g. NIT Warangal / Osmania University'}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label htmlFor="prof-course" className="block text-sm text-slate-300">
              {currentOcc === 'JOB_HOLDER' ? 'Role / Designation' : 'Course / Branch (Optional)'}
            </label>
            <input
              id="prof-course"
              {...register('courseOrRole')}
              placeholder={currentOcc === 'JOB_HOLDER' ? 'e.g. Software Engineer' : 'e.g. B.Tech CSE 3rd Year'}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="prof-img" className="block text-sm text-slate-300">Profile Photo (URL or Upload)</label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <input
                id="prof-img"
                {...register('profileImage')}
                placeholder="Paste image URL (https://...) or upload a photo"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white"
              />
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3.5 py-2.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25">
                <Upload className="h-3.5 w-3.5" />
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const dataUrl = await compressAvatarFile(file);
                      setValue('profileImage', dataUrl, { shouldDirty: true });
                      setAvatarPreview(dataUrl);
                      pushToast('Photo loaded — click Save Profile to apply', 'info');
                    } catch {
                      pushToast('Could not read image file', 'error');
                    } finally {
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
