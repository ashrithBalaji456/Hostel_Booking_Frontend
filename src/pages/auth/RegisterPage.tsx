import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '../../api/endpoints';
import { ApiClientError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=-]).{8,72}$/,
      '8-72 chars with uppercase, lowercase, digit, and special character',
    ),
  phoneNumber: z.string().regex(/^(\+91)?[6-9]\d{9}$/, 'Enter a valid Indian mobile number'),
  role: z.enum(['CUSTOMER', 'PROPERTY_OWNER']),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  occupationType: z.enum(['STUDENT', 'JOB_HOLDER', 'OTHER']).optional(),
  organizationName: z.string().max(200).optional(),
  courseOrRole: z.string().max(150).optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { setSession } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'CUSTOMER', gender: 'MALE', occupationType: 'STUDENT' },
  });
  const selectedRole = watch('role');
  const selectedOcc = watch('occupationType');

  const onSubmit = async (values: RegisterForm) => {
    setServerError(null);
    try {
      const auth = await authApi.register(values);
      setSession(auth);
      pushToast('Account created successfully!', 'success');
      if (auth.verificationToken) {
        navigate(`/verify-email?token=${encodeURIComponent(auth.verificationToken)}`);
      } else if (auth.user.role === 'PROPERTY_OWNER') {
        navigate('/owner');
      } else {
        navigate('/search');
      }
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-lg items-center px-4 py-12">
      <div className="glass-panel w-full rounded-3xl p-8">
        <h1 className="text-2xl font-bold text-white">Create your Spatial Stay account</h1>
        <p className="mt-1 text-sm text-slate-400">
          Students, job seekers, and working professionals use Customer accounts. Hostel/PG managers use Property Owner.
        </p>

        {serverError && (
          <div role="alert" className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-200">Full Name</label>
            <input id="fullName" {...register('fullName')} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white" />
            {errors.fullName && <p className="mt-1 text-xs text-rose-400">{errors.fullName.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200">Email</label>
              <input id="email" type="email" {...register('email')} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white" />
              {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-200">Phone (+91)</label>
              <input id="phoneNumber" placeholder="9876543210" {...register('phoneNumber')} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white" />
              {errors.phoneNumber && <p className="mt-1 text-xs text-rose-400">{errors.phoneNumber.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-200">Password</label>
            <input id="password" type="password" {...register('password')} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white" />
            {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-200">Account Role</label>
              <select id="role" {...register('role')} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white">
                <option value="CUSTOMER">Customer (Student / Job Seeker)</option>
                <option value="PROPERTY_OWNER">Property Owner (Hostel / PG)</option>
              </select>
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-slate-200">Gender (for hostel policy matching)</label>
              <select id="gender" {...register('gender')} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {selectedRole === 'CUSTOMER' && (
            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="occupationType" className="block text-xs font-medium text-slate-300">Occupation</label>
                  <select id="occupationType" {...register('occupationType')} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white">
                    <option value="STUDENT">Student</option>
                    <option value="JOB_HOLDER">Job Holder / Working</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="organizationName" className="block text-xs font-medium text-slate-300">
                    {selectedOcc === 'JOB_HOLDER' ? 'Company Name' : 'College / University'}
                  </label>
                  <input
                    id="organizationName"
                    {...register('organizationName')}
                    placeholder={selectedOcc === 'JOB_HOLDER' ? 'e.g. TCS, Infosys' : 'e.g. NIT Warangal'}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="courseOrRole" className="block text-xs font-medium text-slate-300">
                  {selectedOcc === 'JOB_HOLDER' ? 'Job Role (Optional)' : 'Course / Branch (Optional)'}
                </label>
                <input
                  id="courseOrRole"
                  {...register('courseOrRole')}
                  placeholder={selectedOcc === 'JOB_HOLDER' ? 'e.g. Software Engineer' : 'e.g. B.Tech CSE'}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-400">
          Already have an account? <Link to="/login" className="text-cyan-300 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
