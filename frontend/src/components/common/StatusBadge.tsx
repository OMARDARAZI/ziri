import { CheckCircle2, XCircle, Clock, HelpCircle } from 'lucide-react';

export function StatusBadge({ value }: { value: string | boolean | null | undefined }) {
  const text = value === true ? 'Active' : value === false ? 'Inactive' : String(value || 'Unknown').replaceAll('_', ' ');
  
  // Determine style type and matching icon
  let type: 'success' | 'danger' | 'warning' | 'info' | 'secondary' = 'secondary';
  let Icon = HelpCircle;

  if (/ACTIVE|CONFIRMED|USED|VALIDATED|Active/i.test(text)) {
    type = 'success';
    Icon = CheckCircle2;
  } else if (/CANCEL|EXPIRE|FAIL|Inactive|INVALID|WRONG|NOT_CONFIRMED/i.test(text)) {
    type = 'danger';
    Icon = XCircle;
  } else if (/PENDING|NOT_YET|WARNING/i.test(text)) {
    type = 'warning';
    Icon = Clock;
  } else if (/COMPLETED|INFO/i.test(text)) {
    type = 'info';
    Icon = CheckCircle2;
  }

  return (
    <span className={`badge text-bg-${type} d-inline-flex align-items-center gap-1 py-1 px-2.5`}>
      <Icon size={12} className="flex-shrink-0" />
      <span>{text}</span>
    </span>
  );
}
