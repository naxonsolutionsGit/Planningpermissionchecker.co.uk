export async function isInConservationArea(lat: number, lon: number): Promise<boolean> {
  const url = `https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/Conservation_Areas/FeatureServer/0/query?geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Conservation Area API error")
  const data = await res.json()
  return data.features && data.features.length > 0
}