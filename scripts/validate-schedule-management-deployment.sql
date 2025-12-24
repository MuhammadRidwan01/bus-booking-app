-- Schedule Management System - Deployment Validation Script
-- Run this script after deployment to verify all components are working correctly

-- =============================================================================
-- 1. SCHEMA VALIDATION
-- =============================================================================

-- Check that all required tables exist
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    table_name TEXT;
BEGIN
    -- List of required tables
    FOR table_name IN 
        SELECT unnest(ARRAY[
            'schedule_templates',
            'schedule_times', 
            'daily_schedules',
            'terminal_meeting_points',
            'bookings',
            'hotels'
        ])
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = table_name
        ) THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing required tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'All required tables exist ✓';
    END IF;
END $$;

-- Check that service_type column exists in bookings table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'bookings' 
          AND column_name = 'service_type'
    ) THEN
        RAISE EXCEPTION 'Missing service_type column in bookings table';
    ELSE
        RAISE NOTICE 'Bookings table has service_type column ✓';
    END IF;
END $$;

-- Check that terminal_code and meeting_point_id columns exist in bookings table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'bookings' 
          AND column_name = 'terminal_code'
    ) THEN
        RAISE EXCEPTION 'Missing terminal_code column in bookings table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'bookings' 
          AND column_name = 'meeting_point_id'
    ) THEN
        RAISE EXCEPTION 'Missing meeting_point_id column in bookings table';
    END IF;
    
    RAISE NOTICE 'Bookings table has terminal columns ✓';
END $$;

-- =============================================================================
-- 2. DATA VALIDATION
-- =============================================================================

-- Check that schedule templates exist for both service types
DO $$
DECLARE
    drop_off_count INTEGER;
    pick_up_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO drop_off_count 
    FROM schedule_templates 
    WHERE service_type = 'drop_off' AND is_active = true;
    
    SELECT COUNT(*) INTO pick_up_count 
    FROM schedule_templates 
    WHERE service_type = 'pick_up' AND is_active = true;
    
    IF drop_off_count = 0 THEN
        RAISE EXCEPTION 'No active drop-off schedule templates found';
    END IF;
    
    IF pick_up_count = 0 THEN
        RAISE EXCEPTION 'No active pick-up schedule templates found';
    END IF;
    
    RAISE NOTICE 'Schedule templates exist: % drop-off, % pick-up ✓', drop_off_count, pick_up_count;
END $$;

-- Check that daily schedules exist for both service types
DO $$
DECLARE
    drop_off_schedules INTEGER;
    pick_up_schedules INTEGER;
    future_date DATE := CURRENT_DATE + INTERVAL '1 day';
BEGIN
    SELECT COUNT(*) INTO drop_off_schedules 
    FROM daily_schedules 
    WHERE service_type = 'drop_off' 
      AND schedule_date >= future_date 
      AND is_active = true;
    
    SELECT COUNT(*) INTO pick_up_schedules 
    FROM daily_schedules 
    WHERE service_type = 'pick_up' 
      AND schedule_date >= future_date 
      AND is_active = true;
    
    IF drop_off_schedules = 0 THEN
        RAISE EXCEPTION 'No future drop-off daily schedules found';
    END IF;
    
    IF pick_up_schedules = 0 THEN
        RAISE EXCEPTION 'No future pick-up daily schedules found';
    END IF;
    
    RAISE NOTICE 'Daily schedules exist: % drop-off, % pick-up ✓', drop_off_schedules, pick_up_schedules;
END $$;

-- Check that terminal meeting points exist
DO $$
DECLARE
    meeting_point_count INTEGER;
    required_terminals TEXT[] := ARRAY['1A', '1B', '1C', '2E', '2F', '3'];
    existing_terminals TEXT[];
BEGIN
    SELECT COUNT(*) INTO meeting_point_count FROM terminal_meeting_points;
    
    SELECT array_agg(terminal_code ORDER BY terminal_code) INTO existing_terminals 
    FROM terminal_meeting_points;
    
    IF meeting_point_count = 0 THEN
        RAISE EXCEPTION 'No terminal meeting points found';
    END IF;
    
    -- Check that all required terminals exist
    IF NOT (required_terminals <@ existing_terminals) THEN
        RAISE EXCEPTION 'Missing required terminals. Expected: %, Found: %', 
            array_to_string(required_terminals, ', '), 
            array_to_string(existing_terminals, ', ');
    END IF;
    
    RAISE NOTICE 'Terminal meeting points exist: % terminals ✓', meeting_point_count;
END $$;

-- =============================================================================
-- 3. FUNCTION VALIDATION
-- =============================================================================

-- Check that required functions exist
DO $$
DECLARE
    missing_functions TEXT[] := ARRAY[]::TEXT[];
    function_name TEXT;
BEGIN
    FOR function_name IN 
        SELECT unnest(ARRAY[
            'validate_advance_booking',
            'get_available_schedules',
            'increment_schedule_capacity',
            'decrement_schedule_capacity',
            'generate_daily_schedules_from_template'
        ])
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
              AND routine_name = function_name
              AND routine_type = 'FUNCTION'
        ) THEN
            missing_functions := array_append(missing_functions, function_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_functions, 1) > 0 THEN
        RAISE EXCEPTION 'Missing required functions: %', array_to_string(missing_functions, ', ');
    ELSE
        RAISE NOTICE 'All required functions exist ✓';
    END IF;
END $$;

-- Test advance booking validation function
DO $$
DECLARE
    tomorrow_result BOOLEAN;
    today_result BOOLEAN;
