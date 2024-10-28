"use client";

import { useEffect, useState } from "react";
import { Wallet, Plus, ChevronRight, Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useHypercertClient } from "@/hooks/useHypercertClient";
import { TransferRestrictions, formatHypercertData } from "@hypercerts-org/sdk";
import { graphql } from "@/lib/graphql";
import request from "graphql-request";
// Mock data for active campaigns
const activeCampaigns = [
  {
    id: 1,
    name: "Save the Forests",
    description: "Help us plant 10,000 trees in the Amazon rainforest",
    totalReceived: 1.5,
    goal: 5,
    chain: "Base",
    address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "Active",
    contributors: 25,
  },
  {
    id: 2,
    name: "Clean Ocean Initiative",
    description: "Removing plastic waste from the Pacific Ocean",
    totalReceived: 0.8,
    goal: 3,
    chain: "Base",
    address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    startDate: "2024-02-15",
    endDate: "2024-08-15",
    status: "Active",
    contributors: 12,
  },
  {
    id: 3,
    name: "Education for All",
    description: "Providing education to children in need",
    totalReceived: 2.2,
    goal: 4,
    chain: "Base",
    address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    startDate: "2024-03-01",
    endDate: "2024-12-31",
    status: "Active",
    contributors: 30,
  },
];

export function RecipientDashboardComponent() {
  const walletAddress = useAccount().address;
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isWidgetDialogOpen, setIsWidgetDialogOpen] = useState(false);
  const [isCampaignDetailsOpen, setIsCampaignDetailsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  // Add new state variables
  const [txId, setTxId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function getHypercertsOfUser(walletAddress: string) {
    const query = graphql(`
      query MyQuery {
        hypercerts(
          where: {fractions: {owner_address: {eq: "${walletAddress}"}}}
        ) {
          data {
            fractions {
              data {
                metadata {
                  name
                }
              }
            }
            units
          }
        }
      }
    `);

    const res = await request(
      process.env.NEXT_PUBLIC_HYPERCERTS_API_URL_GRAPH,
      query
    );
    return res.hypercerts.data;
  }

  const account = useAccount();

  const { client } = useHypercertClient();

  const generateWidgetCode = (campaignId) => {
    return `<button 
    data-campaign-id="${campaignId}" 
    class="crypto-donate-btn"
    style="background-color: #8B5CF6; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;"
  >
    Donate Crypto
  </button>
  <script src="https://your-donation-app-url.com/widget.js"></script>`;
  };

  const createCampaign = async () => {
    setIsCreating(true);
    try {
      const metadata = formatHypercertData({
        name: campaignForm.name,
        description: campaignForm.description,
        image: campaignForm.image,
        version: "1.0",
        impactScope: campaignForm.impactScope as string[],
        excludedImpactScope: campaignForm.excludedImpactScope as string[],
        workScope: campaignForm.workScope as string[],
        excludedWorkScope: campaignForm.excludedWorkScope as string[],
        workTimeframeStart: campaignForm.workTimeframeStart.getTime(),
        workTimeframeEnd: campaignForm.workTimeframeEnd.getTime(),
        impactTimeframeStart: campaignForm.impactTimeframeStart.getTime(),
        impactTimeframeEnd: campaignForm.impactTimeframeEnd.getTime(),
        contributors: [account.address as string, ...campaignForm.contributors],
        rights: [...campaignForm.rights],
        excludedRights: [...campaignForm.excludedRights],
      });
      console.log("calling mintClaim");
      if (!metadata.data) {
        throw new Error("Metadata is null");
      }
      const txId = await client.mintHypercert({
        metaData: metadata.data,
        totalUnits: BigInt(campaignForm.goal),
        transferRestriction: TransferRestrictions.FromCreatorOnly,
      });
      // Set the transaction ID and success state
      setTxId(txId);
      setIsSuccess(true);
    } catch (error) {
      console.error("Error creating campaign:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const [campaignForm, setCampaignForm] = useState({
    name: "",
    description: "",
    goal: 0,
    chain: "",
    address: "",
    image: "",
    impactScope: [] as string[],
    excludedImpactScope: [] as string[],
    workScope: [] as string[],
    excludedWorkScope: [] as string[],
    workTimeframeStart: new Date(),
    workTimeframeEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    impactTimeframeStart: new Date(),
    impactTimeframeEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    contributors: [] as string[],
    rights: [] as string[],
    excludedRights: [] as string[],
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setCampaignForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (id: string, date: Date) => {
    setCampaignForm((prev) => ({ ...prev, [id]: date }));
  };

  // Add this function to handle multi-input changes
  const handleMultiInputChange = (id: string, value: string) => {
    const values = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");
    setCampaignForm((prev) => ({ ...prev, [id]: values }));
  };

  useEffect(() => {
    getHypercertsOfUser(account.address as string).then((total) => {
      console.log("Total hypercerts:", total);
    });
  }, [account.address]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="flex justify-between items-center mb-8">
          <div className="text-4xl font-bold text-white items-center">
            Doogly
          </div>
          <div>
            <ConnectButton />
          </div>
        </h1>

        {!account.isConnected ? (
          <ConnectButton />
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white">
                Active Campaigns
              </h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-green-500 hover:bg-green-600 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Create Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-hidden flex flex-col">
                  {isSuccess ? (
                    <>
                      <DialogHeader>
                        <DialogTitle>
                          Campaign Created Successfully!
                        </DialogTitle>
                        <DialogDescription>
                          Your campaign has been created and the Hypercert has
                          been minted.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label className="font-bold">Transaction ID:</Label>
                        <pre className="mt-2 p-3 bg-gray-100 rounded-md overflow-x-auto">
                          <code>{txId}</code>
                        </pre>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => {
                            setIsSuccess(false);
                            setTxId(null);
                          }}
                        >
                          Close
                        </Button>
                      </DialogFooter>
                    </>
                  ) : (
                    <>
                      <DialogHeader>
                        <DialogTitle>Create New Campaign</DialogTitle>
                        <DialogDescription>
                          Set up your new donation campaign here. You'll be able
                          to mint your Hypercert NFT after creation.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex-grow overflow-y-auto pr-6">
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Name
                            </Label>
                            <Input
                              id="name"
                              className="col-span-3"
                              value={campaignForm.name}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Description
                            </Label>
                            <Input
                              id="description"
                              className="col-span-3"
                              value={campaignForm.description}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="goal" className="text-right">
                              Goal
                            </Label>
                            <Input
                              id="goal"
                              type="number"
                              className="col-span-3"
                              value={campaignForm.goal}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-right">
                              Receiving Address
                            </Label>
                            <Input
                              id="address"
                              className="col-span-3"
                              value={campaignForm.address}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="image" className="text-right">
                              Image URL
                            </Label>
                            <Input
                              id="image"
                              className="col-span-3"
                              value={campaignForm.image}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="impactScope" className="text-right">
                              Impact Scope
                            </Label>
                            <Input
                              id="impactScope"
                              className="col-span-3"
                              value={campaignForm.impactScope.join(", ")}
                              onChange={(e) =>
                                handleMultiInputChange(
                                  "impactScope",
                                  e.target.value
                                )
                              }
                              placeholder="Enter comma-separated impact scopes"
                            />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="excludedImpactScope"
                              className="text-right"
                            >
                              Excluded Impact Scope
                            </Label>
                            <Input
                              id="excludedImpactScope"
                              className="col-span-3"
                              value={campaignForm.excludedImpactScope.join(
                                ", "
                              )}
                              onChange={(e) =>
                                handleMultiInputChange(
                                  "excludedImpactScope",
                                  e.target.value
                                )
                              }
                              placeholder="Enter comma-separated excluded impact scopes"
                            />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="workScope" className="text-right">
                              Work Scope
                            </Label>
                            <Input
                              id="workScope"
                              className="col-span-3"
                              value={campaignForm.workScope.join(", ")}
                              onChange={(e) =>
                                handleMultiInputChange(
                                  "workScope",
                                  e.target.value
                                )
                              }
                              placeholder="Enter comma-separated work scopes"
                            />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="excludedWorkScope"
                              className="text-right"
                            >
                              Excluded Work Scope
                            </Label>
                            <Input
                              id="excludedWorkScope"
                              className="col-span-3"
                              value={campaignForm.excludedWorkScope.join(", ")}
                              onChange={(e) =>
                                handleMultiInputChange(
                                  "excludedWorkScope",
                                  e.target.value
                                )
                              }
                              placeholder="Enter comma-separated excluded work scopes"
                            />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="workTimeframeStart"
                              className="text-right"
                            >
                              Work Timeframe Start
                            </Label>
                            <Input
                              id="workTimeframeStart"
                              type="date"
                              className="col-span-3"
                              value={
                                campaignForm.workTimeframeStart
                                  .toISOString()
                                  .split("T")[0]
                              }
                              onChange={(e) =>
                                handleDateChange(
                                  "workTimeframeStart",
                                  new Date(e.target.value)
                                )
                              }
                            />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="workTimeframeEnd"
                              className="text-right"
                            >
                              Work Timeframe End
                            </Label>
                            <Input
                              id="workTimeframeEnd"
                              type="date"
                              className="col-span-3"
                              value={
                                campaignForm.workTimeframeEnd
                                  .toISOString()
                                  .split("T")[0]
                              }
                              onChange={(e) =>
                                handleDateChange(
                                  "workTimeframeEnd",
                                  new Date(e.target.value)
                                )
                              }
                            />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="impactTimeframeStart"
                              className="text-right"
                            >
                              Impact Timeframe Start
                            </Label>
                            <Input
                              id="impactTimeframeStart"
                              type="date"
                              className="col-span-3"
                              value={
                                campaignForm.impactTimeframeStart
                                  .toISOString()
                                  .split("T")[0]
                              }
                              onChange={(e) =>
                                handleDateChange(
                                  "impactTimeframeStart",
                                  new Date(e.target.value)
                                )
                              }
                            />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="impactTimeframeEnd"
                              className="text-right"
                            >
                              Impact Timeframe End
                            </Label>
                            <Input
                              id="impactTimeframeEnd"
                              type="date"
                              className="col-span-3"
                              value={
                                campaignForm.impactTimeframeEnd
                                  .toISOString()
                                  .split("T")[0]
                              }
                              onChange={(e) =>
                                handleDateChange(
                                  "impactTimeframeEnd",
                                  new Date(e.target.value)
                                )
                              }
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="contributors"
                              className="text-right"
                            >
                              Contributors
                            </Label>
                            <Input
                              id="contributors"
                              className="col-span-3"
                              value={campaignForm.contributors.join(", ")}
                              onChange={(e) =>
                                handleMultiInputChange(
                                  "contributors",
                                  e.target.value
                                )
                              }
                              placeholder="Enter comma-separated addresses"
                            />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="rights" className="text-right">
                              Rights
                            </Label>
                            <Input
                              id="rights"
                              className="col-span-3"
                              value={campaignForm.rights.join(", ")}
                              onChange={(e) =>
                                handleMultiInputChange("rights", e.target.value)
                              }
                              placeholder="Enter comma-separated rights"
                            />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="excludedRights"
                              className="text-right"
                            >
                              Excluded Rights
                            </Label>
                            <Input
                              id="excludedRights"
                              className="col-span-3"
                              value={campaignForm.excludedRights.join(", ")}
                              onChange={(e) =>
                                handleMultiInputChange(
                                  "excludedRights",
                                  e.target.value
                                )
                              }
                              placeholder="Enter comma-separated excluded rights"
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="mt-4">
                        <Button onClick={createCampaign} disabled={isCreating}>
                          {isCreating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create Campaign"
                          )}
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeCampaigns.map((campaign) => (
                <Card
                  key={campaign.id}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 transition-all cursor-pointer"
                >
                  <CardHeader>
                    <CardTitle className="text-purple-700">
                      {campaign.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {campaign.description}
                      </p>

                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500">Received</p>
                          <p className="text-2xl font-bold text-green-600">
                            {campaign.totalReceived} ETH
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Goal</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {campaign.goal} ETH
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full"
                          style={{
                            width: `${
                              (campaign.totalReceived / campaign.goal) * 100
                            }%`,
                          }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Chain: {campaign.chain}</span>
                        <span>{campaign.contributors} Contributors</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setIsCampaignDetailsOpen(true);
                      }}
                    >
                      View Details <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Dialog
          open={isCampaignDetailsOpen}
          onOpenChange={(open) => {
            setIsCampaignDetailsOpen(open);
            if (!open) setSelectedCampaign(null);
          }}
        >
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{selectedCampaign?.name}</DialogTitle>
              <DialogDescription className="mt-2">
                {selectedCampaign?.description}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Received</Label>
                <span className="col-span-3 text-green-600 font-semibold">
                  {selectedCampaign?.totalReceived} ETH
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Goal</Label>
                <span className="col-span-3 text-blue-600 font-semibold">
                  {selectedCampaign?.goal} ETH
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Chain</Label>
                <span className="col-span-3">{selectedCampaign?.chain}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Address</Label>
                <code className="col-span-3 bg-gray-100 px-2 py-1 rounded text-sm">
                  {selectedCampaign?.address}
                </code>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Duration</Label>
                <span className="col-span-3">
                  {selectedCampaign?.startDate} to {selectedCampaign?.endDate}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Contributors</Label>
                <span className="col-span-3">
                  {selectedCampaign?.contributors}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Progress</Label>
                <div className="col-span-3 space-y-2">
                  <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full"
                      style={{
                        width: `${
                          (selectedCampaign?.totalReceived /
                            selectedCampaign?.goal) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {Math.round(
                      (selectedCampaign?.totalReceived /
                        selectedCampaign?.goal) *
                        100
                    )}
                    % of goal reached
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setIsWidgetDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Coins className="mr-2 h-4 w-4" /> Get Donation Widget
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isWidgetDialogOpen} onOpenChange={setIsWidgetDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Donation Widget Code</DialogTitle>
              <DialogDescription>
                Copy and paste this code into your website to display the
                donation button.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <Label htmlFor="widget-code" className="sr-only">
                Widget Code
              </Label>
              <pre className="p-4 bg-gray-100 rounded-md overflow-x-auto max-w-[450px] mx-auto">
                <code
                  id="widget-code"
                  className="text-sm whitespace-pre-wrap break-all"
                >
                  {generateWidgetCode(selectedCampaign?.id)}
                </code>
              </pre>
            </div>
            <DialogFooter className="mt-6">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(
                    generateWidgetCode(selectedCampaign?.id)
                  );
                  // You might want to add a toast notification here
                }}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                Copy to Clipboard
              </Button>
              <Button
                onClick={() => setIsWidgetDialogOpen(false)}
                variant="outline"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
