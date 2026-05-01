import { resumeHook } from 'workflow/api'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, data } = body

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing token parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Missing data parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Resume the hook with provided data
    await resumeHook(token, data)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Hook resumed successfully',
        token,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('[API] Hook resume error:', error)

    // Check if error is due to invalid token
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
