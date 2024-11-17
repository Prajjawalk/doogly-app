import mongoose, { Document, Schema } from "mongoose";

// Define the interface for the Campaign document
export interface ICampaign extends Document {
  destinationChain: string;
  destinationAddress: string;
  splitsAddress: string;
  hypercertFractionId: string;
  modalTitle: string;
  poolId: number;
}

// Create the Campaign schema
const CampaignSchema: Schema = new Schema(
  {
    destinationChain: { type: String, required: true },
    destinationAddress: { type: String, required: true },
    splitsAddress: { type: String, required: true },
    hypercertFractionId: { type: String, required: true },
    modalTitle: { type: String, required: false },
    poolId: { type: Number, required: false },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  }
);

// Create the Campaign model
const createCampaignModel = (mongooseInstance: typeof mongoose) => {
  return (
    mongooseInstance.models.Campaign ||
    mongooseInstance.model("Campaign", CampaignSchema)
  );
};

export default createCampaignModel;
