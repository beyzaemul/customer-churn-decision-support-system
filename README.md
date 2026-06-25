<<<<<<< HEAD
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
=======
# Müşteri Terk (Churn) Karar Destek Sistemi

Bu projede, telekomünikasyon sektöründeki müşteri kayıplarını tahmin etmek ve stratejik simülasyonlar gerçekleştirmek amacıyla uçtan uca bir **Karar Destek Sistemi** geliştirdim.

---

## 1. Veri Seti (Kaggle - Telco Customer Churn)

Projede, IBM tarafından sağlanan ve California'daki **7.043 telekom müşterisine** ait verileri içeren bir veri seti kullanılmıştır. Veri seti şu temel bilgileri barındırır:

* **Demografi:** Cinsiyet, yaş grubu, medeni durum ve bağımlılık bilgileri.
* **Hizmetler:** İnternet, telefon hattı, teknik destek, cihaz koruma ve streaming paketleri.
* **Hesap Bilgileri:** Şirkette kalma süresi, sözleşme türü, ödeme yöntemi, aylık ve toplam fatura tutarları.
* **Hedef:** Müşterinin şirketten ayrılıp ayrılmadığını belirten `"Yes" / "No"` etiketi.

---

## 2. Veri Analizi ve Model Eğitimi (Google Colab)

Google Colab üzerinde Python kütüphaneleri kullanılarak yapılan veri analizinde şu kritik çıkarımlara ulaşılmıştır:

* **Müşteri Ömrü:** İlk aylardaki müşterilerin churn eğiliminin çok daha yüksek olduğu, süre uzadıkça sadakat oranının arttığı boxplot grafikleriyle gözlemlenmiştir.
* **Finansal Detaylar:** Aylık sözleşme türünü seçen ve kağıtsız fatura kullanan müşterilerin risk grubunda ağırlıkta olduğu tespit edilmiştir.

Analizlerin ardından veri seti makine öğrenmesi modelleri için hazırlanmış, sınıflandırma algoritması eğitilmiş ve model dosyaları (`.pkl`) dışa aktarılmıştır.

---

## 3. Yazılım Mimarisi

Eğitilen modeli işlevsel kılmak adına dinamik bir yönetim paneli geliştirilmiştir:

* **Backend:** Veri bilimi modeli ile ön yüz arasında köprü kuran bir Python API mimarisi tasarlanmıştır. Sistem üzerinden yapılan müşteri simülasyon senaryoları SQLite veritabanına kaydedilmektedir.
* **Frontend:** Kullanıcıların ve analistlerin verileri anlık simüle edebileceği, modern bir React kullanıcı arayüzü kurulmuştur.
* **Müşteri Segmentasyonu:** Girilen senaryolara göre modelin ürettiği churn risk yüzdeleri panel üzerinde görselleştirilerek karar alma süreçlerini destekler hale getirilmiştir.

---

## Kullanılan Teknolojiler

* **Veri Bilimi:** Python, Google Colab, Scikit-Learn, Pandas, NumPy, Seaborn, Matplotlib
* **Yazılım Geliştirme:** React, Python, SQLite, Git

---

**Hazırlayan:** Elif Beyza Emül  
>>>>>>> aa3b6042f2876f7a8e741fd832ca0c9ac8de95a6
