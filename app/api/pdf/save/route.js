import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const {
      kullanici_id,
      feedback_id,
      tarih,
      urun,
      tedavi_alani,
      kullanim_sekli,
      pozoloji,
      claim,
      ogrenme_stili,
      stil_cprlar
    } = await request.json()

    if (!kullanici_id) {
      return NextResponse.json({ error: 'Kullanıcı bilgisi gerekli' }, { status: 400 })
    }

    // pdf_stock'a kaydet
    const { data, error } = await supabase
      .from('pdf_stock')
      .insert({
        kullanici_id,
        urun,
        tedavi_alani,
        kullanim_sekli,
        pozoloji,
        claim,
        ogrenme_stili,
        stil_cprlar
      })
      .select()
      .single()

    if (error) throw error

    // cpr_feedback kaydını arsivlendi: true olarak güncelle
    if (feedback_id) {
      const { error: feedbackError } = await supabase
        .from('cpr_feedback')
        .update({ arsivlendi: true })
        .eq('id', feedback_id)

      if (feedbackError) {
        console.error('Feedback güncelleme hatası:', feedbackError.message)
      }
    }

    return NextResponse.json({ success: true, data })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}