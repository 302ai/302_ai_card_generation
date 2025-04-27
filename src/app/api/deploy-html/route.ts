import ky from "ky";
import { NextResponse } from "next/server";

export async function POST(req: Request): Promise<Response> {
  try {
    const formDataParams = await req.formData();
    const file = formDataParams.get("file");
    const apiKey = formDataParams.get("apiKey") as string;
    const htmlCode = formDataParams.get("htmlCode") as string;
    const validityPeriod = formDataParams.get("validityPeriod") as string;

    let url = "";

    if (htmlCode) {
      const htmlResult = await webserveHtml({ apiKey, htmlCode });
      if (htmlResult?.url) {
        url = htmlResult.url;
      }
    }
    return NextResponse.json({ url });
  } catch (error: any) {
    if (error.response) {
      try {
        const errorData = await error.response.json();
        return NextResponse.json({ ...errorData }, { status: 200 });
      } catch (parseError) {
        return NextResponse.json(
          { message: "Failed to parse error response" },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: error.message || "Unknown error" },
        { status: 400 }
      );
    }
  }
}

const webserveHtml = async (params: { apiKey: string; htmlCode: string }) => {
  const { htmlCode, apiKey } = params;
  const result = (await ky(
    `${process.env.NEXT_PUBLIC_API_URL}/302/webserve/html`,
    {
      method: "post",
      timeout: false,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        html: htmlCode,
        format: "json",
      }),
    }
  ).then((res) => res.json())) as { id: "string"; url: "string" };
  return result;
};
