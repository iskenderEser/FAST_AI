import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { telefon, device_id, gps_lat, gps_lon, otp_code } = await request.json()

    if (!telefon || !device_id) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const telefon_hash = hashPhone(telefon)

    // 1. Kullanıcıyı çek
    const { data: kullanici } = await supabase
      .from('kullanicilar')
      .select('id, rol, firma_id, ad_soyad')
      .eq('telefon_hash', telefon_hash)
      .eq('aktif', true)
      .single()

    if (!kullanici) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    // 2. kullanici rolü için OTP zorunlu
    if (kullanici.rol === 'kullanici') {

      if (!otp_code || otp_code === 'BYPASS') {
        return NextResponse.json({ success: false, otp_required: true })
      }

      // SESSION_BYPASS — check-session koşulları sağlandı, OTP atla
      if (otp_code !== 'SESSION_BYPASS') {
        // OTP'yi Supabase'den oku
        const { data: stored } = await supabase
          .from('otp_store')
          .select('code, expiry')
          .eq('telefon_hash', telefon_hash)
          .single()

        if (!stored) {
          return NextResponse.json({ error: 'OTP bulunamadı, yeniden kod isteyin' }, { status: 401 })
        }

        if (Date.now() > stored.expiry) {
          await supabase.from('otp_store').delete().eq('telefon_hash', telefon_hash)
          return NextResponse.json({ error: 'OTP süresi doldu' }, { status: 401 })
        }

        if (stored.code !== otp_code) {
          return NextResponse.json({ error: 'Hatalı kod' }, { status: 401 })
        }

        // OTP doğrulandı — sil
        await supabase.from('otp_store').delete().eq('telefon_hash', telefon_hash)
      }
    }

    // 3. Session oluştur
    await supabase
      .from('sessions')
      .upsert({
        kullanici_id: kullanici.id,
        device_id,
        gps_lat:     gps_lat || null,
        gps_lon:     gps_lon || null,
        son_giris:   new Date().toISOString()
      }, {
        onConflict: 'kullanici_id, device_id'
      })

    return NextResponse.json({
      success:      true,
      kullanici_id: kullanici.id,
      rol:          kullanici.rol,
      firma_id:     kullanici.firma_id,
      ad_soyad:     kullanici.ad_soyad
    })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function hashPhone(phone) {
  let hash = 0
  for (let i = 0; i < phone.length; i++) {
    const char = phone.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}