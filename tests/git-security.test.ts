import { describe, test, expect } from 'vitest'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import * as fc from 'fast-check'

describe('Git Security Configuration', () => {
  describe('Unit Tests', () => {
    test('.gitignore excludes Edge Functions directory', () => {
      const gitignore = fs.readFileSync('.gitignore', 'utf-8')
      expect(gitignore).toContain('supabase/functions/**')
      expect(gitignore).toContain('!supabase/functions/.gitkeep')
    })

    test('.gitignore excludes migrations directory', () => {
      const gitignore = fs.readFileSync('.gitignore', 'utf-8')
      expect(gitignore).toContain('supabase/migrations/**')
      expect(gitignore).toContain('!supabase/migrations/.gitkeep')
    })

    test('.gitignore excludes generated type files', () => {
      const gitignore = fs.readFileSync('.gitignore', 'utf-8')
      expect(gitignore).toContain('types/supabase.ts')
      expect(gitignore).toContain('types/database.ts')
    })

    test('.gitignore excludes all .env files', () => {
      const gitignore = fs.readFileSync('.gitignore', 'utf-8')
      expect(gitignore).toContain('.env*')
    })

    test('no migration files in git ls-files output', () => {
      const files = execSync('git ls-files', { encoding: 'utf-8' })
      const migrationFiles = files.split('\n').filter(file => 
        file.includes('supabase/migrations/') && file.endsWith('.sql')
      )
      expect(migrationFiles).toHaveLength(0)
    })

    test('no Edge Function TypeScript files in git ls-files output', () => {
      const files = execSync('git ls-files', { encoding: 'utf-8' })
      const functionFiles = files.split('\n').filter(file => 
        file.includes('supabase/functions/') && file.endsWith('.ts')
      )
      expect(functionFiles).toHaveLength(0)
    })

    test('no .env files in git ls-files output', () => {
      const files = execSync('git ls-files', { encoding: 'utf-8' })
      const envFiles = files.split('\n').filter(file => 
        file.includes('.env') && !file.includes('.env.example')
      )
      expect(envFiles).toHaveLength(0)
    })

    test('no secrets matching common patterns in tracked files', () => {
      const files = execSync('git ls-files', { encoding: 'utf-8' })
      const trackedFiles = files.split('\n').filter(f => f.trim())
      
      // Common secret patterns to check
      const secretPatterns = [
        /eyJ[A-Za-z0-9_-]{30,}/, // JWT tokens
        /sk_live_[A-Za-z0-9]{24,}/, // Stripe live keys
        /sk_test_[A-Za-z0-9]{24,}/, // Stripe test keys
        /AKIA[A-Z0-9]{16}/, // AWS access keys
      ]

      for (const file of trackedFiles) {
        if (!file || file.includes('node_modules') || file.includes('.git')) continue
        
        try {
          const content = fs.readFileSync(file, 'utf-8')
          
          for (const pattern of secretPatterns) {
            const matches = content.match(pattern)
            if (matches) {
              // Check if it's in a documentation/example context
              const lines = content.split('\n')
              for (let i = 0; i < lines.length; i++) {
                if (pattern.test(lines[i])) {
                  // Allow if it's clearly an example (contains "example", "...", or is in a code block)
                  const context = lines.slice(Math.max(0, i - 2), i + 3).join('\n')
                  const isExample = context.includes('example') || 
                                   context.includes('...') ||
                                   context.includes('eyJ...') ||
                                   context.includes('```')
                  
                  if (!isExample) {
                    throw new Error(`Potential secret found in ${file}: ${matches[0].substring(0, 20)}...`)
                  }
                }
              }
            }
          }
        } catch (err: any) {
          if (err.code !== 'EISDIR') {
            throw err
          }
        }
      }
    })
  })

  describe('Property-Based Tests', () => {
    // Feature: database-security, Property 1: Repository contains no migration files
    test('Property 1: Repository contains no migration files', () => {
      fc.assert(
        fc.property(
          fc.constant(null), // No input needed, we're checking a static property
          () => {
            const files = execSync('git ls-files', { encoding: 'utf-8' })
            const migrationFiles = files.split('\n').filter(file => 
              file.includes('supabase/migrations/') && file.endsWith('.sql')
            )
            return migrationFiles.length === 0
          }
        ),
        { numRuns: 1 } // Only need to run once since it's checking a static property
      )
    })

    // Feature: database-security, Property 2: Edge Function code is never committed
    test('Property 2: Edge Function code is never committed', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const files = execSync('git ls-files', { encoding: 'utf-8' })
            const functionFiles = files.split('\n').filter(file => 
              file.includes('supabase/functions/') && 
              (file.endsWith('.ts') || file.endsWith('.js'))
            )
            return functionFiles.length === 0
          }
        ),
        { numRuns: 1 }
      )
    })

    // Feature: database-security, Property 3: No secrets in repository
    test('Property 3: No secrets in repository', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const files = execSync('git ls-files', { encoding: 'utf-8' })
            const trackedFiles = files.split('\n').filter(f => 
              f.trim() && 
              !f.includes('node_modules') && 
              !f.includes('.git') &&
              !f.includes('pnpm-lock.yaml') // Exclude lock files
            )
            
            // Check for actual secret values (not just env var names)
            const actualSecretPattern = /(?:service_role_key|api_key|secret)["']?\s*[:=]\s*["']?[A-Za-z0-9_-]{32,}/i
            
            for (const file of trackedFiles) {
              if (!file) continue
              
              try {
                const content = fs.readFileSync(file, 'utf-8')
                const matches = content.match(actualSecretPattern)
                
                if (matches) {
                  // Verify it's not just a placeholder or example
                  const matchedText = matches[0]
                  if (!matchedText.includes('...') && 
                      !matchedText.includes('example') &&
                      !matchedText.includes('your-') &&
                      !matchedText.includes('<') &&
                      !matchedText.includes('process.env')) {
                    return false // Found a real secret
                  }
                }
              } catch (err: any) {
                if (err.code !== 'EISDIR') {
                  // Ignore directory errors
                }
              }
            }
            
            return true // No secrets found
          }
        ),
        { numRuns: 1 }
      )
    })
  })
})
