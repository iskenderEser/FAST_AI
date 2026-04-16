import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { telefon_hash, device_id, gps_lat, gps_lon } = await request.json()

    if (!telefon_hash || !device_id) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const { data: kullanici, error } = await supabase
      .from('kullanicilar')
      .select('id, aktif, firma_id')
      .eq('telefon_hash', telefon_hash)
      .eq('aktif', true)
      .single()

    if (error || !kullanici) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('kullanici_id', kullanici.id)
      .eq('device_id', device_id)
      .order('son_giris', { ascending: false })
      .limit(1)
      .single()

    if (session) {
      const sonGiris = new Date(session.son_giris)
      const simdi = new Date()
      const farkSaat = (simdi - sonGiris) / (1000 * 60 * 60)

      if (farkSaat < 24) {
        // GPS ikisi de varsa mesafe kontrolü yap
        if (gps_lat && gps_lon && session.gps_lat && session.gps_lon) {
          const mesafe = calcDistance(
            session.gps_lat, session.gps_lon,
            gps_lat, gps_lon
          )
          // 500m'den uzaksa OTP iste
          if (mesafe > 500) {
            return NextResponse.json({ success: true, skip_otp: false })
          }
        }
        // GPS yoksa veya mesafe uygunsa — 24 saat + aynı cihaz yeterli
        await supabase
          .from('sessions')
          .update({ son_giris: new Date().toISOString() })
          .eq('id', session.id)

        return NextResponse.json({ success: true, skip_otp: true })
      }
    }

    return NextResponse.json({ success: true, skip_otp: false })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}