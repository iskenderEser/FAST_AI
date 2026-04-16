import { NextResponse } from 'next/server'
import { generateText } from '@/lib/aiClient'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { temel_cpr, stil } = await request.json()

    if (!temel_cpr || !stil) {
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

    const prompt = data.prompt_text.replace('{cpr}', temel_cpr)
    const cpr = await generateText(prompt, { temperature: 0.7, maxOutputTokens: 1000 })
    return NextResponse.json({ success: true, cpr, prompt_id: data.id })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}