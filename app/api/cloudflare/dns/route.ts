import { NextRequest, NextResponse } from "next/server";
import { getDNSRecords, createDNSRecord, updateDNSRecord, deleteDNSRecord } from "@/lib/cloudflare-client";

/**
 * GET /api/cloudflare/dns
 * List DNS records for a zone
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get("zoneId");
    const type = searchParams.get("type");

    if (!zoneId) {
      return NextResponse.json(
        { error: "Missing zoneId parameter" },
        { status: 400 }
      );
    }

    const records = await getDNSRecords(zoneId, type || undefined);
    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error("[v0] DNS GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch DNS records" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cloudflare/dns
 * Create new DNS record
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { zoneId, record } = body;

    if (!zoneId || !record) {
      return NextResponse.json(
        { error: "Missing zoneId or record data" },
        { status: 400 }
      );
    }

    const result = await createDNSRecord(zoneId, record);
    return NextResponse.json({ success: true, record: result });
  } catch (error) {
    console.error("[v0] DNS POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create DNS record" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cloudflare/dns
 * Update DNS record
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { zoneId, recordId, record } = body;

    if (!zoneId || !recordId || !record) {
      return NextResponse.json(
        { error: "Missing zoneId, recordId, or record data" },
        { status: 400 }
      );
    }

    const result = await updateDNSRecord(zoneId, recordId, record);
    return NextResponse.json({ success: true, record: result });
  } catch (error) {
    console.error("[v0] DNS PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update DNS record" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cloudflare/dns
 * Delete DNS record
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get("zoneId");
    const recordId = searchParams.get("recordId");

    if (!zoneId || !recordId) {
      return NextResponse.json(
        { error: "Missing zoneId or recordId parameter" },
        { status: 400 }
      );
    }

    await deleteDNSRecord(zoneId, recordId);
    return NextResponse.json({ success: true, message: "DNS record deleted" });
  } catch (error) {
    console.error("[v0] DNS DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete DNS record" },
      { status: 500 }
    );
  }
}
