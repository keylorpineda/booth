import { Injectable, Logger } from '@nestjs/common';

import { type ReceiptExtractionResult, receiptExtractionSchema, toMinor } from '@booth/shared';

import { type AppConfig } from '../config/app-config';
import { InjectConfig } from '../config/config.module';

export interface RawGeminiResponse {
  amount?: number | null;
  currency?: string | null;
  recipientPhone?: string | null;
  recipientName?: string | null;
  senderName?: string | null;
  transactionDate?: string | null;
  referenceNumber?: string | null;
  bankName?: string | null;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  rawSummary?: string | null;
}

const EXTRACTION_PROMPT = `
You are an expert financial assistant that reads payment receipts and transfer confirmation screenshots from mobile banking apps in Latin America and global payment providers.
Focus especially on common mobile apps:
- Costa Rica: SINPE Móvil (BAC Credomatic, Banco Nacional BNCR, BCR, Banco Popular, Promerica, Scotiabank, Davivienda, etc.)
- Colombia: Nequi, Daviplata, Bancolombia
- Mexico: SPEI, BBVA, Santander, Banorte, Mercado Pago
- Peru: Yape, Plin
- USA: Zelle, Venmo, Cash App
- Spain: Bizum

Extract the following information from the receipt image in valid JSON format:
{
  "amount": number | null (the primary transferred/paid amount in major units, e.g. 5200 for CRC 5,200 or 15.50 for USD 15.50),
  "currency": string | null (ISO 4217 code like "CRC", "USD", "COP", "MXN", etc., or inferred from symbols: ₡ -> CRC, $ with Costa Rica context -> CRC, $ -> USD, etc.),
  "recipientPhone": string | null (the phone number of the receiver/destination, if present),
  "recipientName": string | null (the name of the person or business receiving the money),
  "senderName": string | null (the name of the person who sent the money, if present),
  "transactionDate": string | null (ISO 8601 date string or timestamp like "2026-10-17T19:04:12Z", or readable date/time if year is missing),
  "referenceNumber": string | null (the unique transfer voucher / comprobante / autorización / número de referencia / folio),
  "bankName": string | null (the issuing bank or wallet name, e.g. "BAC Credomatic", "Banco Nacional", "Nequi", "Yape", etc.),
  "confidence": "HIGH" | "MEDIUM" | "LOW" ("HIGH" if amount and reference are clearly visible, "LOW" if blurry, missing key info or not a receipt),
  "rawSummary": string | null (a concise 1-line Spanish description of the detected transaction, e.g. "Transferencia SINPE Móvil por ₡5.200 a Panadería La Esquina")
}

If the image is not a payment receipt or is completely unreadable, return confidence "LOW" and null for amount and referenceNumber.
`;

@Injectable()
export class ReceiptExtractorService {
  private readonly logger = new Logger(ReceiptExtractorService.name);

  constructor(
    @InjectConfig() private readonly config: AppConfig,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  /**
   * Extracts payment details from an uploaded receipt buffer using Gemini Flash.
   * Returns null if GEMINI_API_KEY is not configured or if an unrecoverable API error occurs.
   */
  async extractReceipt(buffer: Buffer, mimeType: string): Promise<ReceiptExtractionResult | null> {
    const apiKey = this.config.geminiApiKey;
    if (!apiKey) {
      this.logger.debug('GEMINI_API_KEY not configured, skipping AI receipt extraction');
      return null;
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: buffer.toString('base64'),
                },
              },
              {
                text: EXTRACTION_PROMPT,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      };

      const response = await this.fetchFn(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12000),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        this.logger.warn(`Gemini API request failed with status ${response.status}: ${errorText}`);
        return null;
      }

      const data = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        this.logger.warn('Gemini API returned empty text part');
        return null;
      }

      const raw = JSON.parse(text) as RawGeminiResponse;
      return this.mapToResult(raw);
    } catch (error) {
      this.logger.warn(
        `Receipt AI extraction error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  private mapToResult(raw: RawGeminiResponse): ReceiptExtractionResult {
    let amountMinor: number | null = null;
    if (typeof raw.amount === 'number' && !Number.isNaN(raw.amount) && raw.amount >= 0) {
      const currency = raw.currency ? raw.currency.toUpperCase() : 'CRC';
      try {
        amountMinor = toMinor(raw.amount, currency);
      } catch {
        amountMinor = Math.round(raw.amount * 100);
      }
    }

    const clean = (val: string | null | undefined): string | null => {
      if (!val) {
        return null;
      }
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    return receiptExtractionSchema.parse({
      amountMinor,
      currency: raw.currency ? raw.currency.toUpperCase() : null,
      recipientPhone: clean(raw.recipientPhone),
      recipientName: clean(raw.recipientName),
      senderName: clean(raw.senderName),
      transactionDate: clean(raw.transactionDate),
      referenceNumber: clean(raw.referenceNumber),
      bankName: clean(raw.bankName),
      confidence: raw.confidence ?? 'LOW',
      rawSummary: clean(raw.rawSummary),
    });
  }
}
