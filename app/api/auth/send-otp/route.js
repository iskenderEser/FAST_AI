import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { firma_kodu, telefon } = await request.json()

    if (!firma_kodu || !telefon) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const telefon_hash = hashPhone(telefon)

    const { data: firma } = await supabase
      .from('firmalar')
      .select('id')
      .eq('firma_kodu', firma_kodu)
      .eq('aktif', true)
      .single()

    if (!firma) {
      return NextResponse.json({ error: 'Geçersiz firma kodu' }, { status: 401 })
    }

    const { data: kullanici } = await supabase
      .from('kullanicilar')
      .select('id')
      .eq('firma_id', firma.id)
      .eq('telefon_hash', telefon_hash)
      .eq('aktif', true)
      .single()

    if (!kullanici) {
      return NextResponse.json({ error: 'Bu telefon numarası kayıtlı değil' }, { status: 401 })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiry = Date.now() + 5 * 60 * 1000

    // OTP'yi Supabase'e kaydet
    await supabase
      .from('otp_store')
      .upsert({ telefon_hash, code: otp, expiry }, { onConflict: 'telefon_hash' })

    await sendSMS(telefon, otp)

    return NextResponse.json({ success: true })

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

async function sendSMS(phone, code) {
  const response = await fetch('https://deneme-fast.vercel.app/api/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code })
  })
  if (!response.ok) {
    throw new Error('SMS gönderilemedi')
  }
}