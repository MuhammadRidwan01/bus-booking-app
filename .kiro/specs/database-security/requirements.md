# Requirements Document

## Introduction

This feature implements comprehensive security measures to protect the shuttle bus booking system's database and business logic from reverse engineering and unauthorized access. The system will migrate critical booking operations to Supabase Edge Functions while ensuring the public GitHub repository contains no sensitive information or migration files that could be used to recreate the database schema.

## Glossary

- **Edge Function**: Serverless functions hosted on Supabase infrastructure that execute server-side logic with access to service role keys
- **RLS (Row Level Security)**: PostgreSQL security feature that restricts database row access based on user authentication
- **Service Role Key**: Administrative Supabase API key with full database access, must never be exposed to clients
- **JWT (JSON Web Token)**: Authentication token issued to authenticated users for API access
- **Repository**: The public GitHub repository containing the application source code
- **Migration Files**: SQL files that define database schema and can be used to recreate database structure
- **Booking System**: The core application logic that handles shuttle bus seat reservations

## Requirements

### Requirement 1

**User Story:** As a system owner, I want to protect my database schema from reverse engineering, so that unauthorized parties cannot recreate my database structure.

#### Acceptance Criteria

1. WHEN the Repository is cloned THEN the Booking System SHALL NOT include any Supabase migration files in the cloned content
2. WHEN the Repository is inspected THEN the Booking System SHALL NOT contain any database schema definitions or SQL migration files
3. WHEN Git tracks files THEN the Booking System SHALL ignore all files in the supabase/functions directory
4. WHEN Git tracks files THEN the Booking System SHALL ignore all environment variable files containing secrets

### Requirement 2

**User Story:** As a system owner, I want to move booking logic to secure Edge Functions, so that critical business logic cannot be analyzed from the public repository.

#### Acceptance Criteria

1. WHEN a booking request is received THEN the Edge Function SHALL process the booking using the Service Role Key
2. WHEN the Edge Function executes THEN the Booking System SHALL validate the user's JWT token before processing
3. WHEN booking logic runs THEN the Booking System SHALL execute entirely on Supabase infrastructure without exposing implementation details
4. WHEN the Edge Function is deployed THEN the Booking System SHALL store the Edge Function only on Supabase servers and not in the Repository

### Requirement 3

**User Story:** As a system owner, I want to secure all API keys and secrets, so that sensitive credentials are never exposed in the repository.

#### Acceptance Criteria

1. WHEN secrets are configured THEN the Booking System SHALL store them using Supabase CLI secrets management
2. WHEN the Booking System needs credentials THEN the Edge Function SHALL retrieve secrets from Supabase environment variables
3. WHEN the Repository is published THEN the Booking System SHALL NOT contain any API keys, Service Role Keys, or authentication secrets
4. WHEN environment files exist THEN the Booking System SHALL ensure all .env files are ignored by Git

### Requirement 4

**User Story:** As a system owner, I want to maintain Row Level Security on all tables, so that database access is properly restricted even with Edge Functions.

#### Acceptance Criteria

1. WHEN Edge Functions access the database THEN the Booking System SHALL maintain RLS policies on all tables
2. WHEN user operations are performed THEN the Booking System SHALL verify JWT authentication before allowing access
3. WHEN service role operations are needed THEN the Edge Function SHALL use the Service Role Key only for authorized backend operations
4. WHEN database queries execute THEN the Booking System SHALL enforce security policies regardless of the access method

### Requirement 5

**User Story:** As a developer, I want to test Edge Functions locally, so that I can develop and debug before deploying to production.

#### Acceptance Criteria

1. WHEN developing locally THEN the Booking System SHALL provide a command to serve Edge Functions on localhost
2. WHEN local testing occurs THEN the Edge Function SHALL access the local Supabase instance
3. WHEN debugging is needed THEN the Booking System SHALL provide logs and error messages for Edge Function execution
4. WHEN local development is complete THEN the Booking System SHALL allow deployment to production without committing function code

### Requirement 6

