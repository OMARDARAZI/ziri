import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/apiError';
import { Alert } from '../components/common/States';
import { useAuth, useRequestedPath } from '../auth/AuthProvider';
import type { DashboardRole } from '../auth/auth.types';
import { Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

const schema = z.object({
  phone: z.string().min(7, 'Phone number is required'),
  password: z.string().min(1, 'Password is required')
});

type Form = z.infer<typeof schema>;

export function LoginPage({ role }: { role: DashboardRole }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const requested = useRequestedPath();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<Form>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (values: Form) => {
    try {
      await login(role, values.phone, values.password);
      navigate(
        requested === '/'
          ? role === 'ADMIN'
            ? '/admin/dashboard'
            : '/provider/dashboard'
          : requested,
        { replace: true }
      );
    } catch (error) {
      setError('root', {
        message: error instanceof ApiError ? error.message : 'Login failed'
      });
    }
  };

  return (
    <>
      <div className="text-center mb-4">
        <h1 className="h3 fw-800 text-navy mb-1">Zeere</h1>
        <span className="badge text-bg-warning px-2.5 py-1 text-uppercase tracking-wider font-size-075">
          {role === 'ADMIN' ? 'Admin Portal' : 'Provider Portal'}
        </span>
      </div>

      <p className="text-muted text-center font-size-09 mb-4">Sign in to your account to manage operations.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="d-flex flex-column gap-3">
        {/* Phone Input */}
        <div>
          <label className="form-label" htmlFor="phone">Phone</label>
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0 text-muted">
              <Phone size={16} />
            </span>
            <input
              id="phone"
              className={`form-control border-start-0 ps-0 ${errors.phone ? 'is-invalid' : ''}`}
              placeholder="e.g. 70123456"
              autoComplete="username"
              {...register('phone')}
            />
          </div>
          {errors.phone && (
            <small className="text-danger d-block mt-1 font-size-08">{errors.phone.message}</small>
          )}
        </div>

        {/* Password Input */}
        <div>
          <label className="form-label" htmlFor="password">Password</label>
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0 text-muted">
              <Lock size={16} />
            </span>
            <input
              id="password"
              className={`form-control border-start-0 border-end-0 ps-0 ${errors.password ? 'is-invalid' : ''}`}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
            />
            <button
              type="button"
              className="btn btn-outline-secondary border-start-0 px-3 bg-light text-muted"
              onClick={() => setShowPassword(!showPassword)}
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <small className="text-danger d-block mt-1 font-size-08">{errors.password.message}</small>
          )}
        </div>

        {/* Root authentication errors */}
        {errors.root && (
          <div className="mt-2">
            <Alert>{errors.root.message}</Alert>
          </div>
        )}

        {/* Sign In Button */}
        <button
          className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 mt-2"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign in</span>
          )}
        </button>
      </form>
    </>
  );
}
