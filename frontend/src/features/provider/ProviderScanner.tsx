import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { extractQrToken } from '../../utils/qrToken';
import { validateQr, type QrValidationResult } from './provider.api';
import { QrCode, Camera, CameraOff, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { dateTime } from '../../utils/format';

export interface ScanResult {
  success: boolean;
  participantName?: string;
  bookingCode?: string;
  offeringTitle?: string;
  scheduledAt?: string;
  errorMessage?: string;
}

export function scanResultFromValidation(data: QrValidationResult): ScanResult {
  return {
    success: true,
    participantName: data.participant.full_name,
    bookingCode: data.booking.booking_code,
    offeringTitle: data.booking.offering_title,
    scheduledAt: data.booking.scheduled_at
  };
}

export function ProviderScanner() {
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<IScannerControls | null>(null);
  const [running, setRunning] = useState(false);
  const [manual, setManual] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  
  const client = useQueryClient();

  const stop = () => {
    controls.current?.stop();
    controls.current = null;
    setRunning(false);
  };

  const mutation = useMutation({
    mutationFn: validateQr,
    onSuccess: (data) => {
      // Trigger user feedback: Haptic vibration if supported
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      
      setScanResult(scanResultFromValidation(data));
      void client.invalidateQueries({ queryKey: ['provider'] });
      stop();
    },
    onError: (error) => {
      if (navigator.vibrate) navigator.vibrate(200);
      
      setScanResult({
        success: false,
        errorMessage: error.message || 'Verification failed. Invalid or expired token.'
      });
      stop();
    }
  });

  const submit = (value: string) => {
    const token = extractQrToken(value);
    if (!token) {
      setScanResult({
        success: false,
        errorMessage: 'Invalid QR link or code format. Please try again.'
      });
      return;
    }
    if (!mutation.isPending) mutation.mutate(token);
  };

  const start = async () => {
    if (running || !video.current) return;
    setScanResult(null);
    setPermissionState('prompt');
    const scanner = new BrowserQRCodeReader();
    setRunning(true);
    try {
      const deviceId = selectedDevice || undefined;
      controls.current = await scanner.decodeFromVideoDevice(deviceId, video.current, (result) => {
        if (result) {
          stop();
          submit(result.getText());
        }
      });
      setPermissionState('granted');
    } catch (error) {
      setPermissionState('denied');
      setScanResult({
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unable to access the camera device'
      });
      setRunning(false);
    }
  };

  // Enumerate camera devices
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices()
      .then((deviceInfos) => {
        const videoDevices = deviceInfos.filter((d) => d.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDevice) {
          setSelectedDevice(videoDevices[0].deviceId);
        }
      })
      .catch(() => {});
  }, [selectedDevice]);

  useEffect(() => {
    return () => stop();
  }, []);

  return (
    <>
      <div className="mb-4">
        <h1 className="h3 mb-1 text-navy fw-800">QR Ticket Scanner</h1>
        <p className="text-muted font-size-09">Scan participant digital tickets on arrival or input their tokens manually.</p>
      </div>

      <div className="row g-4">
        {/* Scanner Viewport column */}
        <div className="col-lg-6 d-flex flex-column align-items-center">
          {scanResult ? (
            /* Results Panel */
            <div className="card w-100 border-0 shadow-md p-4 text-center">
              <div className="card-body py-4 d-flex flex-column align-items-center gap-3">
                {scanResult.success ? (
                  <>
                    <div className="rounded-circle text-success p-3 d-flex align-items-center justify-content-center" style={{ width: 72, height: 72, backgroundColor: 'rgba(25,135,84,0.1)' }}>
                      <CheckCircle2 size={44} />
                    </div>
                    <div>
                      <h2 className="h4 fw-800 text-success mb-1">Ticket Validated</h2>
                      <p className="text-muted font-size-085 mb-0">Admission is confirmed and logged.</p>
                    </div>
                    
                    <div className="w-100 bg-light rounded-lg p-3 text-start mt-2">
                      <div className="mb-2">
                        <span className="text-muted font-size-075 text-uppercase fw-600">Participant Name</span>
                        <p className="fw-700 text-navy mb-0">{scanResult.participantName}</p>
                      </div>
                      <div className="row g-2">
                        <div className="col-sm-6">
                          <span className="text-muted font-size-075 text-uppercase fw-600">Booking Code</span>
                          <p className="font-monospace fw-700 text-navy mb-0 font-size-09">#{scanResult.bookingCode || '—'}</p>
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted font-size-075 text-uppercase fw-600">Scheduled Time</span>
                          <p className="fw-600 text-navy mb-0 font-size-085">
                            {scanResult.scheduledAt ? dateTime(scanResult.scheduledAt) : '—'}
                          </p>
                        </div>
                      </div>
                      {scanResult.offeringTitle && (
                        <div className="mt-2 pt-2 border-top">
                          <span className="text-muted font-size-075 text-uppercase fw-600">Offering</span>
                          <p className="fw-600 text-teal mb-0 font-size-09">{scanResult.offeringTitle}</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-circle text-danger p-3 d-flex align-items-center justify-content-center" style={{ width: 72, height: 72, backgroundColor: 'rgba(214,69,69,0.1)' }}>
                      <XCircle size={44} />
                    </div>
                    <div>
                      <h2 className="h4 fw-800 text-danger mb-1">Validation Failed</h2>
                      <p className="text-muted font-size-085 mb-0">This digital ticket is not active or invalid.</p>
                    </div>
                    <div className="w-100 bg-danger-subtle bg-opacity-10 rounded-lg p-3 text-danger border border-danger-subtle mt-2">
                      <span className="text-uppercase font-size-07 fw-700 tracking-wider">Error Details</span>
                      <p className="mb-0 font-size-09 fw-600 mt-0.5">{scanResult.errorMessage}</p>
                    </div>
                  </>
                )}

                <button
                  className="btn btn-primary w-100 mt-3 d-flex align-items-center justify-content-center gap-1.5 py-2.5 fw-700"
                  onClick={() => {
                    setScanResult(null);
                    void start();
                  }}
                >
                  <RefreshCw size={15} />
                  <span>Scan Another Ticket</span>
                </button>
              </div>
            </div>
          ) : (
            /* Camera Viewport */
            <div className="w-100 d-flex flex-column align-items-center gap-3">
              <div className="scanner-viewport">
                <video ref={video} className="scanner-video" muted playsInline />
                <div className="scanner-overlay">
                  <div className="scanner-guide-box">
                    <div className="scanner-laser" />
                  </div>
                </div>
                {!running && (
                  <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-dark bg-opacity-75 text-white gap-2">
                    <CameraOff size={36} className="text-white-50" />
                    <span className="font-size-09 text-white-50">Camera is currently stopped.</span>
                  </div>
                )}
              </div>

              {/* Camera Settings / Controls */}
              <div className="w-100 d-flex flex-column gap-2 text-center" style={{ maxWidth: 440 }}>
                {devices.length > 1 && (
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <label htmlFor="cameraSelect" className="form-label text-nowrap mb-0 font-size-085">Switch Camera:</label>
                    <select
                      id="cameraSelect"
                      className="form-select form-select-sm"
                      value={selectedDevice}
                      onChange={(e) => {
                        setSelectedDevice(e.target.value);
                        if (running) {
                          stop();
                          setTimeout(() => void start(), 200);
                        }
                      }}
                    >
                      {devices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${devices.indexOf(device) + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="d-flex gap-2 justify-content-center">
                  <button
                    className="btn btn-primary d-inline-flex align-items-center gap-1.5"
                    onClick={() => void start()}
                    disabled={running || mutation.isPending}
                  >
                    <Camera size={16} />
                    <span>Start Camera</span>
                  </button>
                  <button
                    className="btn btn-outline-secondary d-inline-flex align-items-center gap-1.5"
                    onClick={stop}
                    disabled={!running}
                  >
                    <CameraOff size={16} />
                    <span>Stop Camera</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Manual entry column */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-transparent py-3">
              <span className="fw-700 text-navy font-size-095">Manual Verification</span>
            </div>
            <div className="card-body">
              <p className="text-muted font-size-085">
                If the camera scanner fails or is not available, enter the token token or copy the ticket URL below.
              </p>
              
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submit(manual);
                }}
                className="d-flex flex-column gap-3 mt-3"
              >
                <div>
                  <label className="form-label" htmlFor="manualToken">Token or Public URL</label>
                  <input
                    id="manualToken"
                    className="form-control"
                    placeholder="Paste the ticket token or link here"
                    value={manual}
                    onChange={(event) => setManual(event.target.value)}
                  />
                </div>
                
                <button
                  className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2"
                  type="submit"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Validating Ticket...</span>
                    </>
                  ) : (
                    <>
                      <QrCode size={16} />
                      <span>Validate Manually</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
          
          {permissionState === 'denied' && (
            <div className="alert alert-danger" role="alert">
              Camera access was denied. Please update your browser permissions to scan QR tickets.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
