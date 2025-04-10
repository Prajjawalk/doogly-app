// multichain-donation-v2/src/app/api/fetchContractAddress/route.ts
import { NextResponse } from "next/server";

export const revalidate = 1;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ein = searchParams.get("ein");

  if (!ein) {
    return NextResponse.json({ error: "EIN is required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.endaoment.org/v1/orgs/ein/${ein}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch contract address");
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
