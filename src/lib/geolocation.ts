export interface GeoPosition {
  lat: number
  lng: number
}

export function isInAppBrowser(): boolean {
  const ua = navigator.userAgent || ''
  return /FBAN|FBAV|Instagram|Line\/|Snapchat|Twitter|MicroMessenger/i.test(ua)
}

export function getCurrentPosition(timeout = 10000): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      if (isInAppBrowser()) {
        reject(new Error('inapp'))
      } else {
        reject(new Error('Geolocalizacion no disponible'))
      }
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (isInAppBrowser()) {
          reject(new Error('inapp'))
        } else if (err.code === 1) {
          reject(new Error('Permiso de ubicacion denegado'))
        } else {
          reject(new Error('No se pudo obtener la ubicacion'))
        }
      },
      { enableHighAccuracy: true, timeout, maximumAge: 60000 }
    )
  })
}
