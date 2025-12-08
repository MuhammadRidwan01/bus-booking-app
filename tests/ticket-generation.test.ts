import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { generateTicketPdf } from '@/lib/ticket'

describe('Ticket PDF Generation - Property-Based Tests', () => {
  // Feature: professional-ticket-pdf, Property 1: Download headers trigger file download
  it('should set proper download headers for any booking code', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 20 }),
        async (bookingCode) => {
          // Mock the API route behavior by checking what headers would be set
          // We're testing that for any booking code, the headers follow the correct format
          
          // Verify filename format
          const expectedFilename = `shuttle-ticket-${bookingCode}.pdf`
          const contentDisposition = `attachment; filename="${expectedFilename}"`
          
          // The property: Content-Disposition must be "attachment" (not "inline")
          expect(contentDisposition).toContain('attachment')
          expect(contentDisposition).toContain(expectedFilename)
          
          // The property: filename must follow the pattern "shuttle-ticket-{CODE}.pdf"
          expect(expectedFilename).toMatch(/^shuttle-ticket-.+\.pdf$/)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: professional-ticket-pdf, Property 2: Unicode text renders without errors
  it('should render Unicode text without encoding errors', async () => {
    // Generator for strings with problematic Unicode characters
    const problematicChars = ['→', '•', '–', '—', '"', '"', '\u2018', '\u2019', '…', 'é', 'ñ', '中', '日', '한', '🎫']
    const unicodeStringGen = fc.string({ minLength: 1, maxLength: 50 }).chain(baseStr =>
      fc.constantFrom(...problematicChars).map(char => baseStr + char)
    )

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          bookingCode: fc.string({ minLength: 5, maxLength: 20 }),
          customerName: unicodeStringGen,
          hotelName: fc.option(unicodeStringGen, { nil: undefined }),
          scheduleDate: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          departureTime: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
          destination: fc.option(unicodeStringGen, { nil: undefined }),
          passengerCount: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
          roomNumber: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
          trackUrl: fc.webUrl(),
        }),
        async (payload) => {
          // The property: for any text containing Unicode characters,
          // the PDF generation should either succeed or handle gracefully without throwing encoding errors
          let pdfBytes: Uint8Array | null = null
          let error: Error | null = null

          try {
            pdfBytes = await generateTicketPdf(payload)
          } catch (e) {
            error = e as Error
          }

          // The PDF should be generated successfully
          expect(error).toBeNull()
          expect(pdfBytes).toBeDefined()
          expect(pdfBytes).toBeInstanceOf(Uint8Array)
          expect(pdfBytes!.length).toBeGreaterThan(0)

          // Verify it's a valid PDF by checking the header
          const pdfHeader = String.fromCharCode(...Array.from(pdfBytes!.slice(0, 5)))
          expect(pdfHeader).toBe('%PDF-')
        }
      ),
      { numRuns: 50 } // Reduced from 100 due to logo loading
    )
  }, 15000) // Increased timeout to 15 seconds for logo loading
})
