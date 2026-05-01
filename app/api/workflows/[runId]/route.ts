import { getRun } from 'workflow/api'

export async function GET(
  req: Request,
  { params }: { params: { runId: string } },
) {
  try {
    const { runId } = params

    if (!runId) {
      return new Response(
        JSON.stringify({ error: 'Missing runId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const run = getRun(runId)

    // Get the run status and return value if available
    try {
      const result = await Promise.race([
        run.returnValue,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000),
        ),
      ])

      return new Response(
        JSON.stringify({
          runId,
          status: 'completed',
          result,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    } catch (error) {
      // Workflow still running or completed without result
      return new Response(
        JSON.stringify({
          runId,
          status: 'running',
          message: 'Workflow is still executing',
        }),
        { status: 202, headers: { 'Content-Type': 'application/json' } },
      )
    }
  } catch (error) {
    console.error('[API] Workflow status error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
