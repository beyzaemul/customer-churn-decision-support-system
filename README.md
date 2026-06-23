Müşteri Terk (Churn) Karar Destek Sistemi
Bu projede, telekomünikasyon sektöründeki müşteri kayıplarını tahmin etmek ve stratejik simülasyonlar gerçekleştirmek amacıyla uçtan uca bir Karar Destek Sistemi geliştirdim.

1. Veri Seti (Kaggle - Telco Customer Churn)
Projede, IBM tarafından sağlanan ve California'daki 7.043 telekom müşterisine ait verileri içeren bir veri seti kullanılmıştır. Veri seti şu temel bilgileri barındırır:

Demografi: Cinsiyet, yaş grubu, medeni durum ve bağımlılık bilgileri.

Hizmetler: İnternet, telefon hattı, teknik destek, cihaz koruma ve streaming paketleri.

Hesap Bilgileri: Şirkette kalma süresi, sözleşme türü, ödeme yöntemi, aylık ve toplam fatura tutarları.

Hedef: Müşterinin şirketten ayrılıp ayrılmadığını belirten "Yes" / "No" etiketi.

2. Veri Analizi ve Model Eğitimi (Google Colab)
Google Colab üzerinde Python kütüphaneleri kullanılarak yapılan veri analizinde şu kritik çıkarımlara ulaşılmıştır:

Müşteri Ömrü: İlk aylardaki müşterilerin churn eğiliminin çok daha yüksek olduğu, süre uzadıkça sadakat oranının arttığı boxplot grafikleriyle gözlemlenmiştir.

Finansal Detaylar: Aylık sözleşme türünü seçen ve kağıtsız fatura kullanan müşterilerin risk grubunda ağırlıkta olduğu tespit edilmiştir.

Analizlerin ardından veri seti makine öğrenmesi modelleri için hazırlanmış, sınıflandırma algoritması eğitilmiş ve model dosyaları (.pkl) dışa aktarılmıştır.

3. Full-Stack Panel Mimarisi
Eğitilen modeli işlevsel kılmak adına dinamik bir yönetim paneli geliştirilmiştir:

Backend: Veri bilimi modeli ile ön yüz arasında köprü kuran bir Python API mimarisi tasarlanmıştır. Sistem üzerinden yapılan müşteri simülasyon senaryoları SQLite veritabanına kaydedilmektedir.

Frontend: Kullanıcıların ve analistlerin verileri anlık simüle edebileceği, modern bir React kullanıcı arayüzü kurulmuştur.

Müşteri Segmentasyonu: Girilen senaryolara göre modelin ürettiği churn risk yüzdeleri panel üzerinde görselleştirilerek karar alma süreçlerini destekler hale getirilmiştir.

Kullanılan Teknolojiler
Veri Bilimi: Python, Google Colab, Scikit-Learn, Pandas, NumPy, Seaborn, Matplotlib

Yazılım Geliştirme: React, Python, SQLite, Git

Hazırlayan: Elif Beyza Emül
