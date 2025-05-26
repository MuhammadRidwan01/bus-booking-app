import '@/lib/server-init'; 
export async function GET(request: Request) {
  return new Response('Hello World');
}