import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  id?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
}

export function SearchableSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  error = false,
  disabled = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={containerRef} className="position-relative w-100">
      {/* Input / Trigger */}
      <div
        id={id}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={`form-control d-flex align-items-center justify-content-between rounded-3 bg-white cursor-pointer ${
          error ? 'is-invalid' : ''
        }`}
        style={{
          borderColor: error ? '#DC2626' : isOpen ? '#14532D' : '#CBD5E1',
          padding: '0.45rem 0.75rem',
          minHeight: '38px',
          boxShadow: isOpen ? '0 0 0 3px rgba(20, 83, 45, 0.12)' : 'none',
          transition: 'all 0.15s ease'
        }}
      >
        <div className="d-flex align-items-center gap-2 min-w-0 flex-grow-1 me-1">
          {selectedOption ? (
            <span className="fw-600 text-dark text-truncate" style={{ fontSize: '0.875rem' }}>
              {selectedOption.label}
              {selectedOption.sublabel && (
                <span className="text-secondary ms-1.5 font-weight-normal" style={{ fontSize: '0.8rem' }}>
                  ({selectedOption.sublabel})
                </span>
              )}
            </span>
          ) : (
            <span className="text-secondary text-truncate" style={{ fontSize: '0.875rem', color: '#94A3B8' }}>
              {placeholder}
            </span>
          )}
        </div>

        <div className="d-flex align-items-center gap-1 flex-shrink-0">
          {selectedOption && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="text-secondary p-0.5 rounded-circle cursor-pointer hover-bg-light"
              style={{ color: '#94A3B8' }}
              title="Clear"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            style={{
              color: '#64748B',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease'
            }}
          />
        </div>
      </div>

      {/* Floating Dropdown */}
      {isOpen && (
        <div
          className="position-absolute start-0 w-100 bg-white border rounded-3 shadow-sm"
          style={{
            borderColor: '#CBD5E1',
            top: 'calc(100% + 4px)',
            boxShadow: '0 8px 16px -4px rgba(15, 23, 42, 0.12)',
            zIndex: 1050,
            overflow: 'hidden'
          }}
        >
          {/* Search Bar */}
          <div className="p-1.5 border-bottom bg-light" style={{ borderColor: '#F1F5F9' }}>
            <div className="position-relative d-flex align-items-center">
              <Search
                size={14}
                className="position-absolute start-0 ms-2 text-secondary"
                style={{ pointerEvents: 'none' }}
              />
              <input
                ref={searchInputRef}
                type="text"
                className="form-control form-control-sm ps-4 pe-2 border-0 bg-white"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  fontSize: '0.825rem',
                  boxShadow: 'inset 0 0 0 1px #CBD5E1'
                }}
              />
            </div>
          </div>

          {/* Options */}
          <div className="overflow-auto p-1" style={{ maxHeight: '180px' }}>
            {filteredOptions.length === 0 ? (
              <div className="p-2.5 text-center text-muted" style={{ fontSize: '0.825rem' }}>
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = String(option.value) === String(value);
                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    className={`d-flex align-items-center justify-content-between px-2.5 py-1.5 rounded-2 cursor-pointer ${
                      isSelected ? 'bg-success text-white fw-600' : 'hover-bg-light text-dark'
                    }`}
                    style={{
                      backgroundColor: isSelected ? '#14532D' : 'transparent',
                      color: isSelected ? '#FFFFFF' : '#0F172A',
                      fontSize: '0.85rem',
                      userSelect: 'none'
                    }}
                  >
                    <div className="d-flex align-items-center gap-1.5 text-truncate">
                      <span>{option.label}</span>
                      {option.sublabel && (
                        <small style={{ opacity: isSelected ? 0.85 : 0.65 }}>
                          ({option.sublabel})
                        </small>
                      )}
                    </div>
                    {isSelected && <Check size={14} className="flex-shrink-0 text-white ms-1" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
