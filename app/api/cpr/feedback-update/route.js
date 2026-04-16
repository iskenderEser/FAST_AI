import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { feedback_id, nedenler } = await request.json()

    if (!feedback_id) {
      return NextResponse.json({ error: 'Feedback ID gerekli' }, { status: 400 })
    }

    if (!nedenler || !Array.isArray(nedenler) || nedenler.length === 0) {
      return NextResponse.json({ error: 'En az 1 neden gerekli' }, { status: 400 })
    }

    if (nedenler.length > 3) {
      return NextResponse.json({ error: 'En fazla 3 neden seçilebilir' }, { status: 400 })
    }

    const { error } = await supabase
      .from('cpr_feedback')
      .update({ nedenler })
      .eq('id', feedback_id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}