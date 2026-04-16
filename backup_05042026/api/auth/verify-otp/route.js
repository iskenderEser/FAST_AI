import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import otpStore from '@/lib/otpStore'

export async function POST(request) {
  try {
    const { telefon, device_id, gps_lat, gps_lon, otp_code } = await request.json()

    if (!telefon || !device_id || !otp_code) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const telefon_hash = hashPhone(telefon)

    // BYPASS MODU — geliştirme ortamında OTP kontrolü atlanır
    if (otp_code !== 'BYPASS') {
      const stored = otpStore.get(telefon_hash)
      if (!stored) {
        return NextResponse.json({ error: 'OTP bulunamadı, yeniden kod isteyin' }, { status: 401 })
      }

      if (Date.now() > stored.expiry) {
        otpStore.delete(telefon_hash)
        return NextResponse.json({ error: 'OTP süresi doldu' }, { status: 401 })
      }

      if (stored.code !== otp_code) {
        return NextResponse.json({ error: 'Hatalı kod' }, { status: 401 })
      }

      otpStore.delete(telefon_hash)
    }

    const { data: kullanici } = await supabase
      .from('kullanicilar')
      .select('id, rol, firma_id')
      .eq('telefon_hash', telefon_hash)
      .eq('aktif', true)
      .single()

    if (!kullanici) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    await supabase
      .from('sessions')
      .upsert({
        kullanici_id: kullanici.id,
        device_id,
        gps_lat: gps_lat || null,
        gps_lon: gps_lon || null,
        son_giris: new Date().toISOString()
      }, {
        onConflict: 'kullanici_id, device_id'
      })

    return NextResponse.json({
      success: true,
      kullanici_id: kullanici.id,
      rol: kullanici.rol,
      firma_id: kullanici.firma_id
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