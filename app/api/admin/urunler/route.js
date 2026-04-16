import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const {
      firma_id,
      urun_adi,
      atc_kodu,
      kullanim_sekli,
      pozoloji,
      ozellikler,
      kullanim_sekli_editable,
      pozoloji_editable,
      ozellikler_editable,
      aktif
    } = await request.json()

    if (!urun_adi || !atc_kodu || !firma_id) {
      return NextResponse.json({ error: 'Ürün adı, ATC kodu ve firma zorunlu' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('urunler')
      .insert({
        firma_id,
        urun_adi,
        atc_kodu,
        kullanim_sekli:          kullanim_sekli          || '',
        pozoloji:                pozoloji                || [],
        ozellikler:              ozellikler              || [],
        kullanim_sekli_editable: kullanim_sekli_editable || false,
        pozoloji_editable:       pozoloji_editable       || false,
        ozellikler_editable:     ozellikler_editable     || false,
        avantaj_editable:        false,
        fayda_editable:          false,
        aktif:                   aktif !== undefined ? aktif : true
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Eksik parametre: id' }, { status: 400 })
    }

    const {
      urun_adi,
      atc_kodu,
      kullanim_sekli,
      pozoloji,
      ozellikler,
      kullanim_sekli_editable,
      pozoloji_editable,
      ozellikler_editable,
      aktif
    } = await request.json()

    const updateData = {}
    if (urun_adi                !== undefined) updateData.urun_adi                = urun_adi
    if (atc_kodu                !== undefined) updateData.atc_kodu                = atc_kodu
    if (kullanim_sekli          !== undefined) updateData.kullanim_sekli          = kullanim_sekli
    if (pozoloji                !== undefined) updateData.pozoloji                = pozoloji
    if (ozellikler              !== undefined) updateData.ozellikler              = ozellikler
    if (kullanim_sekli_editable !== undefined) updateData.kullanim_sekli_editable = kullanim_sekli_editable
    if (pozoloji_editable       !== undefined) updateData.pozoloji_editable       = pozoloji_editable
    if (ozellikler_editable     !== undefined) updateData.ozellikler_editable     = ozellikler_editable
    if (aktif                   !== undefined) updateData.aktif                   = aktif

    const { data, error } = await supabase
      .from('urunler')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}