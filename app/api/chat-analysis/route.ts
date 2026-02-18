/**
 * @deprecated This endpoint has been moved to /api/chat/analyze-text
 * This file is kept for backward compatibility.
 * 
 * Please use /api/chat/analyze-text instead.
 */
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/chat-analysis
 * @deprecated Use /api/chat/analyze-text instead
 * 
 * This endpoint is kept for backward compatibility.
 * It re-exports the functionality from /api/chat/analyze-text
 */
export async function POST(request: NextRequest) {
  // Import and call the new endpoint handler
  const { POST: analyzeTextPOST } = await import("../chat/analyze-text/route");
  return analyzeTextPOST(request);
}
