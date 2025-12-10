# Antigravity (Xperian App Launcher)

**Antigravity**, diğer uygulamalarınızı (Kodi, Jellyfin, BigBox, Launchbox vb.) şık ve performanslı bir arayüzle başlatmanızı sağlayan modern bir Electron tabanlı uygulama başlatıcısıdır. PC'niz için bir "Konsol Arayüzü" (Frontend) olarak tasarlanmıştır.

## 🌟 Özellikler

*   **Modern "Çark" (Wheel) Navigasyonu:** Uygulamalar arasında ikon tabanlı, akıcı ve animasyonlu bir geçiş sistemi.
*   **Yüksek Performanslı Görsellik:** 
    *   Arka plan geçişleri için çift katmanlı (dual-layer) opaklık sistemi sayesinde takılmayan yumuşak geçişler.
    *   Resimler için GPU tabanlı ön yükleme (preloading) ve kod çözme (decoding).
*   **Dinamik Arka Planlar:** Her uygulama seçildiğinde arka plan ve tema o uygulamaya özel olarak değişir.
*   **Ses Efektleri:** Web Audio API kullanılarak oluşturulmuş özel gezinme ve seçim sesleri.
*   **Gamepad ve Klavye Desteği:** 
    *   Klavye yön tuşları veya Gamepad (Joystick/D-PAD) ile tam kontrol.
*   **Kiosk Modu:** Tam ekran çalışır ve sistem açılışında otomatik başlamaya uygundur.
*   **INI Tabanlı Yapılandırma:** Yeni oyun veya uygulama eklemek için basit `.ini` dosyaları kullanılır.

## 🚀 Kurulum ve Başlangıç

### Gereksinimler
*   [Node.js](https://nodejs.org/) (Sürüm 16 veya üzeri önerilir)
*   npm (Node.js ile birlikte gelir)

### Yükleme
Projeyi klonladıktan veya indirdikten sonra proje klasöründe bir terminal açın ve gerekli paketleri yükleyin:

```bash
npm install
```

### Çalıştırma (Geliştirici Modu)
Uygulamayı geliştirme modunda başlatmak için:

```bash
npm start
```

### Derleme (.exe Oluşturma)
Uygulamayı dağıtılabilir bir Windows yürütülebilir dosyasına (.exe) dönüştürmek için:

```bash
npm run dist
```
Oluşan dosya `dist/` klasöründe bulunacaktır.

## ⚙️ Uygulama Ekleme (Yapılandırma)

Uygulamaları başlatıcıya eklemek için uygulamanın kurulu olduğu dizindeki (veya proje içindeki) `apps` klasörünü kullanın.

1.  Uygulama kök dizininde `apps` adında bir klasör oluşturun (eğer yoksa, ilk çalıştırmada otomatik oluşur).
2.  Her uygulama için bu klasöre `.ini` uzantılı bir dosya ekleyin (örneğin: `kodi.ini`).

**Örnek .ini Dosyası:**

```ini
[Application]
Platform=Kodi
Location=C:\Program Files\Kodi\kodi.exe

[Assets]
; Dosya yolları tam yol (absolute) veya apps klasörüne göreli (relative) olabilir.
Clear Logo=assets/kodi_logo.png
Background=assets/kodi_bg.jpg
```

*   **Platform:** Ekranda görünecek isim.
*   **Location:** Çalıştırılacak `.exe` dosyasının tam yolu.
*   **Clear Logo:** Tekerlek üzerinde görünecek şeffaf logo (PNG önerilir).
*   **Background:** Arka planda görünecek yüksek çözünürlüklü görsel.

## 🎮 Kontroller

| Eylem | Klavye | Gamepad (Xbox/Genel) |
| :--- | :--- | :--- |
| **Sola Git** | Sol Yön Tuşu | Sol Stick Sola / D-Pad Sol |
| **Sağa Git** | Sağ Yön Tuşu | Sol Stick Sağa / D-Pad Sağ |
| **Seç/Başlat** | Enter | A Tuşu (Güney Butonu) |
| **Çıkış** | ESC | - |

## 🛠️ Teknik Detaylar & Yapı

Proje **Electron** üzerine kuruludur ve aşağıdaki ana bileşenlerden oluşur:

*   **main.js:** Uygulamanın arka plan süreci. Pencere yönetimi, işletim sistemi ile etkileşim (uygulama başlatma, çıkış komutları) ve önbellek optimizasyonlarını yönetir.
*   **renderer.js:** Arayüz mantığı. Çark animasyonu, arka plan geçişleri, ses efektleri, Gamepad dinleyicisi ve `.ini` dosyalarının okunması burada gerçekleşir.
*   **style.css:** Tüm görsel efektler, cam (glassmorphism) efektleri ve animasyonlar.

## ⚠️ Bilinen Sorunlar ve Çözümler

*   **Arka Planda Titreme:** Eğer geçişlerde titreme olursa, uygulamanın GPU hızlandırma ayarlarını `main.js` içerisinde kontrol edin. Şu an performans için önbellekleme agresif bir şekilde kapalıdır.
*   **Uygulama Açılmıyor:** `.ini` dosyasındaki `Location` yolunun doğru olduğundan ve dosya yolunda Türkçe karakter sorunu olmadığından emin olun.

---
**Geliştirici:** Xperian
**Lisans:** ISC
