import { type AppLocale, resolveAppLocale } from '../countries';

/** The data-protection law cited by the default notice for each country. */
const LAWS: Readonly<Record<string, string>> = {
  CR: 'Ley N.° 8968 de Protección de la Persona frente al Tratamiento de sus Datos Personales',
  MX: 'Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)',
  CO: 'Ley 1581 de 2012 (Habeas Data)',
  PE: 'Ley N.° 29733, Ley de Protección de Datos Personales',
  BR: 'Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018)',
  AR: 'Ley 25.326 de Protección de los Datos Personales',
  CL: 'Ley 19.628 sobre Protección de la Vida Privada',
  ES: 'Reglamento General de Protección de Datos (RGPD) y LOPDGDD',
  PT: 'Regulamento Geral sobre a Proteção de Dados (RGPD)',
  US: 'applicable U.S. state privacy laws (such as the CCPA in California)',
};

const TEMPLATES: Record<AppLocale, (store: string, law: string | undefined) => string> = {
  es: (store, law) =>
    [
      `${store} usará tu nombre y número de teléfono solo para gestionar este pedido: confirmarlo, coordinar el pago y la entrega, y contactarte por WhatsApp.`,
      'No se usarán para publicidad ni se compartirán con terceros, salvo el servicio de alojamiento de la plataforma.',
      'Puedes pedir a la tienda acceder, corregir o eliminar tus datos en cualquier momento.',
      law ? `Tratamiento conforme a la ${law}.` : '',
    ]
      .filter(Boolean)
      .join(' '),
  en: (store, law) =>
    [
      `${store} will use your name and phone number only to handle this order: confirming it, arranging payment and delivery, and contacting you on WhatsApp.`,
      'They will not be used for advertising or shared with third parties, except the platform hosting provider.',
      'You can ask the store to access, correct or delete your data at any time.',
      law ? `Processed in accordance with ${law}.` : '',
    ]
      .filter(Boolean)
      .join(' '),
};

/** Default privacy notice shown at checkout when the store has not written its own. */
export function defaultPrivacyNotice(country: string, locale: string, storeName: string): string {
  return TEMPLATES[resolveAppLocale(locale)](storeName, LAWS[country]);
}
