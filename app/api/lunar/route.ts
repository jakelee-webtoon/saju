import { NextRequest, NextResponse } from "next/server";

// 양력 -> 음력 변환 API
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const day = searchParams.get("day");

  if (!year || !month || !day) {
    return NextResponse.json(
      { error: "year, month, day are required" },
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
    // 월, 일을 2자리로 패딩
    const paddedMonth = month.padStart(2, "0");
    const paddedDay = day.padStart(2, "0");

    // HTTP 사용 (공공데이터포털 API)
    const url = `http://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService/getLunCalInfo?solYear=${year}&solMonth=${paddedMonth}&solDay=${paddedDay}&ServiceKey=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url);
    const text = await response.text();

    // XML 파싱 - camelCase 태그명
    const lunYearMatch = text.match(/<lunYear>(\d+)<\/lunYear>/);
    const lunMonthMatch = text.match(/<lunMonth>(\d+)<\/lunMonth>/);
    const lunDayMatch = text.match(/<lunDay>(\d+)<\/lunDay>/);
    const lunLeapmonthMatch = text.match(/<lunLeapmonth>([^<]*)<\/lunLeapmonth>/);
    const lunSechaMatch = text.match(/<lunSecha>([^<]*)<\/lunSecha>/);
    const lunWolgeonMatch = text.match(/<lunWolgeon>([^<]*)<\/lunWolgeon>/);
    const lunIljinMatch = text.match(/<lunIljin>([^<]*)<\/lunIljin>/);

    if (lunYearMatch && lunMonthMatch && lunDayMatch) {
      return NextResponse.json({
        success: true,
        lunar: {
          year: lunYearMatch[1],
          month: lunMonthMatch[1],
          day: lunDayMatch[1],
          leapMonth: lunLeapmonthMatch?.[1] === "윤",
          ganjiYear: lunSechaMatch?.[1] || "",
          ganjiMonth: lunWolgeonMatch?.[1] || "",
          ganjiDay: lunIljinMatch?.[1] || "",
        },
      });
    }
    
    // 에러 응답 확인
    const resultCodeMatch = text.match(/<resultCode>([^<]*)<\/resultCode>/);
    const resultMsgMatch = text.match(/<resultMsg>([^<]*)<\/resultMsg>/);
    
    return NextResponse.json({
      error: "Failed to parse lunar data",
      resultCode: resultCodeMatch?.[1],
      resultMsg: resultMsgMatch?.[1],
      rawPreview: text.substring(0, 300),
    }, { status: 500 });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lunar data", details: String(error) },
      { status: 500 }
    );
  }
}
