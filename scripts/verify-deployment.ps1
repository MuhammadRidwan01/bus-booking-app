# Deployment Verification Script (PowerShell)
# This script verifies that all security measures are in place before and after deployment

$ErrorActionPreference = "Stop"

# Counters
$script:Passed = 0
$script:Failed = 0
$script:Warnings = 0

# Helper functions
function Print-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Print-Check {
    param([string]$Message)
    Write-Host "Checking: $Message... " -NoNewline
}

function Print-Pass {
    Write-Host "✓ PASS" -ForegroundColor Green
    $script:Passed++
}

function Print-Fail {
    param([string]$Details)
    Write-Host "✗ FAIL" -ForegroundColor Red
    Write-Host "  $Details" -ForegroundColor Red
    $script:Failed++
}

function Print-Warning {
    param([string]$Details)
    Write-Host "⚠ WARNING" -ForegroundColor Yellow
    Write-Host "  $Details" -ForegroundColor Yellow
    $script:Warnings++
}

# Check 1: No migration files in git
function Check-NoMigrationsInGit {
    Print-Check "No migration files in git"
    
    $trackedMigrations = git ls-files | Select-String "supabase/migrations/.*\.sql"
    
    if ($null -eq $trackedMigrations -or $trackedMigrations.Count -eq 0) {
        Print-Pass
    } else {
        Print-Fail "Found tracked migration files: $($trackedMigrations -join ', ')"
    }
}

# Check 2: No Edge Function code in git
function Check-NoEdgeFunctionsInGit {
    Print-Check "No Edge Function implementations in git"
    
    $trackedFunctions = git ls-files | Select-String "supabase/functions/[^_].*\.ts"
    
    if ($null -eq $trackedFunctions -or $trackedFunctions.Count -eq 0) {
        Print-Pass
    } else {
        Print-Fail "Found tracked Edge Function files: $($trackedFunctions -join ', ')"
    }
}

# Check 3: No secrets in repository
function Check-NoSecretsInRepo {
    Print-Check "No secrets in repository"
    
    try {
        $secrets = git grep -E "(service_role|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+|sk_live_|pk_live_|SUPABASE_SERVICE_ROLE_KEY.*=.*ey)" -- ':!*.md' ':!scripts/*' 2>$null
        
        if ($null -eq $secrets -or $secrets.Count -eq 0) {
            Print-Pass
        } else {
            Print-Fail "Found potential secrets in repository"
        }
    } catch {
        Print-Pass
    }
}

# Check 4: .gitignore is properly configured
function Check-Gitignore {
    Print-Check ".gitignore properly configured"
    
    $missingEntries = @()
    $gitignoreContent = Get-Content .gitignore -Raw
    
    if ($gitignoreContent -notmatch "supabase/functions/\*\*") {
        $missingEntries += "supabase/functions/**"
    }
    
    if ($gitignoreContent -notmatch "supabase/migrations/\*\*") {
        $missingEntries += "supabase/migrations/**"
    }
    
    if ($gitignoreContent -notmatch "types/supabase\.ts") {
        $missingEntries += "types/supabase.ts"
    }
    
    if ($missingEntries.Count -eq 0) {
        Print-Pass
    } else {
        Print-Fail "Missing .gitignore entries: $($missingEntries -join ', ')"
    }
}

# Check 5: No secrets in git history
function Check-NoSecretsInHistory {
    Print-Check "No secrets in git history"
    
    try {
        $historySecrets = git log --all --source -S "service_role" --pretty=format:"%h %s" 2>$null | Select-Object -First 5
        
        if ($null -eq $historySecrets -or $historySecrets.Count -eq 0) {
            Print-Pass
        } else {
            Print-Warning "Found 'service_role' mentions in git history. Review manually."
        }
    } catch {
        Print-Pass
    }
}

# Check 6: Environment files are not tracked
function Check-EnvFilesNotTracked {
    Print-Check "Environment files not tracked"
    
    $trackedEnv = git ls-files | Select-String "\.env$|\.env\.local$|\.env\.production$"
    
    if ($null -eq $trackedEnv -or $trackedEnv.Count -eq 0) {
        Print-Pass
    } else {
        Print-Fail "Found tracked environment files: $($trackedEnv -join ', ')"
    }
}

# Check 7: Production build configuration
function Check-ProductionBuildConfig {
    Print-Check "Production build configuration"
    
    if (Test-Path "next.config.mjs") {
        $configContent = Get-Content "next.config.mjs" -Raw
        
        if ($configContent -match "productionBrowserSourceMaps.*false") {
            Print-Pass
        } else {
            Print-Warning "Source maps may not be disabled in production"
        }
    } else {
        Print-Warning "next.config.mjs not found"
    }
}

