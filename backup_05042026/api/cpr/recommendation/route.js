import { NextResponse } from 'next/server'
import { generateText } from '@/lib/aiClient'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const {
      urun,
      avantaj,
      kullanim_sekli,
      pozoloji,
      problem
    } = await request.json()

    if (!urun || !avantaj || !kullanim_sekli || !pozoloji || !problem) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('cpr_prompts')
      .select('prompt_text')
      .eq('stil', 'recommendation')
      .eq('aktif', true)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Prompt bulunamadı' }, { status: 404 })
    }

    const prompt = data.prompt_text
      .replace('{urun}', urun)
      .replace('{avantaj}', avantaj)
      .replace('{kullanim_sekli}', kullanim_sekli)
      .replace('{pozoloji}', pozoloji)
      .replace('{problem}', problem)

    const recommendation = await generateText(prompt, { temperature: 0.7, maxOutputTokens: 300 })
    return NextResponse.json({ success: true, recommendation })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}