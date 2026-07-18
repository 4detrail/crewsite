# CREW SMP — Güncelleme Notları & Kurulum

Bu pakette istenen tüm değişiklikler yapıldı. Aşağıda **ne değişti** ve
**Firebase tarafında yapmanız gereken 3 adım** özetleniyor. Bu adımlar
olmadan bazı özellikler (Google girişi, admin yetkileri) tam çalışmaz —
bunlar kodda değil, Firebase Console ayarlarında yapılması gereken şeyler.

## 1) Yapılan Değişiklikler

### 🎨 Tema
- Saf siyah (#000) / saf beyaz (#fff) yerine yumuşatılmış tonlar kullanıldı,
  siyah-beyaz kontrastı gözü yormayacak şekilde dengelendi.
- `vignette-overlay` artık dört köşeden içeri süzülen mor ışık efekti
  veriyor (önceden tek, merkezi bir gradyan vardı).

### 👤 Profil Sayfası
- Yeni `profile.html` + `profile.js`: avatar, kullanıcı adı, e-posta,
  katılım tarihi, giriş sağlayıcısı, kullanıcı adı/foto düzenleme, çıkış.
- Admin kullanıcılarda "ADMIN" rozeti otomatik görünür.

### 🔑 Google ile Giriş Hatası
- `auth.js` yeniden yazıldı: popup engellenirse otomatik `signInWithRedirect`
  yedeğine geçiyor, oturum kalıcılığı (`browserLocalPersistence`) açıkça
  ayarlandı, hata kodlarına göre anlaşılır Türkçe mesajlar eklendi
  (`auth/unauthorized-domain`, `auth/operation-not-allowed` vb. dahil).
- **Önemli:** Kodda düzeltilemeyen tek şey, sitenizin domaininin Firebase
  Console'da "Authorized domains" listesinde olmasıdır — aşağıdaki
  kurulum adımlarına bakın.

### 🎫 Ticket Sistemi — Admin Yanıtlama
- `admins` koleksiyonundaki kullanıcılar artık **tüm ticketları** görebilir,
  yanıt yazabilir ve ticket durumunu (Açık/Kapalı) değiştirebilir.
- Kullanıcılar kendi ticketlarında admin yanıtını görür.

### 📰 Haberler & Form Sistemi (yeni `haberler.html`)
- Adminler "Haber" veya "Form/Anket" oluşturabilir (dinamik soru ekleme).
- Kullanıcılar formu bir kez yanıtlayabilir, tekrar yanıtlayamaz.
- Adminler formun tüm yanıtlarını görebilir.

### 🛡️ Admin Güvenliği
- İstemci tarafında `admin.js` ile admin kontrolü yapılıyor **ancak**
  gerçek güvenlik `firestore.rules` dosyasıyla sağlanıyor. Bu dosyayı
  mutlaka Firebase Console'a yüklemelisiniz (aşağıda anlatılıyor),
  aksi halde herhangi biri tarayıcı konsolundan admin yetkisi
  kazanmaya çalışabilir.

### 📺 Video / Profil Fotoğrafı Çekme Sorunu
- Videolar tek bir CORS proxy'sine (allorigins) bağımlıydı, o servis
  yoğunluk/kota hatası verdiğinde videolar hiç yüklenmiyordu. Şimdi
  3 farklı proxy sırayla deneniyor, biri çalışmazsa diğerine geçiliyor.
- Kanal/oluşturucu profil fotoğrafları artık `unavatar.io` üzerinden
  YouTube kullanıcı adına göre otomatik çekiliyor (API anahtarı
  gerekmez), önceki `via.placeholder.com` linkleri kaldırıldı çünkü
  bu servis sık sık erişilemez durumdaydı.

## 2) Firebase Console'da Yapmanız Gerekenler

### Adım A — Yetkili domainler (Google girişi için ZORUNLU)
Firebase Console > Authentication > Settings > **Authorized domains** kısmına
sitenizin yayınlandığı domaini (örn. `crewsmp.com` veya barındırdığınız
`...web.app` / `...firebaseapp.com` adresini) ekleyin. Eklenmezse Google
girişinde `auth/unauthorized-domain` hatası almaya devam edersiniz.

Ayrıca Authentication > Sign-in method altında **Google** sağlayıcısının
"Enabled" olduğundan emin olun.

### Adım B — Firestore güvenlik kurallarını yükleyin
1. Firebase Console > Firestore Database > Rules
2. Bu paketteki `firestore.rules` dosyasının içeriğini yapıştırın.
3. **Publish** butonuna basın.

### Adım C — İlk admin hesabını oluşturun
1. Sitede normal şekilde bir hesapla giriş yapın (Google veya e-posta).
2. Firebase Console > Firestore Database > Data kısmına gidin.
3. `admins` adında yeni bir koleksiyon oluşturun.
4. Doküman ID'si olarak kendi kullanıcı UID'nizi girin (Profil sayfanızdaki
   "Kullanıcı ID" alanından kopyalayabilirsiniz) ve dokümanı boş kaydedin
   (örneğin `{ addedAt: <timestamp> }` alanı yeterli).
5. Sayfayı yenileyin — artık Profil'de "ADMIN" rozetini, Destek sayfasında
   tüm ticketları, Haberler sayfasında içerik oluşturma panelini
   göreceksiniz.

Yeni adminleri de aynı şekilde `admins` koleksiyonuna UID ekleyerek
tanımlayabilirsiniz (ya da zaten admin olan biri Profil > kullanıcı UID'sini
alıp sizin için ekleyebilir).

## 3) Dosya Listesi (yeni/değişen)

- `styles.css` — tema, yeni bileşenler
- `firebase-config.js` — **yeni**, ortak Firebase yapılandırması
- `admin.js` — **yeni**, admin kontrolü + bildirim yardımcı fonksiyonu
- `nav-auth.js` — **yeni**, tüm sayfalarda navbar oturum durumu
- `auth.js` — Google giriş hatası düzeltmesi
- `tickets.js` / `tickets.html` — admin yanıtlama paneli
- `haberler.html` / `haberler.js` — **yeni**, haber/form sistemi
- `profile.html` / `profile.js` — **yeni**, profil sayfası
- `youtube.js` / `channels.html` — video + avatar çekme düzeltmesi
- `firestore.rules` — **yeni**, sunucu taraflı güvenlik kuralları
- Diğer tüm `.html` dosyalarında navbara "Haberler" ve "Profil" linkleri eklendi.
