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
  const API_USER     = process.env.ILETISIM_USER
  const API_PASS     = process.env.ILETISIM_PASS
  const API_CUSTOMER = process.env.ILETISIM_CUSTOMER
  const API_KEY      = process.env.ILETISIM_API_KEY
  const API_VENDOR   = process.env.ILETISIM_VENDOR
  const SERVICE_ID   = process.env.ILETISIM_SERVICE_ID

  // ADIM 1: Token al
  const authUrl = new URL('https://live.iletisimmakinesi.com/api/UserGatewayWS/functions/authenticate')
  authUrl.searchParams.append('userName',     API_USER)
  authUrl.searchParams.append('userPass',     API_PASS)
  authUrl.searchParams.append('customerCode', API_CUSTOMER)
  authUrl.searchParams.append('apiKey',       API_KEY)
  authUrl.searchParams.append('vendorCode',   API_VENDOR)

  const authResponse = await fetch(authUrl.toString())
  const authXml      = await authResponse.text()

  const tokenMatch = authXml.match(/<TOKEN_NO>(.*?)<\/TOKEN_NO>/)
  if (!tokenMatch) {
    throw new Error('Token alınamadı: ' + authXml.substring(0, 500))
  }
  const token = tokenMatch[1]

  // ADIM 2: Originator ID al
  const origUrl = new URL('https://live.iletisimmakinesi.com/api/UserGatewayWS/functions/getOriginators')
  origUrl.searchParams.append('token',     token)
  origUrl.searchParams.append('serviceId', SERVICE_ID)

  const origResponse = await fetch(origUrl.toString())
  const origXml      = await origResponse.text()

  const origMatch = origXml.match(/<ORIGINATOR id="(\d+)"/)
  if (!origMatch) {
    throw new Error('Originator ID alınamadı: ' + origXml.substring(0, 500))
  }
  const originatorId = origMatch[1]

  // ADIM 3: SMS gönder
  const messageText = `FAST AI Dogrulama Kodunuz: ${code}\n\nKod 5 dakika gecerlidir. Kimseyle paylasmayiniz.`

  const smsUrl = new URL('https://live.iletisimmakinesi.com/api/SingleShotWS/functions/sendSingleShotSMS')
  smsUrl.searchParams.append('token',       token)
  smsUrl.searchParams.append('originatorId', originatorId)
  smsUrl.searchParams.append('phoneNumber', '90' + phone.substring(1))
  smsUrl.searchParams.append('messageText', messageText)

  const smsResponse = await fetch(smsUrl.toString())
  const smsXml      = await smsResponse.text()

  const statusMatch = smsXml.match(/<CODE>(.*?)<\/CODE>/)
  const statusCode  = statusMatch ? statusMatch[1] : 'UNKNOWN'

  if (statusCode !== '0') {
    throw new Error('SMS gönderilemedi. Kod: ' + statusCode)
  }
}