/**
 * Photos of the demo stores, already uploaded to the media storage under fixed public ids. Sources:
 * Unsplash (free license: commercial use, no attribution required); the Unsplash photo id is kept
 * next to each one to trace or replace it.
 */
export interface DemoPhoto {
  publicId: string;
  width: number;
  height: number;
  /** Unsplash photo id of the original. */
  source: string;
}

const photo = (name: string, width: number, height: number, source: string): DemoPhoto => ({
  publicId: `booth/demo/${name}`,
  width,
  height,
  source,
});

/** By demo product id. */
export const DEMO_PRODUCT_PHOTOS: Readonly<Record<string, DemoPhoto>> = {
  // Panadería La Esquina
  'demo-prod-cr-hogaza': photo('demo-prod-cr-hogaza', 1600, 2400, 'photo-1549413468-cd78edb7e75c'),
  'demo-prod-cr-baguette': photo(
    'demo-prod-cr-baguette',
    1600,
    2133,
    'photo-1728670212431-ac192413f4b1',
  ),
  'demo-prod-cr-multigrano': photo(
    'demo-prod-cr-multigrano',
    1600,
    992,
    'photo-1565181917578-a87c12e04ff7',
  ),
  'demo-prod-cr-focaccia': photo(
    'demo-prod-cr-focaccia',
    1600,
    2400,
    'photo-1593629718888-9009c55e6cad',
  ),
  'demo-prod-cr-croissant': photo(
    'demo-prod-cr-croissant',
    1600,
    1067,
    'photo-1623334044303-241021148842',
  ),
  'demo-prod-cr-rol-canela': photo(
    'demo-prod-cr-rol-canela',
    1600,
    2400,
    'photo-1593872571314-4a735d4b27b0',
  ),
  'demo-prod-cr-cangrejo': photo(
    'demo-prod-cr-cangrejo',
    1600,
    1842,
    'photo-1612366747681-e4ca6992b1e9',
  ),
  'demo-prod-cr-queque-naranja': photo(
    'demo-prod-cr-queque-naranja',
    1600,
    2400,
    'photo-1603455907761-b11099c592d4',
  ),
  'demo-prod-cr-empanada-queso': photo(
    'demo-prod-cr-empanada-queso',
    1600,
    1065,
    'photo-1769254870299-338bfd99aabd',
  ),
  'demo-prod-cr-empanada-carne': photo(
    'demo-prod-cr-empanada-carne',
    1600,
    2000,
    'photo-1624128082323-beb6b8b508db',
  ),
  'demo-prod-cr-prensada': photo(
    'demo-prod-cr-prensada',
    1600,
    1672,
    'photo-1628838233717-be047a0b54fb',
  ),
  'demo-prod-cr-quiche': photo(
    'demo-prod-cr-quiche',
    1600,
    2400,
    'photo-1591985666643-1ecc67616216',
  ),
  'demo-prod-cr-cafe-chorreado': photo(
    'demo-prod-cr-cafe-chorreado',
    1600,
    2400,
    'photo-1611162458324-aae1eb4129a4',
  ),
  'demo-prod-cr-agua-dulce': photo(
    'demo-prod-cr-agua-dulce',
    1600,
    2400,
    'photo-1596098823457-74e360fcd023',
  ),
  'demo-prod-cr-horchata': photo(
    'demo-prod-cr-horchata',
    1600,
    1067,
    'photo-1610310929634-e0fa80664a45',
  ),
  // Bruma Coffee Roasters
  'demo-prod-co-v60': photo('demo-prod-co-v60', 1600, 2400, 'photo-1759259639356-7c6e74eed1ec'),
  'demo-prod-co-flat-white': photo(
    'demo-prod-co-flat-white',
    1600,
    2400,
    'photo-1621135177072-57c9b6242e7a',
  ),
  'demo-prod-co-cardamom-latte': photo(
    'demo-prod-co-cardamom-latte',
    1600,
    1067,
    'photo-1506372023823-741c83b836fe',
  ),
  'demo-prod-co-cold-brew': photo(
    'demo-prod-co-cold-brew',
    1600,
    2400,
    'photo-1759259639356-6eee63241869',
  ),
  'demo-prod-co-orange-tonic': photo(
    'demo-prod-co-orange-tonic',
    1600,
    2400,
    'photo-1603048004567-8109c99d4e7d',
  ),
  'demo-prod-co-iced-matcha': photo(
    'demo-prod-co-iced-matcha',
    1599,
    2400,
    'photo-1749280447307-31a68eb38673',
  ),
  'demo-prod-co-almojabana': photo(
    'demo-prod-co-almojabana',
    1600,
    2000,
    'photo-1559141680-d0bd7bc5af84',
  ),
  'demo-prod-co-cookie': photo(
    'demo-prod-co-cookie',
    1600,
    2001,
    'photo-1499636136210-6f4ee915583e',
  ),
  'demo-prod-co-avocado-toast': photo(
    'demo-prod-co-avocado-toast',
    1600,
    2400,
    'photo-1783307525039-b92506474dc8',
  ),
  'demo-prod-co-beans-huila': photo(
    'demo-prod-co-beans-huila',
    1600,
    2000,
    'photo-1562051036-e0eea191d42f',
  ),
  'demo-prod-co-beans-geisha': photo(
    'demo-prod-co-beans-geisha',
    1600,
    2133,
    'photo-1587734195503-904fca47e0e9',
  ),
  'demo-prod-co-beans-blend': photo(
    'demo-prod-co-beans-blend',
    1600,
    1067,
    'photo-1651761483492-7d2e26dd3455',
  ),
};

/** Store cover public ids, by store slug. */
export const DEMO_COVER_PHOTOS: Readonly<Record<string, string>> = {
  'panaderia-demo': 'booth/demo/cover-panaderia-demo',
  'cafe-demo': 'booth/demo/cover-cafe-demo',
};
