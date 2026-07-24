import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="d-flex min-vh-100 align-items-stretch bg-light">
      {/* Form Container */}
      <div className="d-flex flex-column align-items-center justify-content-center p-4 p-md-5 bg-white w-100 flex-lg-grow-0" style={{ minWidth: 'min(100vw, 480px)' }}>
        <div className="w-100" style={{ maxWidth: '360px' }}>
          <Outlet />
        </div>
      </div>

      {/* Decorative Brand Panel */}
      <div
        className="d-none d-lg-flex flex-column justify-content-between flex-grow-1 p-5 text-white"
        style={{
          background: 'linear-gradient(135deg, var(--zeere-navy) 0%, var(--zeere-navy-light) 50%, var(--zeere-teal) 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Soft atmospheric gradient glow */}
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-10%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(28, 181, 176, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }}
        />

        <div className="mb-4">
          <div className="fw-bold tracking-wider fs-4 text-white">ZEERE</div>
        </div>

        <div style={{ zIndex: 1, maxWidth: '520px' }}>
          <h2 className="display-6 fw-bold mb-3 text-white" style={{ letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            Discover island experiences and manage operations with ease.
          </h2>
          <p className="text-white-50 mb-0 font-size-095" style={{ lineHeight: 1.6 }}>
            Access the complete portal for booking administration, provider registration, services control, and real-time QR ticket validations.
          </p>
        </div>

        <div className="text-white-50 font-size-085" style={{ zIndex: 1 }}>
          &copy; {new Date().getFullYear()} Zeere. All rights reserved.
        </div>
      </div>
    </div>
  );
}
