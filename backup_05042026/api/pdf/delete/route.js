import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const kullanici_id = searchParams.get('kullanici_id')

    if (!id || !kullanici_id) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const { error } = await supabase
      .from('pdf_stock')
      .delete()
      .eq('id', id)
      .eq('kullanici_id', kullanici_id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}