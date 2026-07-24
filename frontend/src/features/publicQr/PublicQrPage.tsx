import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { dataOf } from '../../api/response';
import { ErrorState, LoadingState } from '../../components/common/States';
import { dateTime } from '../../utils/format';
import { Ticket, Check, Calendar, Compass, Building, ShieldCheck, AlertTriangle, AlertCircle, Share2 } from 'lucide-react';
import { useState } from 'react';

interface PublicQr {
  participant_name: string;
  masked_phone: string;
  booking_code: string;
  offering_title: string;
  provider_name: string;
  scheduled_at: string;
  status: string;
  valid_from: string;
  valid_until: string;
  public_url: string;
  image_url: string;
}

async function getQr(token: string) {
  return dataOf<PublicQr>(await api.get(endpoints.dashboard.publicQr(token))).data;
}

export function PublicQrPage() {
  const { token = '' } = useParams();
  const [copied, setCopied] = useState(false);
  const query = useQuery({
    queryKey: ['public-qr', token],
    queryFn: () => getQr(token)
  });

  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    return (
      <main className="container py-5 d-flex justify-content-center">
        <div style={{ maxWidth: '440px', width: '100%' }}>
          <ErrorState error={new Error('This QR ticket code is invalid or has expired.')} />
        </div>
      </main>
    );
  }

  const item = query.data;
  const status = String(item.status).toUpperCase();

  // Helper variables for ticket status decoration
  let bannerClass = 'bg-success';
  let bannerIcon = <ShieldCheck size={18} />;
  let instruction = 'Please present this digital ticket on your device at entry for validation.';
  let isUnusable = false;

  if (status === 'USED') {
    bannerClass = 'bg-secondary';
    bannerIcon = <ShieldCheck size={18} />;
    instruction = 'This digital ticket has been scanned and verified.';
  } else if (status === 'EXPIRED') {
    bannerClass = 'bg-warning text-dark';
    bannerIcon = <AlertTriangle size={18} />;
    instruction = 'This ticket validation window has expired.';
    isUnusable = true;
  } else if (status === 'CANCELLED') {
    bannerClass = 'bg-danger';
    bannerIcon = <AlertCircle size={18} />;
    instruction = 'This ticket booking has been cancelled and is void.';
    isUnusable = true;
  } else if (status === 'NOT_YET_VALID') {
    bannerClass = 'bg-info text-white';
    bannerIcon = <ClockIcon />;
    instruction = `This ticket is not yet active. It will become active starting ${dateTime(item.valid_from)}.`;
  }

  const handleCopy = () => {
    void navigator.clipboard.writeText(item.public_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="container py-4 d-flex justify-content-center">
      <div className="ticket-card w-100" style={{ opacity: isUnusable ? 0.75 : 1 }}>
        {/* Ticket Top Header */}
        <div className="ticket-header">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-1.5">
            <Ticket size={24} className="text-warning" />
            <span className="ticket-brand">ZEERE</span>
          </div>
          <span className="font-size-08 text-white-50 text-uppercase tracking-wider">Digital Ticket Pass</span>
        </div>

        {/* Status Indicator Banner */}
        <div className={`d-flex align-items-center justify-content-center gap-1.5 py-2 px-3 text-white fw-700 font-size-09 ${bannerClass}`}>
          {bannerIcon}
          <span className="text-uppercase tracking-wider">{status.replace(/_/g, ' ')}</span>
        </div>

        {/* Ticket Body */}
        <div className="ticket-body">
          <h2 className="h4 fw-800 text-navy mb-1 text-center">{item.participant_name}</h2>
          <span className="text-muted font-size-085 font-monospace">{item.masked_phone}</span>

          {/* QR Code Container */}
          <div className="my-4 text-center p-3 rounded-lg bg-light" style={{ border: '1px solid var(--zeere-border)' }}>
            <img
              src={item.image_url}
              width="240"
              height="240"
              alt="Participant QR ticket code"
              className="img-fluid"
              style={{ filter: isUnusable ? 'grayscale(1) opacity(0.3)' : 'none' }}
            />
            {isUnusable && (
              <div className="text-danger fw-700 font-size-08 text-uppercase mt-2">
                VOID / UNUSABLE
              </div>
            )}
          </div>

          {/* Details list */}
          <div className="w-100 px-1.5">
            <div className="d-flex align-items-start gap-2.5 mb-2.5">
              <Compass size={16} className="text-muted mt-1" />
              <div>
                <span className="text-muted font-size-075 text-uppercase fw-600 d-block">Offering / Experience</span>
                <span className="fw-700 text-navy font-size-095">{item.offering_title}</span>
              </div>
            </div>

            <div className="d-flex align-items-start gap-2.5 mb-2.5">
              <Building size={16} className="text-muted mt-1" />
              <div>
                <span className="text-muted font-size-075 text-uppercase fw-600 d-block">Experience Provider</span>
                <span className="fw-600 text-navy font-size-09">{item.provider_name}</span>
              </div>
            </div>

            <div className="d-flex align-items-start gap-2.5 mb-2.5">
              <Calendar size={16} className="text-muted mt-1" />
              <div>
                <span className="text-muted font-size-075 text-uppercase fw-600 d-block">Scheduled Time</span>
                <span className="fw-600 text-navy font-size-09">{dateTime(item.scheduled_at)}</span>
              </div>
            </div>
          </div>

          {/* Tear-off Ticket Line */}
          <div className="ticket-divider" />

          {/* Booking metadata */}
          <div className="w-100 text-center font-size-085 text-muted px-2">
            <div className="mb-2">
              <span className="text-muted font-size-075 text-uppercase fw-600 d-block">Booking Reference</span>
              <span className="font-monospace fw-700 text-navy">#{item.booking_code}</span>
            </div>
            
            <p className="mb-3 font-size-08 text-muted fw-500">{instruction}</p>

            <button
              className="btn btn-outline-secondary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-1.5 py-2"
              onClick={handleCopy}
              aria-label="Copy share link"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-success" />
                  <span className="text-success fw-600">Copied Link!</span>
                </>
              ) : (
                <>
                  <Share2 size={14} />
                  <span>Copy Ticket Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

// Minimal Clock icon for public page
function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
