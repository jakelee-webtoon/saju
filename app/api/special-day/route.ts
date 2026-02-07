import { NextRequest, NextResponse } from "next/server";

// 특일 정보 API (24절기, 국경일, 기념일 등)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const type = searchParams.get("type") || "all"; // all, holiday, 24divisions, anniversary

  if (!year) {
    return NextResponse.json(
      { error: "year is required" },
      { status: 400 }
    );
  }

  // 서버 사이드 전용 환경변수 (NEXT_PUBLIC_ 접두사 제거로 클라이언트 노출 방지)
  const apiKey = process.env.DATA_API_KEY;
  
  if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const paddedMonth = month ? month.padStart(2, "0") : "";
    const encodedApiKey = encodeURIComponent(apiKey);
    
    // API 엔드포인트 선택
    let endpoint = "";
    switch (type) {
      case "holiday":
        endpoint = "getRestDeInfo"; // 공휴일
        break;
      case "24divisions":
        endpoint = "get24DivisionsInfo"; // 24절기
        break;
      case "anniversary":
        endpoint = "getAnniversaryInfo"; // 기념일
        break;
      case "sundry":
        endpoint = "getSundryDayInfo"; // 잡절 (단오, 한식 등)
        break;
      default:
        endpoint = "get24DivisionsInfo"; // 기본값: 24절기
    }

    const monthParam = paddedMonth ? `&solMonth=${paddedMonth}` : "";
    const url = `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/${endpoint}?solYear=${year}${monthParam}&ServiceKey=${encodedApiKey}&numOfRows=50`;

    const response = await fetch(url);
    const text = await response.text();

    // XML 파싱
    const items: Array<{
      date: string;
      name: string;
      isHoliday: boolean;
      dateKind: string;
    }> = [];

    // 각 item 추출
    const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/g);
    
    for (const match of itemMatches) {
      const itemXml = match[1];
      
      const locdateMatch = itemXml.match(/<locdate>(\d+)<\/locdate>/);
      const dateNameMatch = itemXml.match(/<dateName>([^<]*)<\/dateName>/);
      const isHolidayMatch = itemXml.match(/<isHoliday>([^<]*)<\/isHoliday>/);
      const dateKindMatch = itemXml.match(/<dateKind>([^<]*)<\/dateKind>/);

      if (locdateMatch && dateNameMatch) {
        const locdate = locdateMatch[1];
        items.push({
          date: `${locdate.slice(0, 4)}-${locdate.slice(4, 6)}-${locdate.slice(6, 8)}`,
          name: dateNameMatch[1],
          isHoliday: isHolidayMatch?.[1] === "Y",
          dateKind: dateKindMatch?.[1] || "",
        });
      }
    }

    if (items.length > 0) {
      return NextResponse.json({
        success: true,
        items,
        total: items.length,
      });
    }

    // 에러 확인
    const resultCodeMatch = text.match(/<resultCode>([^<]*)<\/resultCode>/);
    const resultMsgMatch = text.match(/<resultMsg>([^<]*)<\/resultMsg>/);

    return NextResponse.json({
      success: false,
      error: "No data found",
      resultCode: resultCodeMatch?.[1],
      resultMsg: resultMsgMatch?.[1],
    });

  } catch (error) {
    console.error("Special Day API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch special day data", details: String(error) },
      { status: 500 }
    );
  }
}
