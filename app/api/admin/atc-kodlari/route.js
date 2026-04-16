import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('atc_kodlari')
      .select('kod, aciklama')
      .eq('seviye', 2)
      .order('kod', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}