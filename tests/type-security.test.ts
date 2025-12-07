import { describe, test, expect } from 'vitest'
import { execSync } from 'child_process'
import fs from 'fs'
import * as fc from 'fast-check'

describe('Type Security', () => {
  describe('Unit Tests', () => {
    test('public types do not contain database ID fields', () => {
      const typesContent = fs.readFileSync('types/index.ts', 'utf-8')
      
      // Extract the minimal public types section
      const publicTypesMatch = typesContent.match(
        /\/\/ MINIMAL PUBLIC TYPES[\s\S]*?\/\/ LEGACY TYPES/
      )
      
      expect(publicTypesMatch).toBeTruthy()
      
      if (publicTypesMatch) {
        const publicTypesSection = publicTypesMatch[0]
        
        // Check that public types don't have database internal fields
        const forbiddenFields = [
          /\bid:\s*string/,           // id field
          /\bcreated_at:\s*string/,   // created_at field
          /\bupdated_at:\s*string/,   // updated_at field
          /\bhotel_id:\s*string/,     // foreign key
          /\bdaily_schedule_id:\s*string/, // foreign key
          /\bbus_schedule_id:\s*string/,   // foreign key
        ]
        
        for (const pattern of forbiddenFields) {
          expect(publicTypesSection).not.toMatch(pattern)
        }
      }
    })

    test('BookingFormData interface exists and contains only input fields', () => {
      const typesContent = fs.readFileSync('types/index.ts', 'utf-8')
      
      // Check BookingFormData exists
      expect(typesContent).toContain('export interface BookingFormData')
      
      // Extract BookingFormData interface
      const bookingFormMatch = typesContent.match(
        /export interface BookingFormData\s*{([^}]+)}/
      )
      
      expect(bookingFormMatch).toBeTruthy()
      
      if (bookingFormMatch) {
        const fields = bookingFormMatch[1]
        
        // Required fields for booking form
        expect(fields).toContain('customerName')
        expect(fields).toContain('phoneNumber')
        expect(fields).toContain('countryCode')
        expect(fields).toContain('bookingDate')
        expect(fields).toContain('scheduleId')
        expect(fields).toContain('passengerCount')
        expect(fields).toContain('roomNumber')
        expect(fields).toContain('hasWhatsapp')
        expect(fields).toContain('idempotencyKey')
        
        // Should NOT contain database internals
        expect(fields).not.toContain('id:')
        expect(fields).not.toContain('created_at')
        expect(fields).not.toContain('hotel_id')
      }
    })

    test('BookingConfirmation interface exists and contains only display fields', () => {
      const typesContent = fs.readFileSync('types/index.ts', 'utf-8')
      
      expect(typesContent).toContain('export interface BookingConfirmation')
      
      const bookingConfirmMatch = typesContent.match(
        /export interface BookingConfirmation\s*{([^}]+)}/
      )
      
      expect(bookingConfirmMatch).toBeTruthy()
      
      if (bookingConfirmMatch) {
        const fields = bookingConfirmMatch[1]
        
        // Required display fields
        expect(fields).toContain('bookingCode')
        expect(fields).toContain('customerName')
        expect(fields).toContain('hotelName')
        expect(fields).toContain('departureTime')
        expect(fields).toContain('destination')
        expect(fields).toContain('scheduleDate')
        
        // Should NOT contain database internals
        expect(fields).not.toContain('id:')
        expect(fields).not.toContain('created_at')
        expect(fields).not.toContain('hotel_id')
        expect(fields).not.toContain('daily_schedule_id')
      }
    })

    test('ScheduleDisplay interface exists and contains only UI fields', () => {
      const typesContent = fs.readFileSync('types/index.ts', 'utf-8')
      
      expect(typesContent).toContain('export interface ScheduleDisplay')
      
      const scheduleDisplayMatch = typesContent.match(
        /export interface ScheduleDisplay\s*{([^}]+)}/
      )
      
      expect(scheduleDisplayMatch).toBeTruthy()
      
      if (scheduleDisplayMatch) {
        const fields = scheduleDisplayMatch[1]
        
        // Required UI fields
        expect(fields).toContain('scheduleId')
        expect(fields).toContain('departureTime')
        expect(fields).toContain('destination')
        expect(fields).toContain('availableSeats')
        expect(fields).toContain('totalCapacity')
        expect(fields).toContain('status')
        expect(fields).toContain('scheduleDate')
        
        // Should use user-friendly names, not database field names
        expect(fields).not.toContain('current_booked')
        expect(fields).not.toContain('max_capacity')
        expect(fields).not.toContain('bus_schedule_id')
      }
    })

    test('generated types are in .gitignore', () => {
      const gitignore = fs.readFileSync('.gitignore', 'utf-8')
      
      expect(gitignore).toContain('types/supabase.ts')
      expect(gitignore).toContain('types/database.ts')
    })

    test('generated types are not tracked by git', () => {
      const files = execSync('git ls-files', { encoding: 'utf-8' })
      const trackedFiles = files.split('\n')
      
      expect(trackedFiles).not.toContain('types/supabase.ts')
      expect(trackedFiles).not.toContain('types/database.ts')
    })

    test('types file does not expose sensitive field names in public section', () => {
      const typesContent = fs.readFileSync('types/index.ts', 'utf-8')
      
      // Extract only the public types section
      const publicTypesMatch = typesContent.match(
        /\/\/ MINIMAL PUBLIC TYPES[\s\S]*?\/\/ LEGACY TYPES/
      )
      
      if (publicTypesMatch) {
        const publicTypesSection = publicTypesMatch[0]
        
        // Sensitive field patterns that should not appear in public types
        const sensitivePatterns = [
          /whatsapp_attempts/,
          /whatsapp_last_error/,
          /service_role/,
          /is_active/,
          /internal_/,
        ]
        
        for (const pattern of sensitivePatterns) {
          expect(publicTypesSection).not.toMatch(pattern)
        }
      }
    })
  })

  describe('Property-Based Tests', () => {
    // Feature: database-security, Property 10: Types do not expose full schema
    // Validates: Requirements 9.1, 9.3, 9.4
    test('Property 10: Types do not expose full schema', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const typesContent = fs.readFileSync('types/index.ts', 'utf-8')
            
            // Extract the minimal public types section
            const publicTypesMatch = typesContent.match(
              /\/\/ MINIMAL PUBLIC TYPES[\s\S]*?\/\/ LEGACY TYPES/
            )
            
            if (!publicTypesMatch) {
              return false // Public types section must exist
            }
            
            const publicTypesSection = publicTypesMatch[0]
            
            // Database-internal field patterns that should NOT appear in public types
            const internalFieldPatterns = [
              /\bid:\s*string/,                    // Primary keys
              /\bcreated_at:\s*string/,            // Timestamps
              /\bupdated_at:\s*string/,            // Timestamps
              /\bhotel_id:\s*string/,              // Foreign keys
              /\bdaily_schedule_id:\s*string/,     // Foreign keys
              /\bbus_schedule_id:\s*string/,       // Foreign keys
              /\bis_active:\s*boolean/,            // Internal flags
              /\bwhatsapp_attempts/,               // Internal tracking
              /\bwhatsapp_last_error/,             // Internal errors
            ]
            
            // Check that none of these patterns appear in public types
            for (const pattern of internalFieldPatterns) {
              if (pattern.test(publicTypesSection)) {
                return false
              }
            }
            
            // Verify that required minimal interfaces exist
            const requiredInterfaces = [
              'BookingFormData',
              'BookingConfirmation',
              'ScheduleDisplay',
            ]
            
            for (const interfaceName of requiredInterfaces) {
              if (!publicTypesSection.includes(`export interface ${interfaceName}`)) {
                return false
              }
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    test('Property: Generated types are never committed', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const files = execSync('git ls-files', { encoding: 'utf-8' })
            const trackedFiles = files.split('\n')
            
            // Check that generated type files are not tracked
            const generatedTypeFiles = trackedFiles.filter(file =>
              file === 'types/supabase.ts' || file === 'types/database.ts'
            )
            
            return generatedTypeFiles.length === 0
          }
        ),
        { numRuns: 100 }
      )
    })

    test('Property: Public types use user-friendly field names', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const typesContent = fs.readFileSync('types/index.ts', 'utf-8')
            
            // Extract the minimal public types section
            const publicTypesMatch = typesContent.match(
              /\/\/ MINIMAL PUBLIC TYPES[\s\S]*?\/\/ LEGACY TYPES/
            )
            
            if (!publicTypesMatch) {
              return false
            }
            
            const publicTypesSection = publicTypesMatch[0]
            
            // Database naming conventions that should NOT appear in public types
            const databaseNamingPatterns = [
              /_id:/,           // Foreign key suffix
              /current_booked/, // Database field name
              /max_capacity/,   // Database field name
              /is_active/,      // Database field name
            ]
            
            // Check that public types use user-friendly names
            for (const pattern of databaseNamingPatterns) {
              if (pattern.test(publicTypesSection)) {
                return false
              }
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
