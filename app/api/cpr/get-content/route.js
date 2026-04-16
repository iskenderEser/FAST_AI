import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type     = searchParams.get('type')
    const atc_kodu = searchParams.get('atc')

    // S4 soruları
    if (type === 's4') {
      const { data, error } = await supabase
        .from('s4_questions')
        .select('grup, sira, soru')
        .eq('aktif', true)
        .order('sira')

      if (error) throw error

      const grouped = { T: [], A: [], C: [], E: [] }
      data.forEach(q => {
        if (grouped[q.grup] !== undefined) {
          grouped[q.grup].push(q.soru)
        }
      })

      return NextResponse.json({ success: true, s4: grouped })
    }

    // LSA soruları
    if (type === 'lsa') {
      const { data, error } = await supabase
        .from('lsa_questions')
        .select('stil, kategori, eksen, sira, soru')
        .eq('aktif', true)
        .order('sira')

      if (error) throw error

      return NextResponse.json({ success: true, lsa: data })
    }

    // ATC içerikleri
    if (atc_kodu) {
      const { data: claims } = await supabase
        .from('atc_claims')
        .select('sira, claim')
        .eq('atc_kodu', atc_kodu)
        .eq('aktif', true)
        .order('sira')

      const { data: problems } = await supabase
        .from('atc_problems')
        .select('sira, problem')
        .eq('atc_kodu', atc_kodu)
        .eq('aktif', true)
        .order('sira')

      return NextResponse.json({ success: true, claims, problems })
    }

    return NextResponse.json({ error: 'Geçersiz parametre' }, { status: 400 })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}