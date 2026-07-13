import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Initialize S3 client for Cloudflare R2
 */
function initializeR2Client() {
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!accessKeyId || !secretAccessKey || !accountId) {
    throw new Error("Missing Cloudflare R2 credentials");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * GET /api/cloudflare/r2
 * List objects in R2 bucket or get object metadata
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get("bucket");
    const key = searchParams.get("key");

    if (!bucket) {
      return NextResponse.json(
        { error: "Missing bucket parameter" },
        { status: 400 }
      );
    }

    const client = initializeR2Client();

    // If key is provided, generate a signed URL for the object
    if (key) {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
      return NextResponse.json({ success: true, signedUrl });
    }

    // Otherwise, list all objects in bucket
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: 100,
    });

    const response = await client.send(command);
    return NextResponse.json({
      success: true,
      contents: response.Contents || [],
      isTruncated: response.IsTruncated,
    });
  } catch (error) {
    console.error("[v0] R2 GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to access R2" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cloudflare/r2
 * Upload file to R2 bucket (returns signed URL for client-side upload)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bucket, key, contentType } = body;

    if (!bucket || !key) {
      return NextResponse.json(
        { error: "Missing bucket or key parameter" },
        { status: 400 }
      );
    }

    const client = initializeR2Client();

    // Generate signed URL for PUT request
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType || "application/octet-stream",
    });

    const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    return NextResponse.json({
      success: true,
      signedUrl,
      method: "PUT",
      headers: {
        "Content-Type": contentType || "application/octet-stream",
      },
    });
  } catch (error) {
    console.error("[v0] R2 POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cloudflare/r2
 * Delete object from R2 bucket
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get("bucket");
    const key = searchParams.get("key");

    if (!bucket || !key) {
      return NextResponse.json(
        { error: "Missing bucket or key parameter" },
        { status: 400 }
      );
    }

    const client = initializeR2Client();
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await client.send(command);
    return NextResponse.json({ success: true, message: "Object deleted" });
  } catch (error) {
    console.error("[v0] R2 DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete object" },
      { status: 500 }
    );
  }
}
