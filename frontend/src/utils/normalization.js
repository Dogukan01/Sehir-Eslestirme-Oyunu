/**
 * Girdi metnindeki Türkçe karakterleri İngilizce karşılıklarına dönüştürür.
 * Büyük/küçük harf duyarlılığını ortadan kaldırır.
 * Boşlukları temizler.
 *
 * @param {string} text - Kullanıcının girdiği veya veritabanındaki şehir adı.
 * @returns {string} - Normalize edilmiş metin.
 */
export const normalizeText = (text) => {
  if (!text) return '';

  const turkishToEnglish = {
    'ı': 'i',
    'i': 'i',
    'ş': 's',
    'ş': 's',
    'ğ': 'g',
    'ğ': 'g',
    'ü': 'u',
    'ü': 'u',
    'ö': 'o',
    'ö': 'o',
    'ç': 'c',
    'ç': 'c',
    'I': 'i',
    'İ': 'i',
    'Ş': 's',
    'Ğ': 'g',
    'Ü': 'u',
    'Ö': 'o',
    'Ç': 'c'
  };

  // Metni küçük harfe çevirip, türkçe karakterleri dönüştür.
  return text
    .trim()
    // Normal javascript toLowerCase türkçe 'I' ve 'İ' yi tam çözemeyebilir, bu yüzden replace de koyduk
    .replace(/[ıİşŞğĞüÜöÖçÇI]/g, letter => turkishToEnglish[letter] || letter)
    .toLowerCase()
    .replace(/\s+/g, ''); // Tüm boşlukları sil (örn. "afyon karahisar" -> "afyonkarahisar")
};
