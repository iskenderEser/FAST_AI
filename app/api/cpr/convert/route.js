import { NextResponse } from 'next/server'
import { generateText } from '@/lib/aiClient'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const {
      kullanici_id,
      firma_id,
      urun_id,
      stil, urun, ozellikler, claim, problem,
      kullanim_sekli, pozoloji,
      rakip, rakip_etken, rakip_doz
    } = await request.json()

    if (!kullanici_id || !firma_id || !urun_id) {
      return NextResponse.json({ error: 'Kullanıcı, firma ve ürün bilgisi gerekli' }, { status: 400 })
    }

    if (!stil || !urun || !claim || !problem || !kullanim_sekli || !pozoloji) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const validStiller = ['activist', 'reflector', 'theorist', 'pragmatist']
    if (!validStiller.includes(stil)) {
      return NextResponse.json({ error: 'Geçersiz stil' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('cpr_prompts')
      .select('id, prompt_text')
      .eq('stil', stil)
      .eq('aktif', true)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Prompt bulunamadı' }, { status: 404 })
    }

    const ozelliklerStr = Array.isArray(ozellikler) ? ozellikler.join(', ') : (ozellikler || '')

    // Rakip bilgisi — girilen veriler kullanılır, AI tahmin etmez
    let rakipBilgisi = 'belirtilmedi'
    if (rakip && rakip.trim()) {
      rakipBilgisi = rakip.trim()
      if (rakip_etken && rakip_etken.trim()) rakipBilgisi += ` (${rakip_etken.trim()})`
      if (rakip_doz && rakip_doz.trim()) rakipBilgisi += ` — ${rakip_doz.trim()}`
    }

    const finalPrompt = data.prompt_text
      .replace('{urun}',           urun)
      .replace('{ozellikler}',     ozelliklerStr)
      .replace('{claim}',          claim)
      .replace('{problem}',        problem)
      .replace('{kullanim_sekli}', kullanim_sekli)
      .replace('{pozoloji}',       pozoloji)
      .replace('{rakip_bilgisi}',  rakipBilgisi)

    const cpr = await generateText(finalPrompt, {
      temperature: 0.3,
      maxOutputTokens: 1000
    })

    // Her CPR üretiminde otomatik log — arsivlendi: false olarak başlar
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('cpr_feedback')
      .insert({
        kullanici_id,
        firma_id,
        urun_id,
        prompt_id:   data.id,
        stil,
        claim,
        uretilen_cpr: cpr,
        arsivlendi:  false,
        nedenler:    null
      })
      .select('id')
      .single()

    if (feedbackError) {
      console.error('Feedback log hatası:', feedbackError.message)
    }

    return NextResponse.json({
      success:     true,
      cpr,
      prompt_id:   data.id,
      feedback_id: feedbackData?.id ?? null
    })

  } catch (err) {
    console.error('API HATA:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}