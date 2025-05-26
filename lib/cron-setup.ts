import cron from 'node-cron';
import { getSupabaseAdmin } from './supabase-server';
import { supabaseAdmin } from './supabase-admin';
export function setupCronJobs() {
  // Run daily maintenance setiap hari jam 00:05 WIB
  cron.schedule('5 0 * * *', async () => {
    try {
      const supabaseAdmin = await getSupabaseAdmin()
      console.log('Running scheduled daily maintenance...');
      
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/cron/daily-maintenance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`
        }
      });

      const result = await response.json();
      console.log('Daily maintenance result:', result);

    } catch (error) {
      console.error('Cron job failed:', error);
    }
  }, {
    timezone: "Asia/Jakarta"
  });

  // Cleanup expired schedules setiap jam
  cron.schedule('0 * * * *', async () => {
    try {
      const supabaseAdmin = await getSupabaseAdmin()
      const { data, error } = await supabaseAdmin.rpc('cleanup_expired_schedules');
      if (error) {
        console.error('Cleanup error:', error);
      } else {
        console.log('Hourly cleanup completed');
      }
    } catch (error) {
      console.error('Hourly cleanup failed:', error);
    }
  }, {
    timezone: "Asia/Jakarta"
  });

  console.log('Cron jobs initialized', 'time:', Date());
}
