# UrbanInspect

Aplicación móvil para registrar y consultar incidencias de infraestructura urbana en Quito. Está construida con Ionic, Angular Standalone y Capacitor, y usa MockAPI para los reportes.

## Requisitos

- Node.js compatible con Angular CLI 22 y npm.
- Android Studio y Android SDK para compilar la aplicación Android.
- Un recurso MockAPI llamado `incidencias` y la URL base de su proyecto.

## Instalación y ejecución

1. Clona el repositorio y entra en su directorio:

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd quito-app
   ```

2. Instala las dependencias:

   ```bash
   npm ci
   ```

3. La URL de MockAPI ya está configurada en `src/environments/environment.ts` y `src/environments/environment.prod.ts`:

   ```ts
   mockApiUrl: 'https://6ae2b569bbb54129229a4f14.mockapi.io',
   ```

   `IncidenciasService` añade `/incidencias`, por lo que consulta `https://6ae2b569bbb54129229a4f14.mockapi.io/incidencias`. El endpoint contiene los 25 registros iniciales de prueba.

4. Inicia el servidor de desarrollo:

   ```bash
   npm start
   ```

   Abre `http://localhost:4200`.

5. Ejecuta las pruebas y validaciones:

   ```bash
   npm run test:unit
   npm run lint
   npm run test:e2e
   ```

   Playwright requiere que su navegador de prueba esté instalado:

   ```bash
   npx playwright install chromium
   ```

## Compilar para Android

1. Compila la aplicación web para generar los archivos de `www/`:

   ```bash
   ionic build
   ```

2. Sincroniza los archivos web, plugins y configuración con el proyecto Android:

   ```bash
   npx cap sync android
   ```

3. Abre el proyecto nativo en Android Studio si necesitas compilar o ejecutar el APK:

   ```bash
   npx cap open android
   ```

Repite `ionic build` y `npx cap sync android` después de cada cambio web que quieras incluir en Android y después de cambiar dependencias o plugins nativos.

Para generar un APK debug desde Windows:

```powershell
.\android\gradlew.bat -p android assembleDebug
```

El APK se genera en `android/app/build/outputs/apk/debug/app-debug.apk`. Para distribuir una versión release, configura la firma de Android y compila con la variante `assembleRelease`.

### Permisos de Android

En `android/app/src/main/AndroidManifest.xml`, dentro de `<manifest>` y fuera de `<application>`, están declarados los permisos requeridos:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

<uses-feature
    android:name="android.hardware.location.gps"
    android:required="false" />