**User Story:** As a frontend developer, I want to call Edge Functions securely, so that booking operations work without exposing sensitive keys.

#### Acceptance Criteria

1. WHEN the frontend makes a booking request THEN the Booking System SHALL call the Edge Function endpoint with the user's JWT token
2. WHEN authentication is required THEN the Booking System SHALL include the JWT in the Authorization header
3. WHEN the Edge Function responds THEN the Booking System SHALL return booking results without exposing internal implementation
4. WHEN API calls are made THEN the Booking System SHALL NOT send the Service Role Key to the client

### Requirement 7

**User Story:** As a system owner, I want to restrict repository usage, so that others cannot freely use my code for commercial purposes.

#### Acceptance Criteria

1. WHEN the Repository is published THEN the Booking System SHALL include a restrictive license file
2. WHEN users view the Repository THEN the Booking System SHALL display clear usage restrictions
3. WHEN licensing is applied THEN the Booking System SHALL use "All Rights Reserved" or equivalent non-permissive terms
4. WHEN the LICENSE file exists THEN the Booking System SHALL explicitly prohibit unauthorized commercial use

### Requirement 8

**User Story:** As a system administrator, I want to deploy Edge Functions without repository commits, so that my serverless code remains private.

#### Acceptance Criteria

1. WHEN deploying Edge Functions THEN the Booking System SHALL use Supabase CLI to deploy directly from local files
2. WHEN deployment occurs THEN the Booking System SHALL authenticate using project reference credentials
3. WHEN Edge Functions are updated THEN the Booking System SHALL deploy changes without requiring Git commits
4. WHEN deployment completes THEN the Booking System SHALL confirm successful deployment and provide the function URL

### Requirement 9

**User Story:** As a system owner, I want to obfuscate database structure from TypeScript types, so that the schema cannot be inferred from type definitions.

#### Acceptance Criteria

1. WHEN TypeScript types are defined THEN the Booking System SHALL use generic or minimal type definitions in the public Repository
2. WHEN database types are needed THEN the Booking System SHALL generate them locally and exclude them from Git
3. WHEN the Repository is inspected THEN the Booking System SHALL NOT reveal complete database table structures through type files
4. WHEN types are committed THEN the Booking System SHALL only include minimal interface definitions required for frontend functionality

### Requirement 10

**User Story:** As a system owner, I want to migrate critical API routes to Edge Functions, so that server-side logic is not exposed in the repository.

#### Acceptance Criteria

1. WHEN booking operations are performed THEN the Booking System SHALL execute them through Edge Functions instead of Next.js API routes
2. WHEN admin operations are performed THEN the Booking System SHALL execute them through Edge Functions with proper authentication
3. WHEN the Repository contains API routes THEN the Booking System SHALL only include public endpoints that proxy to Edge Functions
4. WHEN critical business logic is needed THEN the Booking System SHALL implement it in Edge Functions rather than in Repository code

### Requirement 11

**User Story:** As a system owner, I want to implement request validation and rate limiting, so that unauthorized access attempts are blocked.

#### Acceptance Criteria

1. WHEN Edge Functions receive requests THEN the Booking System SHALL validate request signatures or tokens
2. WHEN multiple requests are received from the same source THEN the Booking System SHALL enforce rate limiting
3. WHEN invalid requests are detected THEN the Booking System SHALL reject them without revealing system details
4. WHEN authentication fails THEN the Booking System SHALL log the attempt and return generic error messages

### Requirement 12

**User Story:** As a system owner, I want to add obfuscation to frontend code, so that API endpoints and logic are harder to analyze.

#### Acceptance Criteria

1. WHEN the Booking System is built for production THEN the Booking System SHALL minify and obfuscate JavaScript code
2. WHEN API calls are made THEN the Booking System SHALL use environment variables for endpoint URLs
3. WHEN the frontend is deployed THEN the Booking System SHALL remove source maps from production builds
4. WHEN code is inspected THEN the Booking System SHALL make reverse engineering significantly more difficult through obfuscation
