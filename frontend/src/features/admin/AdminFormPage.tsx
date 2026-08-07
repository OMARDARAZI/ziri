import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../api/apiError';
import { getResource, related, saveResource } from './admin.api';
import { meta, type Field } from './resourceMeta';
import { ErrorState, LoadingState } from '../../components/common/States';
import { SearchableSelect, type SelectOption } from '../../components/common/SearchableSelect';
import { Save, ArrowLeft, UploadCloud, X, Loader2 } from 'lucide-react';

type Values = Record<string, unknown>;

function fullUrl(path?: string | null) {
  if (!path || typeof path !== 'string') return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) return path;
  return `http://localhost:3000${path.startsWith('/') ? '' : '/'}${path}`;
}

function inputValue(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime'
];

function FileField({
  field,
  setValue,
  initialUrl
}: {
  field: Field;
  setValue: (name: string, value: File | null) => void;
  initialUrl?: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(fullUrl(initialUrl));
  const [fileName, setFileName] = useState<string | null>(initialUrl ? 'Existing File' : null);
  const [isVideo, setIsVideo] = useState<boolean>(false);

  useEffect(() => {
    if (initialUrl && !preview) {
      const url = fullUrl(initialUrl);
      setPreview(url);
      setFileName('Existing Uploaded File');
      const isVid = typeof initialUrl === 'string' && (initialUrl.toLowerCase().endsWith('.mp4') || initialUrl.toLowerCase().endsWith('.mov') || initialUrl.toLowerCase().endsWith('.webm'));
      setIsVideo(isVid);
    }
  }, [initialUrl]);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = (file: File) => {
    const isVid = file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4') || file.name.toLowerCase().endsWith('.mov') || file.name.toLowerCase().endsWith('.webm');
    if (!isVid && !ALLOWED_TYPES.includes(file.type)) return;
    if (file.size > 100 * 1024 * 1024) return;
    setValue(field.name, file);
    setFileName(file.name);
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setIsVideo(isVid);
    setPreview(URL.createObjectURL(file));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName(null);
    setIsVideo(false);
    setValue(field.name, null);
  };

  return (
    <div className="col-md-12 mb-4">
      <label className="form-label font-weight-semibold text-dark mb-2" style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>{field.label}</label>

      {!preview ? (
        <div
          className="upload-dropzone p-4 text-center border-2 border-dashed rounded-4 position-relative"
          style={{ borderColor: '#CBD5E1', backgroundColor: '#F8FAFC', cursor: 'pointer', borderRadius: '1rem' }}
        >
          <UploadCloud className="upload-icon mx-auto mb-2 text-success" size={32} style={{ color: '#14532D' }} />
          <span className="fw-700 text-dark d-block mb-1" style={{ fontSize: '0.92rem' }}>Drag & drop or Click to upload</span>
          <span className="text-secondary d-block" style={{ fontSize: '0.78rem' }}>Supported formats: MP4, MOV, WEBM, JPG, PNG, WEBP (Max 100MB)</span>
          <input
            className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer"
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      ) : (
        <div className="d-flex align-items-center gap-3 p-3 border rounded-4 bg-light position-relative" style={{ borderColor: '#E2E8F0', borderRadius: '1rem' }}>
          {isVideo ? (
            <video className="rounded-3" src={`${preview}#t=0.001`} preload="metadata" controls style={{ width: 100, height: 80, objectFit: 'cover' }} />
          ) : (
            <img className="rounded-3" src={preview} alt={`${field.label} preview`} style={{ width: 100, height: 80, objectFit: 'cover' }} />
          )}
          <div className="flex-grow-1 min-w-0">
            <span className="fw-700 text-dark d-block text-truncate mb-1" style={{ fontSize: '0.9rem' }}>{fileName || 'Uploaded Media'}</span>
            <span className="text-success fw-600 font-size-075" style={{ color: '#14532D' }}>✓ Media Loaded</span>
          </div>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm p-1.5 rounded-circle"
            onClick={handleClear}
            aria-label="Remove file"
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export function AdminFormPage() {
  const { resource = 'stories', id } = useParams();
  const descriptor = meta(resource);
  const navigate = useNavigate();
  const client = useQueryClient();

  const item = useQuery({
    queryKey: ['admin', resource, id],
    queryFn: () => getResource(resource, id || ''),
    enabled: Boolean(id)
  });

  const links = useQuery({
    queryKey: ['admin', 'related'],
    queryFn: related,
    enabled: ['providers', 'offerings', 'users', 'provider-users'].includes(resource)
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<Values>({
    defaultValues: { is_active: true }
  });

  useEffect(() => {
    if (item.data) {
      const values: Values = {};
      Object.entries(item.data).forEach(([key, value]) => {
        if (typeof value === 'boolean' || typeof value === 'string' || typeof value === 'number') {
          values[key] = value;
        }
      });
      reset(values);
    }
  }, [item.data, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => saveResource(resource, id, data),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['admin', resource] });
      void client.invalidateQueries({ queryKey: ['admin', 'summary'] });
      navigate(`/admin/${resource}`);
    }
  });

  const onSubmit = async (values: Values) => {
    console.log('Submitting admin form values:', values);
    const parsed = descriptor.schema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const fieldName = issue.path[0];
        if (typeof fieldName === 'string') {
          setError(fieldName, { message: issue.message });
        }
      }
      return;
    }

    const payload = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value instanceof File) {
        payload.append(key, value);
      } else if (typeof value === 'boolean') {
        payload.append(key, value ? '1' : '0');
      } else if (value !== undefined && value !== null) {
        payload.append(key, String(value));
      }
    });

    try {
      await mutation.mutateAsync(payload);
    } catch (error) {
      if (error instanceof ApiError) {
        for (const field of error.fields) {
          setError(field.field, { message: field.message });
        }
      }
    }
  };

  if (item.isLoading || links.isLoading) return <LoadingState />;
  if (item.isError) return <ErrorState error={item.error} retry={() => void item.refetch()} />;

  const renderField = (definition: Field) => {
    const isTextArea = definition.type === 'textarea';
    const isCheckbox = definition.type === 'checkbox';
    
    if (definition.type === 'file') {
      const existingUrl = (
        item.data?.[definition.name] ||
        item.data?.media_url ||
        item.data?.image_url ||
        item.data?.cover_image_url ||
        item.data?.logo_url ||
        item.data?.icon_url
      ) as string | undefined;

      return (
        <FileField
          key={definition.name}
          field={definition}
          setValue={(name, value) => setValue(name, value as any)}
          initialUrl={existingUrl}
        />
      );
    }

    return (
      <div className={isTextArea ? 'col-12 mb-3.5' : 'col-md-6 mb-3.5'} key={definition.name}>
        {isCheckbox ? (
          <div className="form-check mt-3">
            <input
              className="form-check-input"
              type="checkbox"
              id={definition.name}
              {...register(definition.name)}
            />
            <label className="form-check-label fw-600 text-dark" htmlFor={definition.name}>
              {definition.label}
            </label>
          </div>
        ) : (
          <div className="w-100">
            <label className="form-label fw-700 text-dark mb-1.5" htmlFor={definition.name} style={{ fontSize: '0.88rem' }}>
              <span>
                {definition.label}
                {definition.required && <span className="text-danger ms-1">*</span>}
              </span>
            </label>
            
            {definition.type === 'textarea' ? (
              <textarea
                id={definition.name}
                className={`form-control rounded-3 ${errors[definition.name] ? 'is-invalid' : ''}`}
                rows={4}
                {...register(definition.name)}
                style={{ borderColor: '#CBD5E1' }}
              />
            ) : definition.type === 'select' ? (() => {
              let selectOptions: SelectOption[] = [];
              if (definition.name === 'provider_id') {
                selectOptions = (links.data?.providers || []).map((row) => ({
                  value: String(row.id),
                  label: String(row.business_name)
                }));
              } else if (definition.name === 'user_id') {
                selectOptions = (links.data?.provider_users || []).map((row) => ({
                  value: String(row.id),
                  label: String(row.full_name),
                  sublabel: String(row.phone)
                }));
              } else if (definition.options) {
                selectOptions = definition.options.map((option) => ({
                  value: option,
                  label: option
                }));
              }
              const currentValue = String(watch(definition.name) ?? item.data?.[definition.name] ?? '');
              return (
                <SearchableSelect
                  id={definition.name}
                  name={definition.name}
                  value={currentValue}
                  onChange={(val) => setValue(definition.name, val, { shouldValidate: true })}
                  options={selectOptions}
                  placeholder={`Select ${definition.label.toLowerCase()}...`}
                  error={Boolean(errors[definition.name])}
                />
              );
            })() : (
              <input
                id={definition.name}
                className={`form-control rounded-3 ${errors[definition.name] ? 'is-invalid' : ''}`}
                type={definition.type}
                step={definition.type === 'number' ? 'any' : undefined}
                {...register(definition.name)}
                defaultValue={inputValue(item.data?.[definition.name])}
                style={{ borderColor: '#CBD5E1' }}
              />
            )}
          </div>
        )}
        {errors[definition.name]?.message && (
          <small className="text-danger d-block mt-1 font-size-08">{String(errors[definition.name]?.message)}</small>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0" style={{ width: 38, height: 38 }} to={`/admin/${resource}`} aria-label="Cancel">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="h3 mb-0 text-dark fw-800" style={{ color: '#0F172A' }}>
              {id ? 'Edit' : 'New'} {descriptor.title}
            </h1>
            <p className="text-secondary font-size-09 mb-0" style={{ color: '#64748B' }}>Configure information and upload media for {descriptor.title.toLowerCase()}.</p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <form className="card border p-4 shadow-sm" style={{ borderRadius: '1.25rem', borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="card-body p-2">
          <div className="row">
            {descriptor.fields.map(renderField)}
          </div>

          {mutation.isError && (
            <div className="alert alert-danger mt-3" role="alert">
              <span>{mutation.error.message}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-top pt-4 mt-2 d-flex justify-content-end gap-2.5" style={{ borderColor: '#F1F5F9' }}>
          <Link className="btn btn-light rounded-pill px-4 py-2 font-weight-semibold" style={{ borderColor: '#E2E8F0' }} to={`/admin/${resource}`}>
            Cancel
          </Link>
          <button
            className="btn text-white rounded-pill px-4 py-2 fw-700 d-inline-flex align-items-center gap-2 shadow-sm"
            style={{ backgroundColor: '#14532D', border: 'none' }}
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
                <span>Save Record</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
