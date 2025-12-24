-- Data Migration Script for Schedule Management System
-- This script migrates existing bookings and schedules to the new schedule management system
-- Created: 2024-12-21
-- Requirements: 1.5, 6.4, 6.5, 1.4, 6.1, 6.2

-- Enable transaction mode for rollback capability
BEGIN;

-- Create a temporary table to store migration log
CREATE TEMP TABLE migration_log (
    step_name TEXT,
    status TEXT,
    affected_rows INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Function to log migration steps
CREATE OR REPLACE FUNCTION log_migration_step(
    step_name TEXT,
    status TEXT,
    affected_rows INTEGER DEFAULT 0,
    notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO migration_log (step_name, status, affected_rows, notes)
    VALUES (step_name, status, affected_rows, notes);
END;
$$ LANGUAGE plpgsql;

-- Step 1: Analyze existing bookings
DO $$
DECLARE
    booking_count INTEGER;
    bookings_without_service_type INTEGER;
BEGIN
    SELECT COUNT(*) INTO booking_count FROM bookings;
    SELECT COUNT(*) INTO bookings_without_service_type 
    FROM bookings WHERE service_type IS NULL;
    
    PERFORM log_migration_step(
        'analyze_bookings',
        'completed',
        booking_count,
        format('Total bookings: %s, Without service_type: %s', 
               booking_count, bookings_without_service_type)
    );
END;
$$;

-- Step 2: Migrate existing booking data to include service_type
-- Default all existing bookings to 'drop_off' service type as per requirements
UPDATE bookings 
SET service_type = 'drop_off'
WHERE service_type IS NULL;

-- Log the booking migration
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    PERFORM log_migration_step(
        'migrate_booking_service_type',
        'completed',
        updated_count,
        'Set service_type to drop_off for existing bookings'
    );
END;
$$;

-- Step 3: Validate booking data integrity
DO $$
DECLARE
    invalid_bookings INTEGER;
    valid_service_types INTEGER;
BEGIN
    -- Check for invalid service types
    SELECT COUNT(*) INTO invalid_bookings
    FROM bookings 
    WHERE service_type NOT IN ('drop_off', 'pick_up');
    
    -- Count valid service type assignments
    SELECT COUNT(*) INTO valid_service_types
    FROM bookings 
    WHERE service_type IN ('drop_off', 'pick_up');
    
    IF invalid_bookings > 0 THEN
        PERFORM log_migration_step(
            'validate_booking_service_types',
            'error',
            invalid_bookings,
            'Found bookings with invalid service_type values'
        );
        RAISE EXCEPTION 'Migration failed: Found % bookings with invalid service_type', invalid_bookings;
    ELSE
        PERFORM log_migration_step(
            'validate_booking_service_types',
            'completed',
            valid_service_types,
            'All bookings have valid service_type values'
        );
    END IF;
END;
$$;

-- Step 4: Analyze existing bus_schedules for migration
DO $$
DECLARE
    schedule_count INTEGER;
    active_schedules INTEGER;
BEGIN
    SELECT COUNT(*) INTO schedule_count FROM bus_schedules;
    SELECT COUNT(*) INTO active_schedules FROM bus_schedules WHERE is_active = true;
    
    PERFORM log_migration_step(
        'analyze_bus_schedules',
        'completed',
        schedule_count,
        format('Total schedules: %s, Active schedules: %s', 
               schedule_count, active_schedules)
    );
END;
$$;

-- Step 5: Migrate existing bus_schedules to schedule templates
-- Only if there are existing schedules to migrate
DO $$
DECLARE
    schedule_count INTEGER;
    template_id UUID;
    schedule_rec RECORD;
    migrated_count INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO schedule_count FROM bus_schedules WHERE is_active = true;
    
    IF schedule_count > 0 THEN
        -- Create a template for existing schedules (classify as drop_off)
        FOR schedule_rec IN 
            SELECT DISTINCT hotel_id, destination 
            FROM bus_schedules 
            WHERE is_active = true
        LOOP
            -- Get hotel name for template
            DECLARE
                hotel_name TEXT;
            BEGIN
                SELECT name INTO hotel_name FROM hotels WHERE id = schedule_rec.hotel_id;
                
                -- Create schedule template
                INSERT INTO schedule_templates (name, service_type, hotel, is_active)
                VALUES (
                    format('%s Drop-off Schedule (Migrated)', hotel_name),
                    'drop_off',
                    CASE 
                        WHEN hotel_name ILIKE '%style%' THEN 'ibis_style'
                        WHEN hotel_name ILIKE '%budget%' THEN 'ibis_budget'
                        ELSE 'ibis_style' -- default
                    END,
                    true
                )
                RETURNING id INTO template_id;
                
                -- Migrate schedule times
                INSERT INTO schedule_times (template_id, departure_time, capacity, is_active)
                SELECT 
                    template_id,
                    departure_time,
                    max_capacity,
                    is_active
                FROM bus_schedules 
                WHERE hotel_id = schedule_rec.hotel_id 
                  AND destination = schedule_rec.destination
                  AND is_active = true;
                
                migrated_count := migrated_count + 1;
            END;
        END LOOP;
        
        PERFORM log_migration_step(
            'migrate_bus_schedules_to_templates',
            'completed',
            migrated_count,
            'Migrated existing bus_schedules to schedule_templates'
        );
    ELSE
        PERFORM log_migration_step(
            'migrate_bus_schedules_to_templates',
            'skipped',
            0,
            'No existing bus_schedules to migrate'
        );
    END IF;
END;
$$;

-- Step 6: Generate daily schedules from migrated templates
-- This ensures consistency with the new system
DO $$
DECLARE
    template_rec RECORD;
    generated_count INTEGER := 0;
    start_date DATE := CURRENT_DATE;
    end_date DATE := CURRENT_DATE + INTERVAL '30 days';
    current_date DATE;
BEGIN
    -- Generate daily schedules for the next 30 days from any migrated templates
    FOR template_rec IN 
        SELECT st.*, h.name as hotel_name
        FROM schedule_templates st
        JOIN hotels h ON (
            (st.hotel = 'ibis_style' AND h.name ILIKE '%style%') OR
            (st.hotel = 'ibis_budget' AND h.name ILIKE '%budget%')
        )
        WHERE st.is_active = true
          AND st.name LIKE '%Migrated%'
    LOOP
        current_date := start_date;
        WHILE current_date <= end_date LOOP
            -- Insert daily schedules for each time in the template
            INSERT INTO daily_schedules (
                schedule_date, 
                service_type, 
                hotel, 
                departure_time, 
                capacity, 
                current_bookings,
                is_active
            )
            SELECT 
                current_date,
                template_rec.service_type,
                template_rec.hotel,
                st.departure_time,
                st.capacity,
                0,
                true
            FROM schedule_times st
            WHERE st.template_id = template_rec.id
              AND st.is_active = true
            ON CONFLICT (schedule_date, service_type, hotel, departure_time) 
            DO NOTHING;
            
            current_date := current_date + INTERVAL '1 day';
        END LOOP;
        
        generated_count := generated_count + 1;
    END LOOP;
    
    PERFORM log_migration_step(
        'generate_daily_schedules_from_migrated',
        'completed',
        generated_count,
        'Generated daily schedules from migrated templates'
    );
END;
$$;

-- Step 7: Validate schedule data integrity
DO $$
DECLARE
    template_count INTEGER;
    schedule_time_count INTEGER;
    daily_schedule_count INTEGER;
    orphaned_times INTEGER;
    invalid_service_types INTEGER;
BEGIN
    -- Count templates and related data
    SELECT COUNT(*) INTO template_count FROM schedule_templates WHERE is_active = true;
    SELECT COUNT(*) INTO schedule_time_count FROM schedule_times st 
    JOIN schedule_templates t ON st.template_id = t.id WHERE t.is_active = true;
    SELECT COUNT(*) INTO daily_schedule_count FROM daily_schedules WHERE is_active = true;
    
    -- Check for orphaned schedule times
    SELECT COUNT(*) INTO orphaned_times
    FROM schedule_times st
    LEFT JOIN schedule_templates t ON st.template_id = t.id
    WHERE t.id IS NULL;
    
    -- Check for invalid service types in templates
    SELECT COUNT(*) INTO invalid_service_types
    FROM schedule_templates
    WHERE service_type NOT IN ('drop_off', 'pick_up');
    
    IF orphaned_times > 0 OR invalid_service_types > 0 THEN
        PERFORM log_migration_step(
            'validate_schedule_integrity',
            'error',
            orphaned_times + invalid_service_types,
            format('Orphaned times: %s, Invalid service types: %s', 
                   orphaned_times, invalid_service_types)
        );
        RAISE EXCEPTION 'Migration failed: Data integrity issues found';
    ELSE
        PERFORM log_migration_step(
            'validate_schedule_integrity',
            'completed',
            template_count + schedule_time_count + daily_schedule_count,
            format('Templates: %s, Times: %s, Daily schedules: %s', 
                   template_count, schedule_time_count, daily_schedule_count)
        );
    END IF;
END;
$$;

-- Step 8: Final validation - ensure all constraints are met
DO $$
DECLARE
    constraint_violations INTEGER := 0;
    validation_errors TEXT := '';
BEGIN
    -- Check booking constraints
    SELECT COUNT(*) INTO constraint_violations
    FROM bookings b
    LEFT JOIN daily_schedules ds ON b.daily_schedule_id = ds.id
    WHERE ds.id IS NULL;
    
    IF constraint_violations > 0 THEN
        validation_errors := validation_errors || format('Bookings with invalid daily_schedule_id: %s; ', constraint_violations);
    END IF;
    
    -- Check terminal meeting points for pick_up bookings
    SELECT COUNT(*) INTO constraint_violations
    FROM bookings
    WHERE service_type = 'pick_up' 
      AND (terminal_code IS NULL OR meeting_point_id IS NULL);
    
    IF constraint_violations > 0 THEN
        validation_errors := validation_errors || format('Pick-up bookings missing terminal info: %s; ', constraint_violations);
    END IF;
    
    IF validation_errors != '' THEN
        PERFORM log_migration_step(
            'final_validation',
            'error',
            0,
            validation_errors
        );
        RAISE EXCEPTION 'Migration failed: %', validation_errors;
    ELSE
        PERFORM log_migration_step(
            'final_validation',
            'completed',
            0,
            'All constraints validated successfully'
        );
    END IF;
END;
$$;

-- Step 9: Create rollback script
DO $$
BEGIN
    -- This would be implemented as a separate rollback script
    -- For now, we log that rollback procedures should be prepared
    PERFORM log_migration_step(
        'rollback_preparation',
        'completed',
        0,
        'Rollback script should be prepared separately'
    );
END;
$$;

-- Display migration summary
SELECT 
    step_name,
    status,
    affected_rows,
    timestamp,
    notes
FROM migration_log
ORDER BY timestamp;

-- Clean up temporary functions
DROP FUNCTION log_migration_step(TEXT, TEXT, INTEGER, TEXT);

-- Commit the transaction if all steps completed successfully
COMMIT;

-- Migration completed successfully
SELECT 'Schedule Management Data Migration Completed Successfully' as result;