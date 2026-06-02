import { NextRequest, NextResponse } from 'next/server';

async function getSql() {
  const { getSql: getSqlFromDb } = await import('@/lib/db');
  return getSqlFromDb();
}

export async function GET(request: NextRequest) {
  try {
    const sql = await getSql();
    
    // Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const comments = await sql`
      SELECT id, comment, created_at 
      FROM comments 
      ORDER BY created_at DESC 
      LIMIT 50
    `;

    return NextResponse.json(comments);
  } catch (error) {
    console.error('[v0] Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = await getSql();
    
    const formData = await request.formData();
    const comment = formData.get('comment') as string;

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment cannot be empty' },
        { status: 400 }
      );
    }

    // Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const result = await sql`
      INSERT INTO comments (comment) 
      VALUES (${comment}) 
      RETURNING id, comment, created_at
    `;

    console.log('[v0] Comment inserted:', result);

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('[v0] Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment', details: String(error) },
      { status: 500 }
    );
  }
}
