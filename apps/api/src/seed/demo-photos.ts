/**
 * Photos for the demo stores, from Unsplash (free license: commercial use, no attribution required).
 * Values are Unsplash photo ids; `importDemoImages` copies each one into the media storage once, under
 * a fixed public id, so the nightly reset never uploads it again.
 */
export const DEMO_PRODUCT_PHOTOS: Readonly<Record<string, string>> = {
  // Panadería La Esquina
  'demo-prod-cr-hogaza': 'photo-1549413468-cd78edb7e75c',
  'demo-prod-cr-baguette': 'photo-1728670212431-ac192413f4b1',
  'demo-prod-cr-multigrano': 'photo-1565181917578-a87c12e04ff7',
  'demo-prod-cr-focaccia': 'photo-1593629718888-9009c55e6cad',
  'demo-prod-cr-croissant': 'photo-1623334044303-241021148842',
  'demo-prod-cr-rol-canela': 'photo-1593872571314-4a735d4b27b0',
  'demo-prod-cr-cangrejo': 'photo-1612366747681-e4ca6992b1e9',
  'demo-prod-cr-queque-naranja': 'photo-1603455907761-b11099c592d4',
  'demo-prod-cr-empanada-queso': 'photo-1769254870299-338bfd99aabd',
  'demo-prod-cr-empanada-carne': 'photo-1624128082323-beb6b8b508db',
  'demo-prod-cr-prensada': 'photo-1628838233717-be047a0b54fb',
  'demo-prod-cr-quiche': 'photo-1591985666643-1ecc67616216',
  'demo-prod-cr-cafe-chorreado': 'photo-1611162458324-aae1eb4129a4',
  'demo-prod-cr-agua-dulce': 'photo-1596098823457-74e360fcd023',
  'demo-prod-cr-horchata': 'photo-1610310929634-e0fa80664a45',
  // Bruma Coffee Roasters
  'demo-prod-co-v60': 'photo-1759259639356-7c6e74eed1ec',
  'demo-prod-co-flat-white': 'photo-1621135177072-57c9b6242e7a',
  'demo-prod-co-cardamom-latte': 'photo-1506372023823-741c83b836fe',
  'demo-prod-co-cold-brew': 'photo-1759259639356-6eee63241869',
  'demo-prod-co-orange-tonic': 'photo-1603048004567-8109c99d4e7d',
  'demo-prod-co-iced-matcha': 'photo-1749280447307-31a68eb38673',
  'demo-prod-co-almojabana': 'photo-1559141680-d0bd7bc5af84',
  'demo-prod-co-cookie': 'photo-1499636136210-6f4ee915583e',
  'demo-prod-co-avocado-toast': 'photo-1783307525039-b92506474dc8',
  'demo-prod-co-beans-huila': 'photo-1562051036-e0eea191d42f',
  'demo-prod-co-beans-geisha': 'photo-1587734195503-904fca47e0e9',
  'demo-prod-co-beans-blend': 'photo-1651761483492-7d2e26dd3455',
};

/** Store cover photos, by store slug. */
export const DEMO_COVER_PHOTOS: Readonly<Record<string, string>> = {
  'panaderia-demo': 'photo-1546237769-6f84ec1a512a',
  'cafe-demo': 'photo-1507915135761-41a0a222c709',
};

/** Source URL of an Unsplash photo, capped at the size the storage keeps anyway. */
export function unsplashUrl(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?w=1600&q=80&fm=jpg`;
}
