# Xperian App Launcher

[English](#english) | [Türkçe](#türkçe)

## English

Xperian App Launcher is an Electron-based, fullscreen Windows application launcher. Browse applications with an animated wheel and launch them using a keyboard or gamepad.

### Features

- Animated navigation wheel with application logos and dynamic backgrounds.
- Smooth background transitions, image preloading and navigation sounds.
- Keyboard, mouse and gamepad support.
- English and Turkish interface.
- INI-based application configuration.
- Portable Windows executable with external configuration and assets.

### Requirements and running

Development and building require Node.js **22.12.0 or newer** and npm. The packaged portable application does not require Node.js.

```powershell
npm install
npm start
```

Alternatively, double-click `run.bat`. If `node_modules` is missing, it installs dependencies; run it again after installation to launch the application. If dependencies already exist, it starts the application immediately.

### Project structure

```text
code/
  main.js          Electron main process
  renderer.js      Interface, configuration loading and input
  index.html       Application page
  style.css        Interface styles
  clean-dist.ps1   Build artifact cleanup
data/
  config/          Application INI files
  assets/          Logos and backgrounds
icon.png
package.json
run.bat
build.bat
```

### Adding applications

Create an `.ini` file in `data/config/`, for example `kodi.ini`:

```ini
[Application]
Platform=Kodi
Location=C:\Program Files\Kodi\kodi.exe

[Assets]
Clear Logo=assets/Kodi/Clear Logo/Kodi.png
Background=assets/Kodi/Background/Kodi.jpg
```

- `Platform`: application name displayed in the interface.
- `Location`: full path to the executable to launch.
- `Clear Logo`: logo image; a transparent PNG is recommended.
- `Background`: background image.

Relative asset paths are resolved from `data/` first, then from the INI file's folder. Absolute paths are also supported. The example logo belongs at `data/assets/Kodi/Clear Logo/Kodi.png`. Missing logos use a letter as a fallback.

In development, `data/` stays in the project root. For portable use, keep it next to the portable executable.

### Controls

| Action | Keyboard | Gamepad / mouse |
| --- | --- | --- |
| Previous application | Left arrow | Left stick / D-pad left |
| Next application | Right arrow | Left stick / D-pad right |
| Launch selected application | Enter | A / south button |
| Select an application | — | Click its logo |
| Exit | Escape | Click the exit button |

Use the language button in the upper-right corner to switch between English and Turkish.

### Building a portable executable

Run `build.bat`. It installs dependencies if needed, runs `npm run dist`, copies `data/` into `dist/`, and removes the temporary `win-unpacked`, `.icon-ico` and builder YAML files after a successful build.

```text
dist/
  Xperian App Launcher-<version>-portable.exe
  data/
    config/
    assets/
```

Distribute the executable together with `data/`. No setup wizard is required. Running `npm run dist` directly creates the portable executable but does not perform the batch file's data copy and cleanup steps.

### Dependencies and troubleshooting

Direct dependency versions are pinned in `package.json`; `package-lock.json` records the dependency tree. Overrides update selected build dependencies. `.npmrc` omits peer packages unused by the Windows portable target, including the Squirrel installer dependencies. Review that setting before adding other build targets.

If an application does not launch, check its `Location` path. If images are missing, check the INI paths and the location of `data/`.

Developer: **Xperian** · License: **ISC**

---

## Türkçe

Xperian App Launcher, Electron tabanlı, tam ekran çalışan bir Windows uygulama başlatıcısıdır. Uygulamalar arasında animasyonlu çarkla gezinebilir, klavye veya gamepad ile uygulamaları başlatabilirsiniz.

### Özellikler

- Uygulama logoları ve dinamik arka planlarla animasyonlu çark menüsü.
- Yumuşak arka plan geçişleri, görsel ön yükleme ve gezinme sesleri.
- Klavye, fare ve gamepad desteği.
- İngilizce ve Türkçe arayüz.
- INI dosyalarıyla uygulama yapılandırması.
- Harici yapılandırma ve görsel klasörleriyle portable Windows uygulaması.

### Gereksinimler ve çalıştırma

Geliştirme ve derleme için Node.js **22.12.0 veya üzeri** ve npm gerekir. Derlenmiş portable uygulamayı çalıştırmak için Node.js gerekmez.

```powershell
npm install
npm start
```

Alternatif olarak `run.bat` dosyasına çift tıklayın. `node_modules` yoksa bağımlılıkları kurar; kurulumdan sonra uygulamayı açmak için dosyayı tekrar çalıştırın. Bağımlılıklar zaten varsa uygulamayı doğrudan başlatır.

### Proje yapısı

```text
code/
  main.js          Electron ana süreci
  renderer.js      Arayüz, yapılandırma okuma ve kontroller
  index.html       Uygulama sayfası
  style.css        Arayüz stilleri
  clean-dist.ps1   Derleme ara dosyalarının temizliği
data/
  config/          Uygulama INI dosyaları
  assets/          Logolar ve arka planlar
icon.png
package.json
run.bat
build.bat
```

### Uygulama ekleme

`data/config/` içinde bir `.ini` dosyası oluşturun. Örneğin `kodi.ini`:

```ini
[Application]
Platform=Kodi
Location=C:\Program Files\Kodi\kodi.exe

[Assets]
Clear Logo=assets/Kodi/Clear Logo/Kodi.png
Background=assets/Kodi/Background/Kodi.jpg
```

- `Platform`: arayüzde gösterilecek uygulama adı.
- `Location`: başlatılacak uygulamanın tam dosya yolu.
- `Clear Logo`: logo görseli; şeffaf PNG önerilir.
- `Background`: arka plan görseli.

Göreli görsel yolları önce `data/`, ardından INI dosyasının bulunduğu klasöre göre çözülür. Tam dosya yolları da desteklenir. Örnekteki logo `data/assets/Kodi/Clear Logo/Kodi.png` konumunda olmalıdır. Logo bulunamazsa yerine bir harf gösterilir.

Geliştirme sırasında `data/` proje ana klasöründe kalır. Portable kullanımda bu klasörü portable EXE dosyasının yanında tutun.

### Kontroller

| İşlem | Klavye | Gamepad / fare |
| --- | --- | --- |
| Önceki uygulama | Sol yön tuşu | Sol analog / D-pad sol |
| Sonraki uygulama | Sağ yön tuşu | Sol analog / D-pad sağ |
| Seçili uygulamayı başlat | Enter | A / alt düğme |
| Uygulama seç | — | Logoya tıkla |
| Çıkış | Escape | Çıkış düğmesine tıkla |

Sağ üstteki dil düğmesiyle İngilizce ve Türkçe arasında geçiş yapabilirsiniz.

### Portable EXE oluşturma

`build.bat` dosyasını çalıştırın. Gerekirse bağımlılıkları kurar, `npm run dist` komutunu çalıştırır, `data/` klasörünü `dist/` içine kopyalar ve başarılı derlemeden sonra geçici `win-unpacked`, `.icon-ico` ve builder YAML dosyalarını temizler.

```text
dist/
  Xperian App Launcher-<version>-portable.exe
  data/
    config/
    assets/
```

EXE dosyasını `data/` klasörüyle birlikte dağıtın. Kurulum sihirbazı gerekmez. Doğrudan `npm run dist` çalıştırmak portable EXE üretir ancak BAT dosyasındaki veri kopyalama ve temizlik adımlarını gerçekleştirmez.

### Bağımlılıklar ve sorun giderme

Doğrudan bağımlılıklar `package.json` içinde sabit sürümlerle tanımlıdır; `package-lock.json` bağımlılık ağacını kaydeder. Overrides alanı belirli derleme bağımlılıklarını günceller. `.npmrc`, Windows portable hedefinde kullanılmayan peer paketlerini ve bunlarla gelen Squirrel kurulum bağımlılıklarını kurulum dışında bırakır. Başka derleme hedefleri eklemeden önce bu ayarı gözden geçirin.

Bir uygulama açılmıyorsa `Location` yolunu kontrol edin. Görseller yüklenmiyorsa INI yollarını ve `data/` klasörünün konumunu kontrol edin.

Geliştirici: **Xperian** · Lisans: **ISC**
