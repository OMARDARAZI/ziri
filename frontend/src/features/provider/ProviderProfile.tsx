import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { providerProfile, saveProviderProfile } from './provider.api';
import { ErrorState, LoadingState } from '../../components/common/States';
import { Building2, Phone, Mail, MapPin, Save, Loader2 } from 'lucide-react';

type Values = {
  business_name: string;
  phone: string;
  email: string;
  address: string;
  description: string;
};

export function ProviderProfile() {
  const query = useQuery({
    queryKey: ['provider', 'profile'],
    queryFn: providerProfile
  });

  const client = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<Values>();

  useEffect(() => {
    if (query.data) {
      reset({
        business_name: String(query.data.business_name || ''),
        phone: String(query.data.phone || ''),
        email: String(query.data.email || ''),
        address: String(query.data.address || ''),
        description: String(query.data.description || '')
      });
    }
  }, [query.data, reset]);

  const mutation = useMutation({
    mutationFn: saveProviderProfile,
    onSuccess: () => void client.invalidateQueries({ queryKey: ['provider', 'profile'] })
  });

  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;

  const initial = query.data?.business_name ? String(query.data.business_name).charAt(0).toUpperCase() : 'P';

  return (
    <>
      <div className="mb-4">
        <h1 className="h3 mb-1 text-navy fw-800">Business Profile</h1>
        <p className="text-muted font-size-09">Manage your public island experience provider details and addresses.</p>
      </div>

      <div className="row g-4">
        {/* Left Column - Business Card summary */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm text-center py-5">
            <div className="card-body d-flex flex-column align-items-center">
              <div
                className="user-avatar mb-3"
                style={{
                  width: 90,
                  height: 90,
                  fontSize: '2.5rem',
                  boxShadow: '0 4px 12px rgba(11, 127, 131, 0.15)'
                }}
              >
                {initial}
              </div>
              <h2 className="h5 fw-700 text-navy mb-1">{String(query.data.business_name || 'Staff')}</h2>
              <span className="badge text-bg-success px-3 py-1 text-uppercase tracking-wider font-size-075">
                Active Provider
              </span>
              {query.data.description ? (
                <p className="text-muted mt-3 font-size-085 px-2 mb-0 border-top pt-3 text-start w-100">
                  {String(query.data.description)}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right Column - Edit Form Card */}
        <div className="col-md-8">
          <form
            className="card border-0 shadow-sm h-100"
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            noValidate
          >
            <div className="card-header bg-transparent py-3">
              <span className="fw-700 text-navy font-size-095 d-flex align-items-center gap-2">
                <Building2 size={18} className="text-teal" />
                <span>Business Settings</span>
              </span>
            </div>

            <div className="card-body p-4">
              <div className="row g-3">
                {/* Business Name Field */}
                <div className="col-md-6">
                  <label className="form-label" htmlFor="business_name">
                    Business Name <span className="text-danger">*</span>
                  </label>
                  <input
                    id="business_name"
                    className="form-control"
                    placeholder="Enter business name"
                    {...register('business_name', { required: true })}
                  />
                </div>

                {/* Phone Field */}
                <div className="col-md-6">
                  <label className="form-label" htmlFor="phone">
                    Phone Number <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <Phone size={15} />
                    </span>
                    <input
                      id="phone"
                      className="form-control border-start-0 ps-0"
                      placeholder="e.g. 70123456"
                      {...register('phone', { required: true })}
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="col-md-6">
                  <label className="form-label" htmlFor="email">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <Mail size={15} />
                    </span>
                    <input
                      id="email"
                      type="email"
                      className="form-control border-start-0 ps-0"
                      placeholder="e.g. info@business.com"
                      {...register('email')}
                    />
                  </div>
                </div>

                {/* Address Field */}
                <div className="col-md-6">
                  <label className="form-label" htmlFor="address">Location Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <MapPin size={15} />
                    </span>
                    <input
                      id="address"
                      className="form-control border-start-0 ps-0"
                      placeholder="e.g. Coral Bay Reef, Island"
                      {...register('address')}
                    />
                  </div>
                </div>

                {/* Description Field */}
                <div className="col-12">
                  <label className="form-label" htmlFor="description">Public Description</label>
                  <textarea
                    id="description"
                    className="form-control"
                    placeholder="Brief description of experience offerings..."
                    rows={4}
                    {...register('description')}
                  />
                </div>
              </div>

              {mutation.isError && (
                <div className="alert alert-danger mt-3" role="alert">
                  <span>{mutation.error.message}</span>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="card-footer bg-light border-top-0 px-4 py-3 d-flex justify-content-end">
              <button
                className="btn btn-primary d-flex align-items-center gap-2 font-size-095"
                type="submit"
                disabled={isSubmitting || mutation.isPending}
              >
                {isSubmitting || mutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
