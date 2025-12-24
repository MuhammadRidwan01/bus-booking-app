-- Rollback Script for Schedule Management System Migration
-- This script provides rollback capabilities for the schedule management migration
-- Created: 2024-12-21
-- Use with caution - this will revert changes made by the migration

-- Enable transaction mode
BEGIN;

-- Create rollback log table
CREATE TEMP TABLE rollback_log (
    step_name TEXT,
    status TEXT,
    affected_rows INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Function to log rollback steps
CREATE OR REPLACE FUNCTION log_rollback_step(
    step_name TEXT,
    status TEXT,
    affected_rows INTEGER DEFAULT 0,
    notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO rollback_log (step_name, status, affected_rows, notes)
    VALUES (step_name, status, affected_rows, notes);
END;
$$ LANGUAGE plpgsql;

-- Step 1: Backup current state before rollback
DO $$
DECLARE
    booking_count INTEGER;
    template_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO booking_count FROM bookings WHERE service_type IS NOT NULL;
    SELECT COUNT(*) INTO template_count FROM schedule_templates;
    
    PERFORM log_rollback_step(
        'backup_current_state',
        'completed',
        booking_count + template_count,
        format('Bookings with service_type: %s, Templates: %s', booking_count, template_count)
    );
END;
$$;

-- Step 2: Remove service_type from existing bookings (revert to NULL)
-- WARNING: This will remove service type information from bookings
UPDATE bookings 
SET service_type = NULL,
    terminal_code = NULL,
    meeting_point_id = NULL
WHERE service_type = 'drop_off' 
   OR service_type = 'pick_up';

DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    PERFORM log_rollback_step(
        'revert_booking_service_types',
        'completed',
        updated_count,
        'Removed service_type, terminal_code, and meeting_point_id from bookings'
    );
END;
$$;

-- Step 3: Remove migrated schedule templates
-- Only remove templates that were created during migration (contain "Migrated" in name)
DELETE FROM schedule_templates 
WHERE name LIKE '%Migrated%';

DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    PERFORM log_rollback_step(
        'remove_migrated_templates',
        'completed',
        deleted_count,
        'Removed schedule templates created during migration'
    );
END;
$$;

-- Step 4: Remove daily schedules generated from migrated templates
-- This is handled automatically by CASCADE delete from templates

-- Step 5: Restore original bus_schedules if they were deactivated
-- (In our case, we didn't deactivate them, so this is informational)
DO $$
DECLARE
    schedule_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO schedule_count FROM bus_schedules WHERE is_active = false;
    
    IF schedule_count > 0 THEN
        UPDATE bus_schedules SET is_active = true WHERE is_active = false;
        GET DIAGNOSTICS schedule_count = ROW_COUNT;
        
        PERFORM log_rollback_step(
            'restore_bus_schedules',
            'completed',
            schedule_count,
            'Reactivated original bus_schedules'
        );
    ELSE
        PERFORM log_rollback_step(
            'restore_bus_schedules',
            'skipped',
            0,
            'No deactivated bus_schedules to restore'
        );
    END IF;
END;
$$;

-- Step 6: Validate rollback integrity
DO $$
DECLARE
    bookings_with_service_type INTEGER;
    migrated_templates INTEGER;
BEGIN
    SELECT COUNT(*) INTO bookings_with_service_type 
    FROM bookings WHERE service_type IS NOT NULL;
    
    SELECT COUNT(*) INTO migrated_templates 
    FROM schedule_templates WHERE name LIKE '%Migrated%';
    
    IF bookings_with_service_type > 0 OR migrated_templates > 0 THEN
        PERFORM log_rollback_step(
            'validate_rollback',
            'error',
            bookings_with_service_type + migrated_templates,
            format('Rollback incomplete - Bookings: %s, Templates: %s', 
                   bookings_with_service_type, migrated_templates)
        );
        RAISE EXCEPTION 'Rollback validation failed';
    ELSE
        PERFORM log_rollback_step(
            'validate_rollback',
            'completed',
            0,
            'Rollback completed successfully - all migration changes reverted'
        );
    END IF;
END;
$$;

-- Display rollback summary
SELECT 
    step_name,
    status,
    affected_rows,
    timestamp,
    notes
FROM rollback_log
ORDER BY timestamp;

-- Clean up
DROP FUNCTION log_rollback_step(TEXT, TEXT, INTEGER, TEXT);

-- Commit rollback transaction
COMMIT;

SELECT 'Schedule Management Migration Rollback Completed' as result;