BEGIN
    -- Test that tomorrow is valid (should be true)
    SELECT validate_advance_booking(CURRENT_DATE + 1, '10:00:00') INTO tomorrow_result;
    
    -- Test that today is invalid (should be false)
    SELECT validate_advance_booking(CURRENT_DATE, '10:00:00') INTO today_result;
    
    IF NOT tomorrow_result THEN
        RAISE EXCEPTION 'Advance booking validation failed: tomorrow should be valid';
    END IF;
    
    IF today_result THEN
        RAISE EXCEPTION 'Advance booking validation failed: today should be invalid';
    END IF;
    
    RAISE NOTICE 'Advance booking validation function works correctly ✓';
END $$;

-- =============================================================================
-- 4. VIEW VALIDATION
-- =============================================================================

-- Check that required views exist
DO $$
DECLARE
    missing_views TEXT[] := ARRAY[]::TEXT[];
    view_name TEXT;
BEGIN
    FOR view_name IN 
        SELECT unnest(ARRAY[
            'booking_details',
            'available_schedules'
        ])
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.views 
            WHERE table_schema = 'public' AND table_name = view_name
        ) THEN
            missing_views := array_append(missing_views, view_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_views, 1) > 0 THEN
        RAISE EXCEPTION 'Missing required views: %', array_to_string(missing_views, ', ');
    ELSE
        RAISE NOTICE 'All required views exist ✓';
    END IF;
END $$;

-- Test that booking_details view includes service type information
DO $$
DECLARE
    has_service_type BOOLEAN;
    has_terminal_code BOOLEAN;
    has_meeting_point BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'booking_details' 
          AND column_name = 'service_type'
    ) INTO has_service_type;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'booking_details' 
          AND column_name = 'terminal_code'
    ) INTO has_terminal_code;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'booking_details' 
          AND column_name = 'meeting_point_location'
    ) INTO has_meeting_point;
    
    IF NOT (has_service_type AND has_terminal_code AND has_meeting_point) THEN
        RAISE EXCEPTION 'booking_details view missing required columns';
    END IF;
    
    RAISE NOTICE 'booking_details view has all required columns ✓';
END $$;

-- =============================================================================
-- 5. PERFORMANCE VALIDATION
-- =============================================================================

-- Test query performance for service type filtering
DO $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    query_duration INTERVAL;
    record_count INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    -- Test query performance
    SELECT COUNT(*) INTO record_count
    FROM available_schedules 
    WHERE service_type = 'drop_off' 
      AND schedule_date >= CURRENT_DATE;
    
    end_time := clock_timestamp();
    query_duration := end_time - start_time;
    
    IF query_duration > INTERVAL '1 second' THEN
        RAISE WARNING 'Query performance concern: service type filtering took %', query_duration;
    ELSE
        RAISE NOTICE 'Service type query performance acceptable: % for % records ✓', 
            query_duration, record_count;
    END IF;
END $$;

-- =============================================================================
-- 6. INTEGRATION VALIDATION
-- =============================================================================

-- Test get_available_schedules function
DO $$
DECLARE
    drop_off_count INTEGER;
    pick_up_count INTEGER;
BEGIN
    -- Test drop-off schedules
    SELECT COUNT(*) INTO drop_off_count
    FROM get_available_schedules('drop_off', 'ibis_style', NULL);
    
    -- Test pick-up schedules  
    SELECT COUNT(*) INTO pick_up_count
    FROM get_available_schedules('pick_up', 'ibis_style', NULL);
    
    IF drop_off_count = 0 THEN
        RAISE WARNING 'No available drop-off schedules returned by function';
    END IF;
    
    IF pick_up_count = 0 THEN
        RAISE WARNING 'No available pick-up schedules returned by function';
    END IF;
    
    RAISE NOTICE 'get_available_schedules function returns data: % drop-off, % pick-up ✓', 
        drop_off_count, pick_up_count;
END $$;

-- =============================================================================
-- 7. SUMMARY REPORT
-- =============================================================================

-- Generate deployment validation summary
SELECT 
    'DEPLOYMENT VALIDATION SUMMARY' as report_section,
    CURRENT_TIMESTAMP as validation_time;

-- Schedule template summary
SELECT 
    'Schedule Templates' as component,
    service_type,
    COUNT(*) as active_templates,
    MIN(created_at) as oldest_template,
    MAX(created_at) as newest_template
FROM schedule_templates 
WHERE is_active = true
GROUP BY service_type
ORDER BY service_type;

-- Daily schedule summary
SELECT 
    'Daily Schedules' as component,
    service_type,
    COUNT(*) as total_schedules,
    MIN(schedule_date) as earliest_date,
    MAX(schedule_date) as latest_date,
    SUM(capacity) as total_capacity,
    SUM(current_bookings) as total_bookings
FROM daily_schedules 
WHERE is_active = true AND schedule_date >= CURRENT_DATE
GROUP BY service_type
ORDER BY service_type;

-- Terminal meeting points summary
SELECT 
    'Terminal Meeting Points' as component,
    terminal_code,
    location_description,
    arrival_time_offset_min || '-' || arrival_time_offset_max || ' min' as arrival_window
FROM terminal_meeting_points 
ORDER BY terminal_code;

-- Recent bookings by service type (if any exist)
SELECT 
    'Recent Bookings' as component,
    COALESCE(service_type, 'legacy') as service_type,
    COUNT(*) as booking_count,
    COUNT(CASE WHEN terminal_code IS NOT NULL THEN 1 END) as with_terminal,
    COUNT(CASE WHEN meeting_point_id IS NOT NULL THEN 1 END) as with_meeting_point
FROM bookings 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY service_type
ORDER BY service_type;

RAISE NOTICE '=== SCHEDULE MANAGEMENT DEPLOYMENT VALIDATION COMPLETE ===';
RAISE NOTICE 'If no errors were raised above, the deployment is successful ✓';
RAISE NOTICE 'Check the summary tables above for detailed component status';