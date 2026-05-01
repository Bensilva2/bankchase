import { resumeWebhook } from 'workflow/api'

export async function POST(req: Request) {
  try {
    // Extract token from URL query params
    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing token query parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Create a new Request object with the webhook data
    const webookRequest = new Request(req.url, {
      method: 'POST',
      headers: req.headers,
      body: await req.text(),
    })

    // Resume the webhook with the request
    await resumeWebhook(token, webookRequest)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        token,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('[API] Webhook error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const statusCode = errorMessage.includes('not found') ? 404 : 500

    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      { status: statusCode, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
