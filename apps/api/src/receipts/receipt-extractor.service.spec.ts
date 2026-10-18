import { ReceiptExtractorService } from './receipt-extractor.service';
import { type AppConfig } from '../config/app-config';

describe('ReceiptExtractorService', () => {
  const mockConfig = (apiKey: string | null = 'test-gemini-key'): AppConfig =>
    ({
      geminiApiKey: apiKey,
    }) as unknown as AppConfig;

  it('returns null if geminiApiKey is not configured', async () => {
    const fetchMock = jest.fn();
    const service = new ReceiptExtractorService(mockConfig(null), fetchMock);

    const result = await service.extractReceipt(Buffer.from('fake-image'), 'image/jpeg');

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('extracts a SINPE Móvil receipt with exact minor currency units', async () => {
    const geminiPayload = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  amount: 5200,
                  currency: 'CRC',
                  recipientPhone: '+50688887777',
                  recipientName: 'Panadería La Esquina',
                  senderName: 'Juan Pérez',
                  transactionDate: '2026-10-17T19:04:12Z',
                  referenceNumber: '104928374',
                  bankName: 'BAC Credomatic',
                  confidence: 'HIGH',
                  rawSummary: 'Transferencia SINPE Móvil por ₡5.200 a Panadería La Esquina',
                }),
              },
            ],
          },
        },
      ],
    };

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(geminiPayload),
    });

    const service = new ReceiptExtractorService(mockConfig(), fetchMock);
    const result = await service.extractReceipt(Buffer.from('sinpe-screenshot'), 'image/jpeg');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).not.toBeNull();
    expect(result?.amountMinor).toBe(520000); // CRC has exponent 2 (minor units: céntimos)
    expect(result?.currency).toBe('CRC');
    expect(result?.recipientPhone).toBe('+50688887777');
    expect(result?.referenceNumber).toBe('104928374');
    expect(result?.bankName).toBe('BAC Credomatic');
    expect(result?.confidence).toBe('HIGH');
  });

  it('extracts USD receipt and converts to minor units with 2 decimals', async () => {
    const geminiPayload = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  amount: 15.5,
                  currency: 'USD',
                  recipientPhone: null,
                  recipientName: 'Bruma Coffee',
                  senderName: 'Jane Doe',
                  transactionDate: '2026-10-17T18:00:00Z',
                  referenceNumber: 'REF-987654',
                  bankName: 'Zelle',
                  confidence: 'HIGH',
                  rawSummary: 'Zelle payment of $15.50 to Bruma Coffee',
                }),
              },
            ],
          },
        },
      ],
    };

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(geminiPayload),
    });

    const service = new ReceiptExtractorService(mockConfig(), fetchMock);
    const result = await service.extractReceipt(Buffer.from('zelle-receipt'), 'image/png');

    expect(result?.amountMinor).toBe(1550); // USD has 2 exponent
    expect(result?.currency).toBe('USD');
    expect(result?.confidence).toBe('HIGH');
  });

  it('handles low confidence or blurry images gracefully', async () => {
    const geminiPayload = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  amount: null,
                  currency: null,
                  recipientPhone: null,
                  recipientName: null,
                  senderName: null,
                  transactionDate: null,
                  referenceNumber: null,
                  bankName: null,
                  confidence: 'LOW',
                  rawSummary: 'Imagen no legible o no es un comprobante bancario',
                }),
              },
            ],
          },
        },
      ],
    };

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(geminiPayload),
    });

    const service = new ReceiptExtractorService(mockConfig(), fetchMock);
    const result = await service.extractReceipt(Buffer.from('blurry-pic'), 'image/jpeg');

    expect(result).not.toBeNull();
    expect(result?.amountMinor).toBeNull();
    expect(result?.confidence).toBe('LOW');
  });

  it('handles API errors gracefully and returns null', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: () => Promise.resolve('Service Unavailable'),
    });

    const service = new ReceiptExtractorService(mockConfig(), fetchMock);
    const result = await service.extractReceipt(Buffer.from('receipt'), 'image/jpeg');

    expect(result).toBeNull();
  });

  it('handles network exceptions gracefully and returns null', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('Network timeout'));

    const service = new ReceiptExtractorService(mockConfig(), fetchMock);
    const result = await service.extractReceipt(Buffer.from('receipt'), 'image/jpeg');

    expect(result).toBeNull();
  });
});