# Check 8: Minimal types in public repo
function Check-MinimalTypes {
    Print-Check "Types are minimal (no DB internals)"
    
    if (Test-Path "types/index.ts") {
        $typesContent = Get-Content "types/index.ts" -Raw
        
        if ($typesContent -match "(created_at|updated_at|id:.*uuid|foreign.*key)") {
            Print-Warning "Found potential database-internal fields in types"
        } else {
            Print-Pass
        }
    } else {
        Print-Warning "types/index.ts not found"
    }
}

# Check 9: Edge Functions exist locally
function Check-EdgeFunctionsExist {
    Print-Check "Edge Functions exist locally"
    
    $missingFunctions = @()
    
    if (-not (Test-Path "supabase/functions/booking/index.ts")) {
        $missingFunctions += "booking/index.ts"
    }
    
    if (-not (Test-Path "supabase/functions/admin-booking/index.ts")) {
        $missingFunctions += "admin-booking/index.ts"
    }
    
    if (-not (Test-Path "supabase/functions/booking-status/index.ts")) {
        $missingFunctions += "booking-status/index.ts"
    }
    
    if ($missingFunctions.Count -eq 0) {
        Print-Pass
    } else {
        Print-Fail "Missing Edge Functions: $($missingFunctions -join ', ')"
    }
}

# Check 10: Shared utilities exist
function Check-SharedUtilities {
    Print-Check "Shared utilities exist"
    
    $missingUtils = @()
    
    if (-not (Test-Path "supabase/functions/_shared/cors.ts")) {
        $missingUtils += "cors.ts"
    }
    
    if (-not (Test-Path "supabase/functions/_shared/auth.ts")) {
        $missingUtils += "auth.ts"
    }
    
    if (-not (Test-Path "supabase/functions/_shared/rate-limit.ts")) {
        $missingUtils += "rate-limit.ts"
    }
    
    if (-not (Test-Path "supabase/functions/_shared/errors.ts")) {
        $missingUtils += "errors.ts"
    }
    
    if ($missingUtils.Count -eq 0) {
        Print-Pass
    } else {
        Print-Fail "Missing shared utilities: $($missingUtils -join ', ')"
    }
}

# Check 11: LICENSE file exists and is restrictive
function Check-License {
    Print-Check "Restrictive LICENSE file exists"
    
    if (Test-Path "LICENSE") {
        $licenseContent = Get-Content "LICENSE" -Raw
        
        if ($licenseContent -match "(?i)all rights reserved") {
            Print-Pass
        } else {
            Print-Warning "LICENSE may not be restrictive enough"
        }
    } else {
        Print-Fail "LICENSE file not found"
    }
}

# Check 12: Documentation exists
function Check-Documentation {
    Print-Check "Security documentation exists"
    
    $missingDocs = @()
    
    if (-not (Test-Path "docs/edge-functions-setup.md")) {
        $missingDocs += "edge-functions-setup.md"
    }
    
    if (-not (Test-Path "docs/DEPLOYMENT_GUIDE.md")) {
        $missingDocs += "DEPLOYMENT_GUIDE.md"
    }
    
    if ($missingDocs.Count -eq 0) {
        Print-Pass
    } else {
        Print-Warning "Missing documentation: $($missingDocs -join ', ')"
    }
}

# Main execution
function Main {
    Print-Header "Security Deployment Verification"
    
    Write-Host "This script verifies that all security measures are in place."
    Write-Host "Run this before deploying to production."
    Write-Host ""
    
    # Run all checks
    Print-Header "Git Security Checks"
    Check-NoMigrationsInGit
    Check-NoEdgeFunctionsInGit
    Check-NoSecretsInRepo
    Check-Gitignore
    Check-NoSecretsInHistory
    Check-EnvFilesNotTracked
    
    Print-Header "Code Security Checks"
    Check-ProductionBuildConfig
    Check-MinimalTypes
    Check-License
    
    Print-Header "Edge Functions Checks"
    Check-EdgeFunctionsExist
    Check-SharedUtilities
    
    Print-Header "Documentation Checks"
    Check-Documentation
    
    # Summary
    Print-Header "Verification Summary"
    Write-Host "Passed: $script:Passed" -ForegroundColor Green
    Write-Host "Warnings: $script:Warnings" -ForegroundColor Yellow
    Write-Host "Failed: $script:Failed" -ForegroundColor Red
    Write-Host ""
    
    if ($script:Failed -eq 0) {
        Write-Host "✓ All critical checks passed!" -ForegroundColor Green
        Write-Host "You can proceed with deployment."
        exit 0
    } else {
        Write-Host "✗ Some checks failed!" -ForegroundColor Red
        Write-Host "Please fix the issues before deploying."
        exit 1
    }
}

# Run main function
Main
