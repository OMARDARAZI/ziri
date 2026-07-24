import { Trash2, Check, X, ShieldAlert } from 'lucide-react';

interface ConfirmButtonProps {
  label: string;
  onConfirm: () => void;
  className?: string;
}

export function ConfirmButton({ label, onConfirm, className = 'btn btn-outline-danger btn-sm' }: ConfirmButtonProps) {
  const getIcon = () => {
    const text = label.toLowerCase();
    if (text.includes('delete')) return <Trash2 size={13} className="flex-shrink-0" />;
    if (text.includes('confirm')) return <Check size={13} className="flex-shrink-0" />;
    if (text.includes('cancel')) return <X size={13} className="flex-shrink-0" />;
    return <ShieldAlert size={13} className="flex-shrink-0" />;
  };

  const handleClick = () => {
    if (window.confirm(`Are you sure you want to ${label.toLowerCase()}?`)) {
      onConfirm();
    }
  };

  return (
    <button type="button" className={`${className} d-inline-flex align-items-center gap-1.5`} onClick={handleClick}>
      {getIcon()}
      <span>{label}</span>
    </button>
  );
}
