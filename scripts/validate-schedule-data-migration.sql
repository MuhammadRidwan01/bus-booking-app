-- Validation Script for Schedule Data Migration (Task 6.2)
-- This script validates that existing schedule data has been properly migrated
-- Created: 2024-12-21
-- Requirements: 1.4, 6.1, 6.2

-- Validation 1: Verify schedule templates are properly classified
SELECT 
    'Schedule Templates Classification' as validation_name,
    CASE 
        WHEN drop_off_count = 1 AND pick_up_count = 1 THEN 'PASS'
        ELSE 'FAIL'
    END as status,
    format('Drop-off templates: %s, Pick-up templates: %s', drop_off_count, pick_up_count) as details
FROM (
    SELECT 
        COUNT(CASE WHEN service_type = 'drop_off' THEN 1 END) as drop_off_count,
        COUNT(CASE WHEN service_type = 'pick_up' THEN 1 END) as pick_up_count
    FROM schedule_templates
    WHERE is_active = true
) counts

UNION ALL

-- Validation 2: Verify Ibis Styles drop-off schedule times match requirements
SELECT 
    'Drop-off Schedule Times' as validation_name,
    CASE 
        WHEN times_match = true THEN 'PASS'
        ELSE 'FAIL'
    END as status,
    format('Expected: 13 times, Actual: %s times', actual_count) as details
FROM (
    SELECT 
        COUNT(*) as actual_count,
        COUNT(*) = 13 as times_match
    FROM schedule_times st
    JOIN schedule_templates t ON st.template_id = t.id
    WHERE t.service_type = 'drop_off' 
      AND t.hotel = 'ibis_style' 
      AND t.is_active = true 
      AND st.is_active = true
) validation

UNION ALL

-- Validation 3: Verify Ibis Styles pick-up schedule times match requirements
SELECT 
    'Pick-up Schedule Times' as validation_name,
    CASE 
        WHEN times_match = true THEN 'PASS'
        ELSE 'FAIL'
    END as status,
    format('Expected: 12 times, Actual: %s times', actual_count) as details
FROM (
    SELECT 
        COUNT(*) as actual_count,
        COUNT(*) = 12 as times_match
    FROM schedule_times st
    JOIN schedule_templates t ON st.template_id = t.id
    WHERE t.service_type = 'pick_up' 
      AND t.hotel = 'ibis_style' 
      AND t.is_active = true 
      AND st.is_active = true
) validation

UNION ALL

-- Validation 4: Verify daily schedules generated from templates
SELECT 
    'Daily Schedules Generated' as validation_name,
    CASE 
        WHEN total_schedules > 0 AND drop_off_schedules > 0 AND pick_up_schedules > 0 THEN 'PASS'
        ELSE 'FAIL'
    END as status,
    format('Total: %s, Drop-off: %s, Pick-up: %s', total_schedules, drop_off_schedules, pick_up_schedules) as details
FROM (
    SELECT 
        COUNT(*) as total_schedules,
        COUNT(CASE WHEN service_type = 'drop_off' THEN 1 END) as drop_off_schedules,
        COUNT(CASE WHEN service_type = 'pick_up' THEN 1 END) as pick_up_schedules
    FROM daily_schedules
    WHERE is_active = true
) counts

UNION ALL

-- Validation 5: Verify schedule data integrity (no orphaned records)
SELECT 
    'Schedule Data Integrity' as validation_name,
    CASE 
        WHEN orphaned_times = 0 AND invalid_daily_schedules = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as status,
    format('Orphaned times: %s, Invalid daily schedules: %s', orphaned_times, invalid_daily_schedules) as details
FROM (
    SELECT 
        (SELECT COUNT(*) FROM schedule_times st 
         LEFT JOIN schedule_templates t ON st.template_id = t.id 
         WHERE t.id IS NULL) as orphaned_times,
        (SELECT COUNT(*) FROM daily_schedules 
         WHERE service_type NOT IN ('drop_off', 'pick_up')) as invalid_daily_schedules
) integrity_check

UNION ALL

-- Validation 6: Verify official Ibis Styles drop-off times are present
SELECT 
    'Official Drop-off Times Present' as validation_name,
    CASE 
        WHEN missing_times = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as status,
    format('Missing official times: %s', missing_times) as details
FROM (
    WITH official_drop_off_times AS (
        SELECT unnest(ARRAY['03:00:00'::time, '04:30:00'::time, '06:00:00'::time, 
                           '07:30:00'::time, '09:00:00'::time, '10:30:00'::time,
                           '12:00:00'::time, '14:00:00'::time, '16:00:00'::time,
                           '18:00:00'::time, '20:00:00'::time, '22:00:00'::time,
                           '00:00:00'::time]) as official_time
    )
    SELECT COUNT(*) as missing_times
    FROM official_drop_off_times ot
    LEFT JOIN (
        SELECT st.departure_time
        FROM schedule_times st
        JOIN schedule_templates t ON st.template_id = t.id
        WHERE t.service_type = 'drop_off' 
          AND t.hotel = 'ibis_style' 
          AND t.is_active = true 
          AND st.is_active = true
    ) actual_times ON ot.official_time = actual_times.departure_time
    WHERE actual_times.departure_time IS NULL
) validation

UNION ALL

-- Validation 7: Verify official Ibis Styles pick-up times are present
SELECT 
    'Official Pick-up Times Present' as validation_name,
    CASE 
        WHEN missing_times = 0 THEN 'PASS'
        ELSE 'FAIL'
    END as status,
    format('Missing official times: %s', missing_times) as details
FROM (
    WITH official_pick_up_times AS (
        SELECT unnest(ARRAY['13:00:00'::time, '14:00:00'::time, '15:00:00'::time,
                           '16:00:00'::time, '17:00:00'::time, '18:00:00'::time,
                           '19:00:00'::time, '20:00:00'::time, '21:00:00'::time,
                           '22:00:00'::time, '23:00:00'::time, '00:00:00'::time]) as official_time
    )
    SELECT COUNT(*) as missing_times
    FROM official_pick_up_times ot
    LEFT JOIN (
        SELECT st.departure_time
        FROM schedule_times st
        JOIN schedule_templates t ON st.template_id = t.id
        WHERE t.service_type = 'pick_up' 
          AND t.hotel = 'ibis_style' 
          AND t.is_active = true 
          AND st.is_active = true
    ) actual_times ON ot.official_time = actual_times.departure_time
    WHERE actual_times.departure_time IS NULL
) validation

UNION ALL

-- Validation 8: Verify daily schedule date range (should cover at least 30 days)
SELECT 
    'Daily Schedule Date Range' as validation_name,
    CASE 
        WHEN date_range_days >= 30 THEN 'PASS'
        ELSE 'FAIL'
    END as status,
    format('Date range: %s days (%s to %s)', date_range_days, min_date, max_date) as details
FROM (
    SELECT 
        (MAX(schedule_date) - MIN(schedule_date))::integer as date_range_days,
        MIN(schedule_date) as min_date,
        MAX(schedule_date) as max_date
    FROM daily_schedules
    WHERE is_active = true
) date_range;