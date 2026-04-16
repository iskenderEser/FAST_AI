'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

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

  // OTP input ref'leri
  const otpRefs = [
    useRef(null), useRef(null), useRef(null),
    useRef(null), useRef(null), useRef(null)
  ];

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
    const data = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset()
    ].join('|');
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash = hash & hash;
    }
    return 'dev_' + Math.abs(hash).toString(36);
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
    if (val && idx < 5) otpRefs[idx + 1].current?.focus();
  }

  function handleOtpKeyDown(idx, e) {
    if (e.key === 'Backspace' && !otpValues[idx] && idx > 0) {
      otpRefs[idx - 1].current?.focus();
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
        otpRefs[0].current?.focus();
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
    <div id="loginScreen">
      <div className="login-container">
        <div className="login-header">
          <h1>🔐 FAST AI</h1>

          {showPWABanner && (
            <div style={{
              background: '#ffffff',
              border: '1px solid #dc2626',
              borderRadius: '8px',
              padding: '12px 16px',
              margin: '16px 0'
            }}>
              <div style={{ fontSize: '11px', color: '#dc2626', marginBottom: '10px', lineHeight: '1.4' }}>
                ❗️ FAST'i telefonunuzun ya da tabletinizin ana ekranına ekleyebilirsiniz
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>
                📱 iPhone/iPad: Safari'de Paylaş (📤) → Ana Ekrana Ekle
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>
                📱 Android: Chrome Menü (⋮) → Ana Ekrana Ekle
              </div>
            </div>
          )}
        </div>

        <div className="login-form">

          {message.text && (
            <div className="login-error show" style={{
              background: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
              borderColor: message.type === 'error' ? '#fecaca' : '#86efac',
              color: message.type === 'error' ? '#b91c1c' : '#166534'
            }}>
              {message.text}
            </div>
          )}

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
                    style={{ cursor: 'pointer' }}
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

              <button className="login-btn-primary" onClick={handleSendCode}>
                <span>🔓</span>
                <span>Giriş Yap</span>
              </button>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: '#333', marginBottom: '6px' }}>
                  Doğrulama kodu gönderildi
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  📱 {otpPhoneDisplay}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
                {otpRefs.map((ref, idx) => (
                  <input
                    key={idx}
                    ref={ref}
                    type="tel"
                    maxLength={1}
                    value={otpValues[idx]}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    style={{
                      width: '42px', height: '48px', textAlign: 'center',
                      fontSize: '20px', fontWeight: 600,
                      border: '2px solid #ddd', borderRadius: '8px',
                      outline: 'none'
                    }}
                  />
                ))}
              </div>

              <div style={{ textAlign: 'center', fontSize: '12px', color: '#888', marginBottom: '12px' }}>
                {otpTimerDisplay}
              </div>

              <button className="login-btn-primary" onClick={handleVerifyCode}>
                <span>✅</span>
                <span>Doğrula</span>
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                <button
                  onClick={handleBackToLogin}
                  style={{ background: 'none', border: 'none', fontSize: '13px', color: '#666', cursor: 'pointer' }}>
                  ← Geri Dön
                </button>
                <button
                  onClick={handleResendCode}
                  disabled={resendDisabled}
                  style={{
                    background: 'none', border: 'none', fontSize: '13px',
                    color: resendDisabled ? '#ccc' : '#003cbb',
                    cursor: resendDisabled ? 'not-allowed' : 'pointer'
                  }}>
                  {resendDisabled ? `Yeniden gönder (${resendTimeLeft}s)` : 'Yeniden gönder'}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="login-footer">
          © 2026 FAST AI - Tüm hakları saklıdır
        </div>
      </div>
    </div>
  );
}