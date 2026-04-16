import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const kullanici_id = searchParams.get('kullanici_id')

    if (!kullanici_id) {
      return NextResponse.json({ error: 'Kullanıcı bilgisi gerekli' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('pdf_stock')
      .select('*')
      .eq('kullanici_id', kullanici_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}