export function formatErrorMessage(err: unknown): string {
  if (!err) return 'Bir sorun oluştu. Lütfen tekrar deneyin.'

  const message = typeof err === 'string'
    ? err
    : (err as any)?.message || (err as any)?.error || String(err)

  if (message.includes('ECONNREFUSED') || message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Sunucuyla bağlantı kurulamadı. Lütfen backend API servisinin aktif olduğunu kontrol edin.'
  }

  if (message.includes('UNAUTHORIZED') || message.includes('Yetkisiz') || message.includes('JWT')) {
    return 'Oturum süreniz dolmuş olabilir. Lütfen sayfayı yenileyip tekrar giriş yapın.'
  }

  if (message.includes('Starter ve Pro planlara özeldir') || message.includes('Plan kısıtlaması')) {
    return 'Bu gelişmiş özellik Starter ve Pro planlarımıza özeldir. Plan & Fatura sayfasından planınızı yükseltebilirsiniz.'
  }

  if (message.includes('Geçersiz imza') || message.includes('Invalid signature')) {
    return 'Güvenli bağlantı doğrulaması güncellendi. Lütfen işlemi tekrar deneyin.'
  }

  if (message.includes('500') || message.includes('Internal Server Error')) {
    return 'Sunucumuzda geçici bir aksaklık oluştu. Ekibimiz bilgilendirildi, lütfen az sonra tekrar deneyin.'
  }

  return message
}
