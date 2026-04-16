import { NextResponse } from 'next/server'
import { generateText } from '@/lib/aiClient'

export async function POST(request) {
  try {
    const { differences, similarities } = await request.json()

    if (!differences || !similarities) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const prompt = `Sen bir ilaç sektörü iletişim koçusun. Aşağıdaki bağlamı ve kuralları çok iyi anlamanı istiyorum.

BAĞLAM:
- Bu analiz, bir Ürün Tanıtım Temsilcisi (mümessil) ile ziyaret ettiği doktor arasındaki iletişimi iyileştirmek amacıyla yapılmaktadır.
- Mümessil, iş gereği doktora saygılı olmak zorundadır.
- Aşağıdaki veriler, mümessilin doktoru gözlemlemesine dayalı subjektif bir analizdir. Kesin doğru değildir, ön fikir niteliğindedir.
- Analizin amacı kural koymak değil, mümessile "bu doktorla nasıl daha uyumlu iletişim kurarım" konusunda yol göstermektir.
- Duruş, göz teması, konuşma hızı, sesin hacmi, mimikler, ellerin kullanımı, içerik, kelime sayısı gibi davranışların iletişim psikolojisindeki anlamlarını ve karşılıklarını bilmeli, buna göre yorum yapmalısın.

MÜMESSIL'İN KONFOR ALANI:
${similarities.map(s => `${s.name}: ${s.my} (${s.myLabel})`).join('\n')}
${differences.map(d => `${d.name}: ${d.my} (${d.myLabel})`).join('\n')}

DOKTORUN KONFOR ALANI (mümessilin gözlemine göre):
${similarities.map(s => `${s.name}: ${s.other} (${s.otherLabel})`).join('\n')}
${differences.map(d => `${d.name}: ${d.other} (${d.otherLabel})`).join('\n')}

UYUMLU ALANLAR (ortak zemin — bu davranışlarda değişiklik gerekmez):
${similarities.length > 0 ? similarities.map(s => `${s.name}: Her ikiniz de benzer düzeyde (${s.myLabel})`).join('\n') : 'Yok'}

FARKLI ALANLAR (uyum sağlanması gereken davranışlar):
${differences.length > 0 ? differences.map(d => `${d.name}: Siz ${d.my} (${d.myLabel}), Doktor ${d.other} (${d.otherLabel}), Fark: ${d.diff}`).join('\n') : 'Yok'}

Mümessile, bu doktorla yapacağı tanıtımda nasıl davranması gerektiğine dair geri bildirim yaz.

KURALLAR:
- Her farklı davranış için 2 cümle yaz: ilk cümle ne yapması gerektiğini, ikinci cümle neden yararlı olacağını açıklasın
- Cümle yapısı doğal olsun: "...yapmanız yararlı olabilir, çünkü..." kalıbını temel al ama her seferinde farklı ifadeler kullan
- Edilgen, saygılı, nazik bir dil kullan
- Sadece mümessilin tanıtım ziyareti sırasında gerçekten uygulayabileceği davranışları öner
- Türkçe dilbilgisi kurallarına uy, anlamsız veya uydurma kelime kullanma
- "Karşı taraf" yerine "doktor" veya "hekim" kullan
- "Mümessil" yerine "siz" kullan
- Kalıplaşmış, bürokratik dilden kaçın — kısa ve anlaşılır yaz

FORMAT (sadece aşağıdaki formatı kullan, başka açıklama ekleme):
[Davranış]: [2 cümle öneri]`

    const suggestions = await generateText(prompt, { temperature: 0.6, maxOutputTokens: 1500 })
    return NextResponse.json({ success: true, suggestions })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}