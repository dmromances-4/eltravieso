# App móvil (Capacitor)

El Travieso se empaqueta como **app híbrida** con [Capacitor](https://capacitorjs.com/): un shell nativo (iOS/Android) que carga la web desplegada en Vercel. No hay static export; auth, APIs y Prisma siguen en el servidor.

## Arquitectura

| Capa | Rol |
|------|-----|
| `capacitor.config.ts` | URL remota (`CAPACITOR_SERVER_URL` o `NEXT_PUBLIC_APP_URL`) |
| `components/CapacitorShell.tsx` | Status bar, deep links `eltravieso://` |
| Web (Vercel) | Next.js 14 + i18n `/en/...` |

## Requisitos

- Node 20+
- Android Studio (Android)
- Xcode 15+ (iOS, solo macOS)
- Cuenta Apple Developer / Google Play Console para publicar

## Variables

```env
NEXT_PUBLIC_APP_URL=https://eltravieso.com
CAPACITOR_SERVER_URL=https://eltravieso.com   # opcional en dev: http://localhost:3000
```

En desarrollo local, el WebView puede apuntar a `http://localhost:3000` si el dispositivo/emulador alcanza tu máquina.

## Comandos

```bash
npm run cap:sync      # sincroniza plugins y assets
npm run cap:android   # abre Android Studio
npm run cap:ios       # abre Xcode (macOS)
```

Primera vez:

```bash
npx cap add android
npx cap add ios       # macOS
npx cap sync
```

## Permisos nativos

Configurados en `android/app/src/main/AndroidManifest.xml`:

- `CAMERA`, `RECORD_AUDIO` — Bar Online (WebRTC)
- `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` — mapa

iOS (tras `npx cap add ios` en macOS): añadir en `Info.plist` las claves `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, `NSLocationWhenInUseUsageDescription`.

## Deep links

| Esquema | Ejemplo |
|---------|---------|
| `eltravieso://` | `eltravieso://recetas/negroni` |
| `https://eltravieso.com` | App Links (Android `autoVerify`) |

El shell (`CapacitorShell.tsx`) escucha `appUrlOpen` y navega en el WebView. En native se oculta el footer web (`LocaleFooter`).

## Publicación

1. Build de producción en Vercel verificado (`npm run build`).
2. `CAPACITOR_SERVER_URL` = dominio producción.
3. `cap sync` + firmar en Android Studio / Xcode.
4. Probar deep link: `adb shell am start -a android.intent.action.VIEW -d "eltravieso://recetas/negroni"`.
5. TestFlight (iOS) o Internal testing (Play).

## Limitaciones

- Requiere conexión a internet (no offline).
- NextAuth en WebView iOS: probar cookies en dominio producción (ITP).
- Bar Online WS: `NEXT_PUBLIC_WS_URL` debe ser alcanzable desde el dispositivo.