```

- `INTERNET` permite las conexiones HTTPS a MockAPI y Open-Meteo. Ya está incluido en el manifest del proyecto.
- `ACCESS_COARSE_LOCATION` y `ACCESS_FINE_LOCATION` habilitan la ubicación aproximada y precisa solicitada por Geolocation. Android también requiere que la persona conceda el permiso en tiempo de ejecución y que los servicios de ubicación estén activados.
- GPS se declara como característica opcional porque el formulario permite introducir coordenadas manualmente si el dispositivo no tiene GPS o el permiso se deniega.
- El flujo actual de Camera abre el selector del sistema con `CameraSource.Prompt` y no usa `saveToGallery`; por ello, el plugin Camera no requiere añadir `CAMERA`, `READ_MEDIA_IMAGES` ni permisos de almacenamiento al manifest. Las APIs usadas son HTTPS, por lo que tampoco se requiere habilitar tráfico HTTP en claro.

## Dependencias principales y requisitos

| Dependencia | Uso |
| --- | --- |
| `@angular/core`, `@angular/router`, `@angular/forms` | Componentes standalone, rutas y formularios reactivos para navegación, validación y registro. |
| `@angular/common` | `HttpClient` y utilidades de plantilla para consumir APIs. |
| `@ionic/angular` | Componentes Ionic para tabs, listas, formularios, alertas, badges y toasts. |
| `@capacitor/core`, `@capacitor/android`, `@capacitor/cli` | Runtime y puente nativo para compilar y sincronizar Android. |
| `@capacitor/camera` | Captura/selección y previsualización de fotografía de una incidencia (**R6**). |
| `@capacitor/geolocation` | Obtención de coordenadas GPS para reportes (**R7**). |
| `@capacitor/preferences` | Plugin disponible para persistencia nativa clave-valor prevista para códigos de seguimiento y borradores (**R1/R8**). El `StorageService` actual usa `localStorage`; Preferences está instalado, pero aún no es su backend. |
| Cloudinary Upload API | Almacena las fotografías y devuelve la URL HTTPS pública guardada en MockAPI para consultar la evidencia desde el detalle (**R6**). |
| `rxjs` | Composición de peticiones HTTP, paginación, debounce del autoguardado y flujos reactivos. |
| `ionicons` | Iconos de la navegación y acciones. |
| `vitest`, Angular test builder | Pruebas unitarias de páginas y validaciones. |
| `@playwright/test` | Pruebas end-to-end en navegador. |

## Arquitectura y decisiones técnicas

- **Angular Standalone:** las páginas son componentes standalone cargados bajo demanda por el router. La barra inferior organiza Inicio, Incidencias y Seguimiento; detalle y registro son rutas independientes.
- **Servicios por responsabilidad:** `IncidenciasService` concentra las operaciones HTTP y la paginación de MockAPI; `StorageService` mantiene estado local independiente de la red; `WeatherService` encapsula Open-Meteo.
- **Carga progresiva:** el listado solicita páginas de 8 incidencias y deja de pedir páginas cuando la respuesta contiene menos elementos que el límite.
- **Seguimiento y borradores locales:** `StorageService` guarda `seguimiento_ids` y `borrador_incidencia` en `localStorage` sin requerir conectividad. En una aplicación exclusivamente nativa se puede migrar el backend a `@capacitor/preferences`; ese cambio requiere adaptar sus métodos a la API asíncrona de Preferences.
- **Fotografías en Cloudinary:** `@capacitor/camera` entrega la imagen como `DataUrl`; el formulario la conserva para la previsualización y, al guardar, `CloudinaryService` la adjunta como `file` a un `FormData` junto con `upload_preset`. La petición usa el endpoint HTTPS de carga de imágenes de Cloudinary y un **Unsigned Upload Preset**. Tras la carga, se envía a MockAPI únicamente el `secure_url` público devuelto por Cloudinary. Así, la fotografía permanece accesible desde el detalle y no se guardan en el reporte rutas temporales del dispositivo ni datos Base64.
- **Diseño para trabajo en campo:** las pantallas priorizan jerarquía visual y lectura rápida en exteriores, con contraste alto, tarjetas agrupadas y metadatos acompañados por iconos. Los estados usan colores semánticos consistentes (pendiente: ámbar; en proceso: azul; resuelta: verde) y las prioridades se distinguen con rojo (alta), naranja (media) y gris (baja). El formulario separa clasificación y detalles, ubicación y clima, y evidencia fotográfica. Skeletons, indicadores de carga, mensajes de error y estados vacíos hacen visible el estado de cada operación, incluso durante conexiones lentas.
- **Clima:** Open-Meteo ofrece pronóstico y condiciones actuales por coordenadas sin API key. `WeatherService` consulta temperatura, precipitación y código WMO; la aplicación avisa cuando la precipitación supera 5 mm, pero una caída o demora del servicio no bloquea el registro.
- **Configuración del backend:** la URL MockAPI configurada apunta al recurso `incidencias` de UrbanInspect. No guardes credenciales ni secretos en el cliente móvil.

### Configurar Cloudinary

1. En Cloudinary, crea un **Unsigned Upload Preset** llamado `urbaninspect_preset` (o el nombre que vayas a configurar). Limita los formatos y tamaños permitidos según las necesidades de la aplicación.
2. Copia el nombre de tu Cloudinary (`cloudName`) y el nombre del preset (`uploadPreset`) en el objeto `cloudinary` de `src/environments/environment.ts`:

   ```ts
   cloudinary: {
     cloudName: 'TU_CLOUD_NAME',
     uploadPreset: 'urbaninspect_preset',
   },
   ```

3. Configura los mismos valores en `src/environments/environment.prod.ts` para las compilaciones de producción.
4. No agregues el API secret ni otra credencial privada al código cliente: los valores `cloudName` y `uploadPreset` son públicos. La seguridad de la carga unsigned depende de las restricciones configuradas en el preset.

Al finalizar la configuración, ejecuta `ionic build` y luego `npx cap sync android` para incluir los cambios en la aplicación Android.

## Scripts disponibles

| Comando | Acción |
| --- | --- |
| `npm start` | Servidor de desarrollo Angular/Ionic. |
| `npm run build` | Compila la aplicación web en `www/`. |
| `npm run test:unit` | Ejecuta pruebas unitarias. |
| `npm run test:e2e` | Ejecuta las pruebas end-to-end de Playwright. |
| `npm run lint` | Ejecuta ESLint, typecheck e inspección de formato configurada en el proyecto. |