import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseAdmin()
    // Verify cron secret untuk security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('Running daily maintenance...');

    // Execute daily maintenance function
    const { data, error } = await supabase.rpc('daily_maintenance');

    if (error) {
      console.error('Daily maintenance error:', error);
      return Response.json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }

    console.log('Daily maintenance completed successfully');

    return Response.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      message: 'Daily maintenance completed'
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}