'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();

  // Form state
  const [companyCode, setCompanyCode] = useState('');
  const [phone, setPhone] = useState('0 ');
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

  // Cleanup
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

  function formatPhone(val) {
    let nums = val.replace(/\D/g, '');
    if (nums.length > 0 && nums[0] !== '0') nums = '0' + nums;
    if (nums.length > 11) nums = nums.slice(0, 11);
    let formatted = '';
    if (nums.length > 0) {
      formatted = nums[0];
      if (nums.length > 1) {
        formatted += ' (' + nums.substring(1, 4);
        if (nums.length >= 4) {
          formatted += ')';
          if (nums.length > 4) {
            formatted += ' (' + nums.substring(4, 7);
            if (nums.length >= 8) {
              formatted += ' ' + nums.substring(7, 9);
              if (nums.length >= 10) {
                formatted += ' ' + nums.substring(9, 11);
                if (nums.length === 11) formatted += ')';
              }
            }
          }
        }
      }
    }
    return formatted;
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
  // KOD GÖNDER — BYPASS MODU
  // ============================================

  async function handleSendCode() {
    const company = companyCode.trim();
    const rawPhone = phone.replace(/\D/g, '');

    if (!company || rawPhone.length !== 11) {
      showError('⚠️ Lütfen tüm alanları doldurunuz!');
      return;
    }

    const device_id = getDeviceFingerprint();

    try {
      showSuccess('Giriş yapılıyor...');

      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefon: rawPhone,
          device_id,
          gps_lat: null,
          gps_lon: null,
          otp_code: 'BYPASS'
        })
      });

      const data = await response.json();

      if (!data.success) {
        showError('❌ ' + (data.error || 'Giriş başarısız!'));
        return;
      }

      login(data);

    } catch (err) {
      showError('❌ Bir hata oluştu: ' + err.message);
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
          <h1>🔐 FAST CPR KOÇU</h1>

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

          <div className="login-badges">
            <div className="login-badge ok">🔒 Güvenli Giriş</div>
            <div className="login-badge ok">⚡ Hızlı Erişim</div>
            <div className="login-badge soft">🛡️ Korumalı Platform</div>
          </div>
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
              placeholder="0 (___) (___ __ __)"
              maxLength={19}
              autoComplete="off"
              value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
              onKeyPress={e => { if (e.key === 'Enter') handleSendCode(); }}
            />
          </div>

          <button className="login-btn-primary" onClick={handleSendCode}>
            <span>🔓</span>
            <span>Giriş Yap</span>
          </button>

          <div className="login-attempt-info">
            <p>⚠️ Yetkisiz erişim denemeleri kayıt altına alınmaktadır</p>
          </div>
        </div>

        <div className="login-footer">
          © 2025 FAST CPR KOÇU - Tüm hakları saklıdır
        </div>
      </div>
    </div>
  );
}