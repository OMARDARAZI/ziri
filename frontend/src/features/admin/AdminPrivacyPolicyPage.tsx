import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { env } from '../../api/env';
import { dataOf } from '../../api/response';
import { LoadingState, ErrorState } from '../../components/common/States';
import { ShieldCheck, ExternalLink, Save, CheckCircle2, RefreshCw } from 'lucide-react';

interface PrivacyPolicyData {
  content: string;
}

async function fetchPrivacyPolicy() {
  return dataOf<PrivacyPolicyData>(await api.get('/dashboard/admin/privacy-policy')).data;
}

async function updatePrivacyPolicy(content: string) {
  return dataOf<PrivacyPolicyData>(await api.put('/dashboard/admin/privacy-policy', { content })).data;
}

export function AdminPrivacyPolicyPage() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['admin-privacy-policy'],
    queryFn: fetchPrivacyPolicy,
  });

  // Sync state once fetched
  if (query.data && content === null) {
    setContent(query.data.content);
  }

  const mutation = useMutation({
    mutationFn: updatePrivacyPolicy,
    onSuccess: (data) => {
      setContent(data.content);
      void queryClient.invalidateQueries({ queryKey: ['admin-privacy-policy'] });
      setSuccessMessage('Privacy Policy saved and published successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    },
  });

  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} retry={() => void query.refetch()} />;

  const currentContent = content !== null ? content : query.data?.content || '';

  const handleOpenLivePage = () => {
    const targetUrl = env.backendOrigin ? `${env.backendOrigin}/privacy-policy` : '/privacy-policy';
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(currentContent);
  };

  return (
    <div className="container-fluid py-4">
      {/* Header section */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary d-inline-flex">
              <ShieldCheck size={24} />
            </div>
            <h1 className="h3 fw-800 text-navy mb-0">Privacy Policy Management</h1>
          </div>
          <p className="text-muted small mb-0">
            Manage the official privacy policy terms displayed to mobile app and web visitors.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Open Real Privacy Policy Button */}
          <button
            type="button"
            className="btn btn-outline-primary d-inline-flex align-items-center gap-2 px-3 py-2 fw-600"
            onClick={handleOpenLivePage}
            title="Open public privacy policy page in a new tab"
          >
            <ExternalLink size={16} />
            <span>View Live Privacy Policy</span>
          </button>

          {/* Save Button */}
          <button
            type="submit"
            form="privacy-form"
            className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2 fw-600"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-4 border-0 shadow-sm rounded-3">
          <CheckCircle2 size={18} className="text-success" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid: Editor & Preview */}
      <div className="row g-4">
        {/* Editor Form Column */}
        <div className="col-lg-7">
          <form id="privacy-form" onSubmit={handleSave} className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-transparent border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
              <h2 className="h6 fw-700 mb-0 text-navy">Edit Terms Content</h2>
              <span className="text-muted font-size-08">
                {currentContent.length} characters
              </span>
            </div>
            <div className="card-body p-4">
              <label htmlFor="privacy-text" className="form-label font-size-085 fw-600 text-muted mb-2">
                Policy Document (Markdown / Text)
              </label>
              <textarea
                id="privacy-text"
                className="form-control font-monospace border-light-subtle rounded-3 p-3"
                style={{ minHeight: '440px', fontSize: '0.9rem', lineHeight: '1.6' }}
                value={currentContent}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter privacy policy text..."
                required
              />
            </div>
            <div className="card-footer bg-light border-top py-3 px-4 d-flex justify-content-between align-items-center">
              <span className="text-muted font-size-08">
                Changes take effect immediately across mobile app & web upon saving.
              </span>
              <button
                type="submit"
                className="btn btn-primary btn-sm px-3 py-1.5 font-size-085 fw-600"
                disabled={mutation.isPending}
              >
                Save Policy
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Column */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-transparent border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
              <h2 className="h6 fw-700 mb-0 text-navy">Live Public Preview</h2>
              <span className="badge bg-success-subtle text-success fw-600 font-size-075 px-2 py-1">
                Real-time Preview
              </span>
            </div>
            <div className="card-body p-4 bg-light-subtle overflow-auto" style={{ maxHeight: '540px' }}>
              <div className="card border-0 shadow-xs p-4 rounded-3 bg-white">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <ShieldCheck size={22} className="text-primary" />
                  <h3 className="h5 fw-700 mb-0 text-navy">Zeera Privacy Policy</h3>
                </div>
                <div
                  className="privacy-preview-content text-secondary font-size-085 lh-base"
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {currentContent || <em className="text-muted">No content entered yet.</em>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
