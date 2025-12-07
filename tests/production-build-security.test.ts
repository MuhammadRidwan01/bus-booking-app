import { describe, test, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import * as fc from 'fast-check'

describe('Production Build Security Configuration', () => {
  describe('Next.js Configuration', () => {
    test('next.config.mjs disables source maps in production', () => {
      const configPath = join(process.cwd(), 'next.config.mjs')
      const configContent = readFileSync(configPath, 'utf-8')
      
      // Verify productionBrowserSourceMaps is set to false
      expect(configContent).toContain('productionBrowserSourceMaps: false')
    })

    test('next.config.mjs includes security headers', () => {
      const configPath = join(process.cwd(), 'next.config.mjs')
      const configContent = readFileSync(configPath, 'utf-8')
      
      // Verify security headers are configured
      expect(configContent).toContain('X-Content-Type-Options')
      expect(configContent).toContain('nosniff')
      expect(configContent).toContain('X-Frame-Options')
      expect(configContent).toContain('DENY')
      expect(configContent).toContain('X-XSS-Protection')
    })

    test('next.config.mjs validates required environment variables', () => {
      const configPath = join(process.cwd(), 'next.config.mjs')
      const configContent = readFileSync(configPath, 'utf-8')
      
      // Verify environment variable validation
      expect(configContent).toContain('NEXT_PUBLIC_SUPABASE_URL')
      expect(configContent).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    })
  })

  describe('Environment Variables Usage', () => {
    test('lib/supabase-config.ts uses environment variables', () => {
      const configPath = join(process.cwd(), 'lib/supabase-config.ts')
      const configContent = readFileSync(configPath, 'utf-8')
      
      // Verify no hardcoded URLs
      expect(configContent).not.toMatch(/https:\/\/[a-z0-9-]+\.supabase\.co/)
      
      // Verify environment variables are used
      expect(configContent).toContain('process.env.NEXT_PUBLIC_SUPABASE_URL')
      expect(configContent).toContain('process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
      expect(configContent).toContain('process.env.SUPABASE_SERVICE_ROLE_KEY')
    })

    test('lib/booking-service.ts uses environment variables for Edge Function URLs', () => {
      const servicePath = join(process.cwd(), 'lib/booking-service.ts')
      const serviceContent = readFileSync(servicePath, 'utf-8')
      
      // Verify environment variables are used for Edge Function URLs
      expect(serviceContent).toContain('process.env.NEXT_PUBLIC_SUPABASE_URL')
      expect(serviceContent).toContain('/functions/v1/booking')
      expect(serviceContent).toContain('/functions/v1/booking-status')
      expect(serviceContent).toContain('/functions/v1/admin-booking')
    })

    test('lib/send-wa.ts uses environment variable for WhatsApp API URL', () => {
      const waPath = join(process.cwd(), 'lib/send-wa.ts')
      const waContent = readFileSync(waPath, 'utf-8')
      
      // Verify environment variable is used
      expect(waContent).toContain('process.env.WABLAS_BASE_URL')
      
      // Hardcoded URL should only be a fallback default
      const hardcodedMatches = waContent.match(/https:\/\/[a-z]+\.wablas\.com/g) || []
      expect(hardcodedMatches.length).toBeLessThanOrEqual(1) // Only fallback allowed
    })

    test('no hardcoded Supabase URLs in application code', () => {
      const appFiles = [
        'lib/supabase-browser.ts',
        'lib/supabase-server.ts',
        'lib/supabase-admin.ts',
        'lib/booking-service.ts',
      ]
      
      appFiles.forEach(file => {
        const filePath = join(process.cwd(), file)
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8')
          
          // Should not contain hardcoded Supabase project URLs
          expect(content).not.toMatch(/https:\/\/[a-z0-9-]+\.supabase\.co/)
        }
      })
    })
  })

  describe('Build Output Security (if .next exists)', () => {
    test('production build should not contain source maps', () => {
      const nextDir = join(process.cwd(), '.next')
      
      // Skip if build doesn't exist
      if (!existsSync(nextDir)) {
        console.log('Skipping: .next directory not found (run pnpm build first)')
        return
      }
      
      // Check for .map files in build output
      const findMapFiles = (dir: string): string[] => {
        const mapFiles: string[] = []
        
        try {
          const entries = readdirSync(dir)
          
          for (const entry of entries) {
            const fullPath = join(dir, entry)
            const stat = statSync(fullPath)
            
            if (stat.isDirectory()) {
              mapFiles.push(...findMapFiles(fullPath))
            } else if (entry.endsWith('.map')) {
              mapFiles.push(fullPath)
            }
          }
        } catch (error) {
          // Ignore permission errors
        }
        
        return mapFiles
      }
      
      const mapFiles = findMapFiles(nextDir)
      
      // Should have no .map files in production build
      expect(mapFiles.length).toBe(0)
    })

    test('JavaScript files should be minified', () => {
      const nextDir = join(process.cwd(), '.next')
      
      // Skip if build doesn't exist
      if (!existsSync(nextDir)) {
        console.log('Skipping: .next directory not found (run pnpm build first)')
        return
      }
      
      const staticDir = join(nextDir, 'static', 'chunks')
      
      if (!existsSync(staticDir)) {
        console.log('Skipping: static chunks directory not found')
        return
      }
      
      // Find JavaScript files
      const jsFiles = readdirSync(staticDir)
        .filter(file => file.endsWith('.js'))
        .slice(0, 5) // Check first 5 files
      
      if (jsFiles.length === 0) {
        console.log('Skipping: no JavaScript files found in build')
        return
      }
      
      // Check that files are minified (no excessive whitespace)
      jsFiles.forEach(file => {
        const content = readFileSync(join(staticDir, file), 'utf-8')
        const lines = content.split('\n')
        
        // Minified files should have very few lines relative to content
        const avgLineLength = content.length / lines.length
        
        // Minified code typically has very long lines (>100 chars average)
        expect(avgLineLength).toBeGreaterThan(100)
      })
    })
  })

  describe('Property 9: Production builds are minified', () => {
    // Feature: database-security, Property 9: Production builds are minified
    // Validates: Requirements 12.1, 12.2, 12.3
    
    test('configuration enforces production security settings', () => {
      const configPath = join(process.cwd(), 'next.config.mjs')
      const configContent = readFileSync(configPath, 'utf-8')
      
      // Property: Production builds must have source maps disabled
      expect(configContent).toContain('productionBrowserSourceMaps: false')
      
      // Property: Security headers must be configured
      expect(configContent).toContain('X-Content-Type-Options')
      expect(configContent).toContain('X-Frame-Options')
      expect(configContent).toContain('X-XSS-Protection')
    })

    test('all endpoint URLs use environment variables', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            'lib/supabase-config.ts',
            'lib/supabase-browser.ts',
            'lib/supabase-server.ts',
            'lib/booking-service.ts',
            'lib/send-wa.ts'
          ),
          async (filePath) => {
            const fullPath = join(process.cwd(), filePath)
            
            if (!existsSync(fullPath)) {
              return true // Skip if file doesn't exist
            }
            
            const content = readFileSync(fullPath, 'utf-8')
            
            // Count hardcoded URLs (excluding comments and fallback defaults)
            const lines = content.split('\n')
            const codeLines = lines.filter(line => {
              const trimmed = line.trim()
              return !trimmed.startsWith('//') && !trimmed.startsWith('*')
            })
            
            const codeContent = codeLines.join('\n')
            
            // Files that import from supabase-config are OK (they use centralized config)
            const importsConfig = codeContent.includes('from "./supabase-config"') || 
                                  codeContent.includes('from \'./supabase-config\'')
            
            // Should use process.env for configuration OR import from config
            const hasEnvVars = codeContent.includes('process.env')
            
            // Hardcoded URLs should only be fallback defaults (with || or ??)
            const hardcodedUrls = codeContent.match(/https:\/\/[a-z0-9-]+\.(supabase\.co|wablas\.com)/g) || []
            const fallbackUrls = codeContent.match(/(process\.env\.[A-Z_]+\s*(\|\||\?\?)\s*["']https:\/\/)/g) || []
            
            // All hardcoded URLs should be fallbacks, OR file imports from config
            return (hasEnvVars && hardcodedUrls.length <= fallbackUrls.length) || importsConfig
          }
        ),
        { numRuns: 100 }
      )
    })

    test('no source map references in production code', async () => {
      const nextDir = join(process.cwd(), '.next')
      
      // Skip if build doesn't exist
      if (!existsSync(nextDir)) {
        console.log('Skipping: .next directory not found (run pnpm build first)')
        return
      }
      
      await fc.assert(
        fc.asyncProperty(
          fc.constant(nextDir),
          async (buildDir) => {
            const staticDir = join(buildDir, 'static', 'chunks')
            
            if (!existsSync(staticDir)) {
              return true // Skip if directory doesn't exist
            }
            
            const jsFiles = readdirSync(staticDir)
              .filter(file => file.endsWith('.js'))
              .slice(0, 10) // Check first 10 files
            
            if (jsFiles.length === 0) {
              return true // Skip if no files
            }
            
            // Check that no files reference source maps
            for (const file of jsFiles) {
              const content = readFileSync(join(staticDir, file), 'utf-8')
              
              // Should not contain source map references
              if (content.includes('sourceMappingURL')) {
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

  describe('Environment Variable Documentation', () => {
    test('.env.example documents all required public variables', () => {
      const envExamplePath = join(process.cwd(), '.env.example')
      const envContent = readFileSync(envExamplePath, 'utf-8')
      
      // Verify all required public variables are documented
      expect(envContent).toContain('NEXT_PUBLIC_SUPABASE_URL')
      expect(envContent).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY')
      expect(envContent).toContain('WABLAS_BASE_URL')
    })

    test('.env.example includes setup instructions', () => {
      const envExamplePath = join(process.cwd(), '.env.example')
      const envContent = readFileSync(envExamplePath, 'utf-8')
      
      // Verify setup instructions are present
      expect(envContent).toContain('Setup Instructions')
      expect(envContent).toContain('.env.local')
    })
  })
})
