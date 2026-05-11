'use client';

import { useState, useEffect, useRef, createRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button'; // import { Button } from '@/components/ui/Button';

// ============================================
// OTP VERIFICATION STEP COMPONENT
// ============================================

function OtpVerificationStep({ 
  phoneDisplay, 
  otpValues, 
  otpRefs, 
  onOtpChange, 
  onOtpKeyDown,
  otpTimerDisplay,
  onVerify,
  onBack,
  onResend,
  resendDisabled,
  resendTimeLeft
}) {
  return (
    <>
      <div className="otp-info-box">
        <div className="otp-info-title">Doğrulama kodu gönderildi</div>
        <div className="otp-info-phone">📱 {phoneDisplay}</div>
      </div>

      <div className="otp-input-row">
        {otpRefs.map((ref, idx) => (
          <input
            key={idx}
            ref={ref}
            type="tel"
            maxLength={1}
            className="otp-input"
            value={otpValues[idx]}
            onChange={e => onOtpChange(idx, e.target.value)}
            onKeyDown={e => onOtpKeyDown(idx, e)}
          />
        ))}
      </div>

      <div className="otp-timer">
        {otpTimerDisplay}
      </div>

      <Button variant="primary" className="w-full h-14 text-lg font-semibold" onClick={onVerify}>
        <span>✅</span>
        <span>Doğrula</span>
      </Button>

      <div className="otp-actions">
        <Button variant="ghost" size="small" className="!bg-transparent !border-0 !shadow-none !rounded-none !p-0" onClick={onBack}>
          ← Geri Dön
        </Button>
        <Button 
          variant="ghost" 
          size="small"
          className="!bg-transparent !border-0 !shadow-none !rounded-none !p-0"
          onClick={onResend}
          disabled={resendDisabled}
        >
          {resendDisabled ? `Yeniden gönder (${resendTimeLeft}s)` : 'Yeniden gönder'}
        </Button>
      </div>
    </>
  );
}

// ============================================
// PWA BANNER COMPONENT
// ============================================

function PWABanner() {
  return (
    <div className="pwa-banner">
      <div className="pwa-banner-title">
        ❗️ FAST'i telefonunuzun ya da tabletinizin ana ekranına ekleyebilirsiniz
      </div>
      <div className="pwa-banner-item">
        📱 iPhone/iPad: Safari'de Paylaş (📤) → Ana Ekrana Ekle
      </div>
      <div className="pwa-banner-item">
        📱 Android: Chrome Menü (⋮) → Ana Ekrana Ekle
      </div>
    </div>
  );
}

// ============================================
// MESSAGE COMPONENT
// ============================================

function MessageBanner({ message }) {
  if (!message.text) return null;
  
  return (
    <div className={`message-banner message-banner--${message.type}`}>
      {message.text}
    </div>
  );
}

// ============================================
// MAIN LOGIN SCREEN
// ============================================

export default function LoginScreen() {
  const { login } = useAuth();

  // Form state
  const [companyCode, setCompanyCode] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [otpVisible, setOtpVisible] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpPhoneDisplay, setOtpPhoneDisplay] = useState('');

  // Timer state
  const [otpTimeLeft, setOtpTimeLeft] = useState(300);
  const [resendTimeLeft, setResendTimeLeft] = useState(60);
  const [resendDisabled, setResendDisabled] = useState(true);

  // Mesaj state
  const [message, setMessage] = useState({ text: '', type: '' });

  // Pending auth ref
  const pendingAuth = useRef(null);

  // Timer ref'leri
  const otpTimerRef = useRef(null);
  const resendTimerRef = useRef(null);

  // OTP input ref'leri - useRef ile stabilize edildi
  const otpRefs = useRef([...Array(6)].map(() => createRef()));

  // PWA Banner
  const [showPWABanner, setShowPWABanner] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://');
    setShowPWABanner(!isStandalone);
  }, []);

  useEffect(() => {
    return () => {
      if (otpTimerRef.current) clearInterval(otpTimerRef.current);
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, []);

  // ============================================
  // YARDIMCI FONKSİYONLAR
  // ============================================

function getDeviceFingerprint() {
  let deviceId = localStorage.getItem('fast_device_id');

  if (!deviceId) {
    deviceId =
      'dev_' +
      crypto.randomUUID().replace(/-/g, '').slice(0, 12);

    localStorage.setItem('fast_device_id', deviceId);
  }

  return deviceId;
}

  function hashPhone(phoneStr) {
    let hash = 0;
    for (let i = 0; i < phoneStr.length; i++) {
      const char = phoneStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  function handlePhoneChange(e) {
    const onlyNums = e.target.value.replace(/\D/g, '');
    if (onlyNums.length <= 10) setPhone(onlyNums);
  }

  function showError(msg) {
    setMessage({ text: msg, type: 'error' });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  }

  function showSuccess(msg) {
    setMessage({ text: '✅ ' + msg, type: 'success' });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  }

  // ============================================
  // TIMER FONKSİYONLARI
  // ============================================

  function startOTPTimer() {
    if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    setOtpTimeLeft(300);
    otpTimerRef.current = setInterval(() => {
      setOtpTimeLeft(prev => {
        if (prev <= 1) { clearInterval(otpTimerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  function startResendTimer() {
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    setResendDisabled(true);
    setResendTimeLeft(60);
    resendTimerRef.current = setInterval(() => {
      setResendTimeLeft(prev => {
        if (prev <= 1) { clearInterval(resendTimerRef.current); setResendDisabled(false); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  const otpTimerDisplay = otpTimeLeft === 0
    ? 'Kod süresi doldu!'
    : `Kalan süre: ${Math.floor(otpTimeLeft / 60)}:${String(otpTimeLeft % 60).padStart(2, '0')}`;

  // ============================================
  // OTP INPUT YÖNETİMİ
  // ============================================

  function handleOtpChange(idx, val) {
    if (!/^[0-9]?$/.test(val)) return;
    const newValues = [...otpValues];
    newValues[idx] = val;
    setOtpValues(newValues);
    if (val && idx < 5) otpRefs.current[idx + 1].current?.focus();
  }

  function handleOtpKeyDown(idx, e) {
    if (e.key === 'Backspace' && !otpValues[idx] && idx > 0) {
      otpRefs.current[idx - 1].current?.focus();
    }
  }

  function resetOtpInputs() {
    setOtpValues(['', '', '', '', '', '']);
  }

  // ============================================
  // GERİ DÖN
  // ============================================

  function handleBackToLogin() {
    setOtpVisible(false);
    resetOtpInputs();
    if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    setOtpTimeLeft(300);
    setResendTimeLeft(60);
    setResendDisabled(true);
  }

  // ============================================
  // GİRİŞ YAP — ROL BAZLI AKIŞ
  // ============================================

  async function handleSendCode() {
    const company = companyCode.trim();

    if (!company || phone.length !== 10) {
      showError('⚠️ Lütfen tüm alanları doldurunuz!');
      return;
    }

    const fullPhone = '0' + phone;
    const device_id = getDeviceFingerprint();

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefon: fullPhone,
          device_id,
          gps_lat: null,
          gps_lon: null,
          otp_code: 'BYPASS'
        })
      });

      const data = await response.json();

      if (!data.success) {
        if (data.otp_required) {
          const displayPhone = fullPhone.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');

          let gps_lat = null;
          let gps_lon = null;
          try {
            const pos = await new Promise((res, rej) =>
              navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })
            );
            gps_lat = pos.coords.latitude;
            gps_lon = pos.coords.longitude;
          } catch (e) {}

          const telefon_hash = hashPhone(fullPhone);
          const sessionRes = await fetch('/api/auth/check-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telefon_hash, device_id, gps_lat, gps_lon })
          });
          const sessionData = await sessionRes.json();

          if (sessionData.success && sessionData.skip_otp) {
            const verifyRes = await fetch('/api/auth/verify-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ telefon: fullPhone, device_id, gps_lat, gps_lon, otp_code: 'SESSION_BYPASS' })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              login(verifyData);
              return;
            }
          }

          setOtpPhoneDisplay(displayPhone);
          pendingAuth.current = { phone: fullPhone, device_id, gps_lat, gps_lon };

          await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firma_kodu: company, telefon: fullPhone })
          });

          setOtpVisible(true);
          startOTPTimer();
          startResendTimer();
          return;
        }

        showError('❌ ' + (data.error || 'Giriş başarısız!'));
        return;
      }

      login(data);

    } catch (err) {
      showError('❌ Bir hata oluştu: ' + err.message);
    }
  }

  // ============================================
  // YENİDEN KOD GÖNDER
  // ============================================

  async function handleResendCode() {
    const pending = pendingAuth.current;
    if (!pending) return;

    try {
      await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firma_kodu: companyCode.trim(), telefon: pending.phone })
      });
      resetOtpInputs();
      startOTPTimer();
      startResendTimer();
      showSuccess('Yeni kod gönderildi.');
    } catch (err) {
      showError('❌ Kod gönderilemedi.');
    }
  }

  // ============================================
  // KODU DOĞRULA
  // ============================================

  async function handleVerifyCode() {
    const code = otpValues.join('');

    if (code.length !== 6) {
      showError('⚠️ Lütfen 6 haneli kodu giriniz!');
      return;
    }

    const pending = pendingAuth.current;
    if (!pending) {
      showError('❌ Oturum bilgisi kayboldu, tekrar deneyin.');
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefon: pending.phone,
          device_id: pending.device_id,
          gps_lat: pending.gps_lat,
          gps_lon: pending.gps_lon,
          otp_code: code
        })
      });

      const data = await response.json();

      if (!data.success) {
        showError('❌ ' + (data.error || 'Hatalı kod!'));
        resetOtpInputs();
        otpRefs.current[0].current?.focus();
        return;
      }

      login(data);

    } catch (err) {
      showError('❌ Doğrulama hatası: ' + err.message);
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div id="loginScreen" className="min-h-screen flex items-center justify-center">
      <div className="login-container w-full max-w-md mx-auto px-4 sm:px-6">
        <div className="login-header">
          <h1 className="font-bold">🔐 FAST AI</h1>
          {showPWABanner && <PWABanner />}
        </div>

        <div className="login-form flex flex-col gap-4">
          <MessageBanner message={message} />

          {!otpVisible ? (
            <>
              <div className="login-form-group">
                <label htmlFor="loginCompanyCode">🏢 Firma Erişim Kodu</label>
                <div className="login-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="loginCompanyCode"
                    placeholder="Firma erişim kodunu giriniz"
                    autoComplete="off"
                    value={companyCode}
                    onChange={e => setCompanyCode(e.target.value)}
                    onKeyPress={e => { if (e.key === 'Enter') document.getElementById('loginPhoneNumber')?.focus(); }}
                  />
                  <span
                    className="login-eye-icon"
                    title="Göster/Gizle"
                    onClick={() => setShowPassword(prev => !prev)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </span>
                </div>
              </div>

              <div className="login-form-group">
                <label htmlFor="loginPhoneNumber">📱 Kayıtlı Cep Telefonu Numarası</label>
                <input
                  type="tel"
                  id="loginPhoneNumber"
                  placeholder="numaranızı başında sıfır olmadan on hane olarak yazınız"
                  maxLength={10}
                  autoComplete="off"
                  value={phone}
                  onChange={handlePhoneChange}
                  onKeyPress={e => { if (e.key === 'Enter') handleSendCode(); }}
                />
              </div>

              <Button variant="primary" className="w-full min-h-[52px]" onClick={handleSendCode}>
                <span>🔓</span>
                <span>Giriş Yap</span>
              </Button>
            </>
          ) : (
            <OtpVerificationStep
              phoneDisplay={otpPhoneDisplay}
              otpValues={otpValues}
              otpRefs={otpRefs.current}
              onOtpChange={handleOtpChange}
              onOtpKeyDown={handleOtpKeyDown}
              otpTimerDisplay={otpTimerDisplay}
              onVerify={handleVerifyCode}
              onBack={handleBackToLogin}
              onResend={handleResendCode}
              resendDisabled={resendDisabled}
              resendTimeLeft={resendTimeLeft}
            />
          )}
        </div>

        <div className="login-footer">
          © 2026 FAST AI - Tüm hakları saklıdır
           FAST AI, Anthropic'in Claude Sonnet 4.6 modeli ile geliştirilmiştir.
        </div>
      </div>
    </div>
  );
}