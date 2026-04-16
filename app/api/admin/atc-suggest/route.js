import { supabase } from '@/lib/supabase'
import { generateText } from '@/lib/aiClient'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { urun_adi, ozellikler } = await request.json()

    if (!urun_adi) {
      return NextResponse.json({ error: 'Ürün adı zorunlu' }, { status: 400 })
    }

    // atc_kodlari tablosundan tüm kodları çek
    const { data: kodlar, error } = await supabase
      .from('atc_kodlari')
      .select('kod, aciklama')
      .eq('seviye', 2)
      .order('kod', { ascending: true })

    if (error) throw error

    const kodListesi = kodlar.map(k => `${k.kod}: ${k.aciklama}`).join('\n')

    const ozelliklerStr = Array.isArray(ozellikler)
      ? ozellikler.join(', ')
      : (ozellikler || '')

    const prompt = `Aşağıdaki ATC 2. seviye kod listesinden, verilen ürün için en uygun kodu seç.

ÜRÜN ADI: ${urun_adi}
${ozelliklerStr ? `ÖZELLİKLER: ${ozelliklerStr}` : ''}

ATC KOD LİSTESİ:
${kodListesi}

GÖREV:
1. En uygun ATC kodunu seç
2. Neden seçtiğini 1-2 cümleyle açıkla
3. Yanıtını şu formatta ver:

ATC_KODU: [kod]
AÇIKLAMA: [açıklama]`

    const yanit = await generateText(prompt, { temperature: 0.3, maxOutputTokens: 200 })

    // ATC kodunu yanıttan parse et
    const atcMatch = yanit.match(/ATC_KODU:\s*([A-Z]\d+)/i)
    const atcKodu  = atcMatch ? atcMatch[1].toUpperCase() : null

    // Açıklamayı parse et
    const aciklamaMatch = yanit.match(/AÇIKLAMA:\s*(.+)/i)
    const aciklama      = aciklamaMatch ? aciklamaMatch[1].trim() : yanit

    return NextResponse.json({
      success:  true,
      atc_kodu: atcKodu,
      oneri:    atcKodu ? `${atcKodu} — ${aciklama}` : aciklama
    })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}