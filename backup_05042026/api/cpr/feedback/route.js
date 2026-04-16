import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { kullanici_id, prompt_id, stil, temel_cpr, uretilen_cpr, begeni, neden } = await request.json()

    if (!kullanici_id || !prompt_id || !stil || !temel_cpr || !uretilen_cpr || begeni === undefined) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    if (!begeni && !neden) {
      return NextResponse.json({ error: 'Dislike için neden gerekli' }, { status: 400 })
    }

    const { error } = await supabase
      .from('cpr_feedback')
      .insert({
        kullanici_id,
        prompt_id,
        stil,
        temel_cpr,
        uretilen_cpr,
        begeni,
        neden: begeni ? null : neden
      })

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}