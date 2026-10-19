/**
 * Transfer methods with a known shape per country. A preset only pre-fills the form: every field
 * stays editable, and owners can also create a fully custom method (preset = null).
 * Pure data (no Zod) so the dashboard can use it without loading schemas.
 */
export interface PaymentPreset {
  id: string;
  label: string;
  /** ISO 3166-1 alpha-2 countries where the method is common. Empty = any country. */
  countries: readonly string[];
  /** What the account identifier is for this method, per UI language. */
  identifier: { es: string; en: string };
  /** Default instructions shown to customers, per UI language. */
  instructions: { es: string; en: string };
  /** True when the method is usually paid through a link (PayPal.me, Venmo, ...). */
  usesLink?: boolean;
}

const REFERENCE_ES = 'Usa el código del pedido como referencia o detalle.';
const REFERENCE_EN = 'Use the order code as the payment reference or note.';

export const PAYMENT_PRESETS: readonly PaymentPreset[] = [
  {
    id: 'SINPE_MOVIL',
    label: 'SINPE Móvil',
    countries: ['CR'],
    identifier: { es: 'Número de teléfono', en: 'Phone number' },
    instructions: {
      es: `Envía el monto por SINPE Móvil. ${REFERENCE_ES}`,
      en: `Send the amount with SINPE Móvil. ${REFERENCE_EN}`,
    },
  },
  {
    id: 'IBAN_CR',
    label: 'Transferencia bancaria (IBAN)',
    countries: ['CR'],
    identifier: { es: 'Cuenta IBAN', en: 'IBAN account' },
    instructions: {
      es: `Transfiere a la cuenta IBAN. ${REFERENCE_ES}`,
      en: `Transfer to the IBAN account. ${REFERENCE_EN}`,
    },
  },
  {
    id: 'SPEI',
    label: 'SPEI',
    countries: ['MX'],
    identifier: { es: 'CLABE', en: 'CLABE' },
    instructions: {
      es: `Transfiere por SPEI a la CLABE. ${REFERENCE_ES}`,
      en: `Transfer with SPEI to the CLABE. ${REFERENCE_EN}`,
    },
  },
  {
    id: 'NEQUI',
    label: 'Nequi',
    countries: ['CO'],
    identifier: { es: 'Número de celular', en: 'Mobile number' },
    instructions: {
      es: `Envía el monto por Nequi. ${REFERENCE_ES}`,
      en: `Send the amount with Nequi. ${REFERENCE_EN}`,
    },
  },
  {
    id: 'DAVIPLATA',
    label: 'Daviplata',
    countries: ['CO'],
    identifier: { es: 'Número de celular', en: 'Mobile number' },
    instructions: {
      es: `Envía el monto por Daviplata. ${REFERENCE_ES}`,
      en: `Send the amount with Daviplata. ${REFERENCE_EN}`,
    },
  },
  {
    id: 'YAPE',
    label: 'Yape',
    countries: ['PE'],
    identifier: { es: 'Número de celular', en: 'Mobile number' },
    instructions: {
      es: `Yapea el monto. ${REFERENCE_ES}`,
      en: `Send the amount with Yape. ${REFERENCE_EN}`,
    },
  },
  {
    id: 'PLIN',
    label: 'Plin',
    countries: ['PE'],
    identifier: { es: 'Número de celular', en: 'Mobile number' },
    instructions: {
      es: `Envía el monto por Plin. ${REFERENCE_ES}`,
      en: `Send the amount with Plin. ${REFERENCE_EN}`,
    },
  },
  {
    id: 'PIX',
    label: 'Pix',
    countries: ['BR'],
    identifier: { es: 'Clave Pix', en: 'Pix key' },
    instructions: {
      es: `Paga con Pix a la clave indicada. ${REFERENCE_ES}`,
      en: `Pay with Pix to the key shown. ${REFERENCE_EN}`,
    },
  },
  {
    id: 'ZELLE',
    label: 'Zelle',
    countries: ['US'],
    identifier: { es: 'Correo o teléfono', en: 'Email or phone' },
    instructions: {
      es: `Envía el monto por Zelle. ${REFERENCE_ES}`,
      en: `Send the amount with Zelle. ${REFERENCE_EN}`,
    },
  },
  {
    id: 'VENMO',
    label: 'Venmo',
    countries: ['US'],
    identifier: { es: 'Usuario de Venmo', en: 'Venmo username' },
    instructions: { es: `Paga por Venmo. ${REFERENCE_ES}`, en: `Pay with Venmo. ${REFERENCE_EN}` },
    usesLink: true,
  },
  {
    id: 'CASH_APP',
    label: 'Cash App',
    countries: ['US'],
    identifier: { es: '$Cashtag', en: '$Cashtag' },
    instructions: {
      es: `Paga por Cash App. ${REFERENCE_ES}`,
      en: `Pay with Cash App. ${REFERENCE_EN}`,
    },
    usesLink: true,
  },
  {
    id: 'BIZUM',
    label: 'Bizum',
    countries: ['ES'],
    identifier: { es: 'Número de teléfono', en: 'Phone number' },
    instructions: {
      es: `Envía el monto por Bizum. ${REFERENCE_ES}`,
      en: `Send the amount with Bizum. ${REFERENCE_EN}`,
    },
  },
  {
    id: 'MB_WAY',
    label: 'MB WAY',
    countries: ['PT'],
    identifier: { es: 'Número de teléfono', en: 'Phone number' },
    instructions: {
      es: `Envía el monto por MB WAY. ${REFERENCE_ES}`,
      en: `Send the amount with MB WAY. ${REFERENCE_EN}`,
    },
  },
  {
    id: 'PAYPAL',
    label: 'PayPal',
    countries: [],
    identifier: { es: 'Correo de PayPal', en: 'PayPal email' },
    instructions: {
      es: `Paga por PayPal. ${REFERENCE_ES}`,
      en: `Pay with PayPal. ${REFERENCE_EN}`,
    },
    usesLink: true,
  },
];

export const PAYMENT_PRESET_IDS = PAYMENT_PRESETS.map((preset) => preset.id);

/** Presets for a country first, then the ones that work anywhere. */
export function presetsForCountry(country: string): PaymentPreset[] {
  return PAYMENT_PRESETS.filter(
    (preset) => preset.countries.includes(country) || preset.countries.length === 0,
  );
}

export function findPreset(id: string | null | undefined): PaymentPreset | undefined {
  return PAYMENT_PRESETS.find((preset) => preset.id === id);
}
