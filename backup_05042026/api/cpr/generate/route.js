import { NextResponse } from 'next/server'
import { generateText } from '@/lib/aiClient'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const {
      claim, ozellik, urun, avantaj, fayda, recommendation,
      atc_kodu, kullanim_sekli, pozoloji, adv_kategori
    } = await request.json()

    if (!claim || !ozellik || !urun || !avantaj || !fayda || !recommendation) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('cpr_prompts')
      .select('prompt_text')
      .eq('stil', 'temel')
      .eq('aktif', true)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Prompt bulunamadı' }, { status: 404 })
    }

    const prompt = data.prompt_text
      .replace('{claim}', claim)
      .replace('{ozellik}', ozellik)
      .replace('{urun}', urun)
      .replace('{avantaj}', avantaj)
      .replace('{fayda}', fayda)
      .replace('{recommendation}', recommendation)
      .replace('{atc_kodu}', atc_kodu || '')
      .replace('{kullanim_sekli}', kullanim_sekli || '')
      .replace('{pozoloji}', pozoloji || '')
      .replace('{adv_kategori}', adv_kategori || '')

    const cpr = await generateText(prompt, { temperature: 0.7, maxOutputTokens: 2048 })
    return NextResponse.json({ success: true, cpr })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}