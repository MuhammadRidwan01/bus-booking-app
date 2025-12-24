-- Validation Script for Schedule Management System Migration
-- This script validates that the migration completed successfully
-- Created: 2025-12-21

-- Create validation results table
CREATE TEMP TABLE validation_results (
    test_name TEXT,
    status TEXT,
    expected_value TEXT,
    actual_value TEXT,
    passed BOOLEAN,
    notes TEXT
);

-- Test 1: Verify no existing bookings need migration
INSERT INTO validation_results (test_name, status, expected_value, actual_value, passed, notes)
SELECT 
    'bookings_without_service_type',
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
    '0',
    COUNT(*)::TEXT,
    COUNT(*) = 0,
    'All bookings should have service_type assigned'
FROM bookings 
WHERE service_type IS NULL;

-- Test 2: Verify schedule templates exist
INSERT INTO validation_results (test_name, status, expected_value, actual_value, passed, notes)
SELECT 
    'schedule_templates_exist',
    CASE WHEN COUNT(*) >= 2 THEN 'PASS' ELSE 'FAIL' END,
    '>=2',
    COUNT(*)::TEXT,
    COUNT(*) >= 2,
    'Should have at least drop-off and pick-up templates'
FROM schedule_templates 
WHERE is_active = true;

-- Test 3: Verify both service types exist
INSERT INTO validation_results (test_name, status, expected_value, actual_value, passed, notes)
SELECT 
    'both_service_types_exist',
    CASE WHEN drop_off_count > 0 AND pick_up_count > 0 THEN 'PASS' ELSE 'FAIL' END,
    'drop_off>0 AND pick_up>0',
    format('drop_off:%s, pick_up:%s', drop_off_count, pick_up_count),
    drop_off_count > 0 AND pick_up_count > 0,
    'Both drop_off and pick_up service types should exist'
FROM (
    SELECT 
        COUNT(CASE WHEN service_type = 'drop_off' THEN 1 END) as drop_off_count,
        COUNT(CASE WHEN service_type = 'pick_up' THEN 1 END) as pick_up_count
    FROM schedule_templates
) counts;

-- Test 4: Verify schedule times exist for templates
INSERT INTO validation_results (test_name, status, expected_value, actual_value, passed, notes)
SELECT 
    'schedule_times_exist',
    CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END,
    '>0',
    COUNT(*)::TEXT,
    COUNT(*) > 0,
    'Schedule times should exist for templates'
FROM schedule_times st
JOIN schedule_templates t ON st.template_id = t.id
WHERE t.is_active = true AND st.is_active = true;

-- Test 5: Verify daily schedules generated
INSERT INTO validation_results (test_name, status, expected_value, actual_value, passed, notes)
SELECT 
    'daily_schedules_generated',
    CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END,
    '>0',
    COUNT(*)::TEXT,
    COUNT(*) > 0,
    'Daily schedules should be generated from templates'
FROM daily_schedules
WHERE is_active = true;

-- Test 6: Verify terminal meeting points
INSERT INTO validation_results (test_name, status, expected_value, actual_value, passed, notes)
SELECT 
    'terminal_meeting_points_complete',
    CASE WHEN COUNT(*) = 6 THEN 'PASS' ELSE 'FAIL' END,
    '6',
    COUNT(*)::TEXT,
    COUNT(*) = 6,
    'Should have all 6 terminal meeting points (1A,1B,1C,2E,2F,3)'
FROM terminal_meeting_points;

-- Test 7: Verify no orphaned schedule times
INSERT INTO validation_results (test_name, status, expected_value, actual_value, passed, notes)
SELECT 
    'no_orphaned_schedule_times',
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
    '0',
    COUNT(*)::TEXT,
    COUNT(*) = 0,
    'No schedule times should exist without valid template'
FROM schedule_times st
LEFT JOIN schedule_templates t ON st.template_id = t.id
WHERE t.id IS NULL;

-- Test 8: Verify service type constraints
INSERT INTO validation_results (test_name, status, expected_value, actual_value, passed, notes)
SELECT 
    'valid_service_types_only',
    CASE WHEN invalid_templates = 0 AND invalid_schedules = 0 THEN 'PASS' ELSE 'FAIL' END,
    'invalid_templates=0 AND invalid_schedules=0',
    format('invalid_templates:%s, invalid_schedules:%s', invalid_templates, invalid_schedules),
    invalid_templates = 0 AND invalid_schedules = 0,
    'Only valid service types (drop_off, pick_up) should exist'
FROM (
    SELECT 
        (SELECT COUNT(*) FROM schedule_templates WHERE service_type NOT IN ('drop_off', 'pick_up')) as invalid_templates,
        (SELECT COUNT(*) FROM daily_schedules WHERE service_type NOT IN ('drop_off', 'pick_up')) as invalid_schedules
) counts;

-- Test 9: Verify Ibis Styles schedules match requirements
INSERT INTO validation_results (test_name, status, expected_value, actual_value, passed, notes)
SELECT 
    'ibis_styles_schedule_times',
    CASE WHEN drop_off_times = 13 AND pick_up_times = 12 THEN 'PASS' ELSE 'FAIL' END,
    'drop_off=13, pick_up=12',
    format('drop_off=%s, pick_up=%s', drop_off_times, pick_up_times),
    drop_off_times = 13 AND pick_up_times = 12,
    'Ibis Styles should have 13 drop-off times and 12 pick-up times'
FROM (
    SELECT 
        COUNT(CASE WHEN st.service_type = 'drop_off' THEN 1 END) as drop_off_times,
        COUNT(CASE WHEN st.service_type = 'pick_up' THEN 1 END) as pick_up_times
    FROM schedule_times times
    JOIN schedule_templates st ON times.template_id = st.id
    WHERE st.hotel = 'ibis_style' AND st.is_active = true AND times.is_active = true
) counts;

-- Test 10: Verify booking constraints are properly set
INSERT INTO validation_results (test_name, status, expected_value, actual_value, passed, notes)
SELECT 
    'booking_constraints_valid',
    CASE WHEN invalid_bookings = 0 THEN 'PASS' ELSE 'FAIL' END,
    '0',
    invalid_bookings::TEXT,
    invalid_bookings = 0,
    'All bookings should have valid service types if not null'
FROM (
    SELECT COUNT(*) as invalid_bookings
    FROM bookings 
    WHERE service_type IS NOT NULL 
      AND service_type NOT IN ('drop_off', 'pick_up')
) counts;

-- Display validation results
SELECT 
    test_name,
    status,
    expected_value,
    actual_value,
    CASE WHEN passed THEN '✓' ELSE '✗' END as result,
    notes
FROM validation_results
ORDER BY 
    CASE WHEN passed THEN 1 ELSE 0 END,  -- Failed tests first
    test_name;

-- Summary
SELECT 
    COUNT(*) as total_tests,
    COUNT(CASE WHEN passed THEN 1 END) as passed_tests,
    COUNT(CASE WHEN NOT passed THEN 1 END) as failed_tests,
    CASE 
        WHEN COUNT(CASE WHEN NOT passed THEN 1 END) = 0 THEN 'ALL TESTS PASSED - MIGRATION SUCCESSFUL'
        ELSE format('MIGRATION VALIDATION FAILED - %s tests failed', COUNT(CASE WHEN NOT passed THEN 1 END))
    END as overall_status
FROM validation_results;

-- Clean up
DROP TABLE validation_results;