import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const firma_id = searchParams.get('firma_id')

    if (!firma_id) {
      return NextResponse.json({ error: 'Firma bilgisi gerekli' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('kullanicilar')
      .select('*')
      .eq('firma_id', firma_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { firma_id, ad_soyad, telefon, rol } = await request.json()

    if (!firma_id || !ad_soyad || !telefon) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const telefon_hash = hashPhone(telefon)
    const telefon_son4 = telefon.slice(-4)

    // Aynı telefon numarası kayıtlı mı kontrol et
    const { data: mevcutKullanici } = await supabase
      .from('kullanicilar')
      .select('id, ad_soyad, firma_id')
      .eq('telefon_hash', telefon_hash)
      .single()

    if (mevcutKullanici) {
      return NextResponse.json({
        error: 'Bu telefon numarası zaten kayıtlı.'
      }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('kullanicilar')
      .insert({
        firma_id,
        ad_soyad,
        telefon_hash,
        telefon_son4,
        rol: rol || 'kullanici'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const { id, aktif } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('kullanicilar')
      .update({ aktif })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })

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