import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../api/apiError';
import { getResource, related, saveResource } from './admin.api';
import { meta, type Field } from './resourceMeta';
import { ErrorState, LoadingState } from '../../components/common/States';
import { Save, ArrowLeft, UploadCloud, X, Loader2 } from 'lucide-react';

type Values = Record<string, unknown>;

function inputValue(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function FileField({ field, setValue }: { field: Field; setValue: (name: string, value: File) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return;
    if (file.size > 5 * 1024 * 1024) return;
    setValue(field.name, file);
    setFileName(file.name);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPreview(null);
    setFileName(null);
    // Note: React Hook Form will handle empty value on submit or backend error
  };

  return (
    <div className="col-md-6 mb-3">
      <label className="form-label">{field.label}</label>
      
      {!preview ? (
        <div className="upload-dropzone">
          <UploadCloud className="upload-icon" />
          <span className="fw-600 text-navy font-size-09">Drag & drop or Click to upload</span>
          <span className="text-muted font-size-075">Supported formats: JPG, PNG, WEBP (Max 5MB)</span>
          <input
            className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      ) : (
        <div className="upload-preview-container">
          <img className="upload-preview-image" src={preview} alt={`${field.label} preview`} />
          <div className="flex-grow-1 min-w-0">
            <span className="fw-600 text-navy d-block text-truncate font-size-085">{fileName || 'Selected Image'}</span>
            <span className="text-muted font-size-075">Ready to upload</span>
          </div>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm p-1.5 rounded-circle"
            onClick={handleClear}
            aria-label="Remove image"
            style={{ width: 28, height: 28, minHeight: 'unset' }}
          >
            <X size={14} />
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
    enabled: resource === 'providers' || resource === 'offerings'
  });

  const {
    register,
    handleSubmit,
    setValue,
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
      return (
        <FileField
          key={definition.name}
          field={definition}
          setValue={(name, value) => setValue(name, value)}
        />
      );
    }

    return (
      <div className={isTextArea ? 'col-12 mb-3' : 'col-md-6 mb-3'} key={definition.name}>
        {isCheckbox ? (
          <div className="form-check mt-4.5">
            <input
              className="form-check-input"
              type="checkbox"
              id={definition.name}
              {...register(definition.name)}
            />
            <label className="form-check-label" htmlFor={definition.name}>
              {definition.label}
            </label>
          </div>
        ) : (
          <div className="w-100">
            <label className="form-label d-flex justify-content-between" htmlFor={definition.name}>
              <span>
                {definition.label}
                {definition.required && <span className="text-danger ms-1">*</span>}
              </span>
            </label>
            
            {definition.type === 'textarea' ? (
              <textarea
                id={definition.name}
                className={`form-control ${errors[definition.name] ? 'is-invalid' : ''}`}
                rows={4}
                {...register(definition.name)}
              />
            ) : definition.type === 'select' ? (
              <select
                id={definition.name}
                className={`form-select ${errors[definition.name] ? 'is-invalid' : ''}`}
                {...register(definition.name)}
              >
                <option value="">Choose...</option>
                {definition.name === 'provider_id' &&
                  links.data?.providers.map((row) => (
                    <option key={String(row.id)} value={String(row.id)}>
                      {String(row.business_name)}
                    </option>
                  ))}
                {definition.name === 'user_id' &&
                  links.data?.provider_users.map((row) => (
                    <option key={String(row.id)} value={String(row.id)}>
                      {String(row.full_name)} — {String(row.phone)}
                    </option>
                  ))}
                {definition.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={definition.name}
                className={`form-control ${errors[definition.name] ? 'is-invalid' : ''}`}
                type={definition.type}
                step={definition.type === 'number' ? 'any' : undefined}
                {...register(definition.name)}
                defaultValue={inputValue(item.data?.[definition.name])}
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
    <>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <Link className="btn btn-outline-secondary btn-sm px-2.5 py-1.5" to={`/admin/${resource}`} aria-label="Cancel">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="h3 mb-0 text-navy fw-800">
              {id ? 'Edit' : 'New'} {descriptor.title}
            </h1>
            <p className="text-muted font-size-09 mb-0">Fill in the options to update or register records.</p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <form className="card border-0 shadow-sm" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="card-body p-4">
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
        <div className="card-footer bg-light border-top-0 px-4 py-3 d-flex justify-content-end gap-2">
          <Link className="btn btn-outline-secondary font-size-095" to={`/admin/${resource}`}>
            Cancel
          </Link>
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
                <span>Save Record</span>
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
