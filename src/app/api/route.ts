import { NextApiRequest, NextApiResponse } from "next";
import CampaignModel from "./models/Campaign";
import mongoose from "@/lib/mongodb"; // Adjust the import based on your project structure

// // Handler for API routes
// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   switch (req.method) {
//     case "GET":
//       return GET(req, res);
//     case "POST":
//       return POST(req, res);
//     default:
//       res.setHeader("Allow", ["GET", "POST"]);
//       res.status(405).end(`Method ${req.method} Not Allowed`);
//   }
// }

// Function to get campaign details
export const GET = async (req: Request) => {
  try {
    const campaignId = new URL(req.url).searchParams.get("id");
    const campaign = await CampaignModel(mongoose).findOne({
      hypercertFractionId: campaignId,
    });
    if (!campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 400,
      });
    }
    return new Response(JSON.stringify(campaign));
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error retrieving campaign" }),
      {
        status: 500,
      }
    );
  }
};

// Function to upsert campaign details
export const POST = async (req: Request) => {
  try {
    const campaignData = await req.json(); // Assuming the campaign data is sent in the request body
    const existingCampaign = await CampaignModel(mongoose).findOne({
      hypercertFractionId: campaignData.hypercertFractionId,
    }); // Check if the campaign exists
    let campaign;
    if (existingCampaign) {
      // Update the existing campaign
      campaign = await CampaignModel(mongoose).findOneAndUpdate(
        { hypercertFractionId: campaignData.hypercertFractionId },
        campaignData,
        { new: true } // Return the updated document
      );
    } else {
      // Create a new campaign
      campaign = await CampaignModel(mongoose).create(campaignData);
    }
    return new Response(JSON.stringify(campaign));
  } catch (error) {
    console.log(error);
    return new Response("Server Error", { status: 500 });
  }
};
