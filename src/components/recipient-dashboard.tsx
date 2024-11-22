// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { Plus, ChevronRight, Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWalletClient,
  useWriteContract,
} from "wagmi";
import { getChains } from "@wagmi/core";
import { useHypercertClient } from "@/hooks/useHypercertClient";
import { TransferRestrictions, formatHypercertData } from "@hypercerts-org/sdk";
import { graphql } from "@/lib/graphql";
import request from "graphql-request";

// Add this import at the top with other imports
import Image from "next/image";
import { config } from "@/wagmi";
import { createPublicClient, getContract, http, PublicClient } from "viem";

export function RecipientDashboardComponent() {
  const account = useAccount();
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isWidgetDialogOpen, setIsWidgetDialogOpen] = useState(false);
  const [isCampaignDetailsOpen, setIsCampaignDetailsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  // Add new state variables
  const [txId, setTxId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  // Add new state variable for the allocation modal
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState(null);
  const [receivingChain, setReceivingChain] = useState("");
  const [receiverAddress, setReceiverAddress] = useState(
    account.address as string
  );
  const [alloPoolId, setAlloPoolId] = useState(0);
  const [donationTitle, setDonationTitle] = useState("");
  const [hcApproved, setHcApproved] = useState(false);
  const hyperminterWrite = useWriteContract();

  // Sample data for crypto addresses and ENS names
  const cryptoAddresses = [
    {
      address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    },
    {
      address: "raffle.eth",
    },
    {
      address: "prajjawal.eth",
    },
    {
      address: "0x342d34Cc6634C0532925a3b844Bc454e4438f44e",
    },
    // Add more addresses and ENS names as needed
  ];

  const hyperMinterABI = [
    {
      inputs: [
        { internalType: "address", name: "account", type: "address" },
        { internalType: "address", name: "operator", type: "address" },
      ],
      name: "isApprovedForAll",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "operator", type: "address" },
        { internalType: "bool", name: "approved", type: "bool" },
      ],
      name: "setApprovalForAll",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];

  function getChainParams(chain: string) {
    const chains = {
      ["optimism"]: {
        chainId: "0xA",
        chainName: "Optimism",
        AxelarChainName: "optimism",
        nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
        rpcUrls: ["https://mainnet.optimism.io"],
        blockExplorerUrls: ["https://optimistic.etherscan.io"],
        swapperBridgerContract: "0x8a4c14d50c43363a28647188534db7004112091c",
        hyperMinter: "0x822F17A9A5EeCFd66dBAFf7946a8071C265D1d07",
      },
      ["base"]: {
        chainId: "0x2105",
        chainName: "Base",
        AxelarChainName: "base",
        nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
        rpcUrls: ["https://mainnet.base.org"],
        blockExplorerUrls: ["https://basescan.org"],
        swapperBridgerContract: "0xeD99908D0697C408b26Ba35fE0800e565042c858",
        hyperMinter: "0xC2d179166bc9dbB00A03686a5b17eCe2224c2704",
      },
      ["celo"]: {
        chainId: "0xA4EC",
        chainName: "Celo",
        AxelarChainName: "celo",
        nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
        rpcUrls: ["https://forno.celo.org"],
        blockExplorerUrls: ["https://explorer.celo.org"],
        swapperBridgerContract: "0x1e1461464852d6fbf8a19097d14408d657d49457",
        hyperMinter: "0x16bA53B74c234C870c61EFC04cD418B8f2865959",
      },
      ["arbitrum"]: {
        chainId: "0xa4b1",
        chainName: "Arbitrum",
        AxelarChainName: "arbitrum",
        nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
        rpcUrls: ["https://arb1.arbitrum.io/rpc"],
        blockExplorerUrls: ["https://arbiscan.io"],
        swapperBridgerContract: "0x51d952a5a93e73096b9b6f807ec37aa7a2fc52da",
        hyperMinter: "0x822F17A9A5EeCFd66dBAFf7946a8071C265D1d07",
      },
    };
    return chains[chain];
  }

  // Add this function to handle allocation logic
  const handleAllocateFunds = (address: string) => {
    console.log("Allocating funds to:", address);
    // Implement your allocation logic here
  };

  async function getHypercertsOfUser(walletAddress: string) {
    const query = graphql(`
      query MyQuery {
        hypercerts(
          where: {fractions: {owner_address: {eq: "${walletAddress}"}}}
        ) {
          data {
            contract {
              chain_id
            }
            hypercert_id
            fractions {
              count
              data {
                metadata {
                  id
                  name
                  description
                  external_url
                  impact_scope
                  impact_timeframe_from
                  impact_timeframe_to
                  work_timeframe_from
                  work_timeframe_to
                }
                units
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

    res.hypercerts.data.map((d) => {
      let totalUnits = 0;
      d.fractions.data.map((i) => (totalUnits = totalUnits + Number(i.units)));
      d["totalUnits"] = totalUnits;
    });

    return res.hypercerts.data;
  }

  const { client } = useHypercertClient();

  const generateWidgetCode = () => {
    return `<DooglyDonateButton
    buttonText="Donate Now"
    modalTitle="${donationTitle}"
    config={{
      destinationChain: "${receivingChain}",
      destinationAddress: "${
        getChainParams(receivingChain)?.swapperBridgerContract
      }",
      splitsAddress: "${receiverAddress}",
      hypercertFractionId: "${selectedCampaign?.hypercert_id.split("-")[2]}",
      poolId: ${alloPoolId},
    }}
    buttonClassName="<YOUR-DONATE-BUTTON-CSS>"
  />`;
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
        workTimeframeStart: campaignForm.workTimeframeStart.getTime() / 1000,
        workTimeframeEnd: campaignForm.workTimeframeEnd.getTime() / 1000,
        impactTimeframeStart:
          campaignForm.impactTimeframeStart.getTime() / 1000,
        impactTimeframeEnd: campaignForm.impactTimeframeEnd.getTime() / 1000,
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
        totalUnits: BigInt(campaignForm.goal) * 10n ** 6n,
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

  const handleUpdateInfo = async () => {
    const inputs = {
      destinationAddress: getChainParams(receivingChain).swapperBridgerContract,
      destinationChain: receivingChain,
      splitsAddress: receiverAddress,
      hypercertFractionId: selectedCampaign?.hypercert_id.split("-")[2],
      modalTitle: donationTitle,
      poolId: alloPoolId,
    };

    // Add the POST request to send the inputs to /api
    const response = await fetch("/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inputs),
    });
  };

  const publicClient = usePublicClient({
    chainId: account.chainId,
  });

  const chainContracts: Record<number, any> = {
    10: {
      chainId: "0xA",
      chainName: "Optimism",
      AxelarChainName: "optimism",
      nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
      rpcUrls: ["https://mainnet.optimism.io"],
      blockExplorerUrls: ["https://optimistic.etherscan.io"],
      swapperBridgerContract: "0x8a4c14d50c43363a28647188534db7004112091c",
      hyperMinter: "0x822F17A9A5EeCFd66dBAFf7946a8071C265D1d07",
    },
    8453: {
      chainId: "0x2105",
      chainName: "Base",
      AxelarChainName: "base",
      nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
      rpcUrls: ["https://mainnet.base.org"],
      blockExplorerUrls: ["https://basescan.org"],
      swapperBridgerContract: "0xeD99908D0697C408b26Ba35fE0800e565042c858",
      hyperMinter: "0xC2d179166bc9dbB00A03686a5b17eCe2224c2704",
    },
    42220: {
      chainId: "0xA4EC",
      chainName: "Celo",
      AxelarChainName: "celo",
      nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
      rpcUrls: ["https://forno.celo.org"],
      blockExplorerUrls: ["https://explorer.celo.org"],
      swapperBridgerContract: "0x1e1461464852d6fbf8a19097d14408d657d49457",
      hyperMinter: "0x16bA53B74c234C870c61EFC04cD418B8f2865959",
    },
    42161: {
      chainId: "0xa4b1",
      chainName: "Arbitrum",
      AxelarChainName: "arbitrum",
      nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
      rpcUrls: ["https://arb1.arbitrum.io/rpc"],
      blockExplorerUrls: ["https://arbiscan.io"],
      swapperBridgerContract: "0x51d952a5a93e73096b9b6f807ec37aa7a2fc52da",
      hyperMinter: "0x822F17A9A5EeCFd66dBAFf7946a8071C265D1d07",
    },
  };

  useEffect(() => {
    getHypercertsOfUser(account.address as string).then((total) => {
      const filteredTotal = total.filter(
        (t: any) => t.fractions.data[0].metadata != null
      );
      const uniqueHypercerts = new Map();
      filteredTotal.forEach((item) => {
        uniqueHypercerts.set(item.hypercert_id, item);
      });
      setCampaigns(Array.from(uniqueHypercerts.values()));
    });

    const checkApproved = async () => {
      if (account.chainId) {
        const hyperMinterContract = getContract({
          address: chainContracts[account.chainId].hyperMinter,
          abi: hyperMinterABI,
          client: {
            public: publicClient as PublicClient,
          },
        });

        const isApproved = await hyperMinterContract.read.isApprovedForAll([
          account.address,
          chainContracts[account.chainId].swapperBridgerContract,
        ]);

        setHcApproved(isApproved as boolean);
      }
    };

    checkApproved();
  }, [account, receivingChain]);

  useEffect(() => {
    const getDonationDetails = async () => {
      try {
        const response = await fetch(
          `/api?id=${selectedCampaign?.hypercert_id.split("-")[2]}`
        );
        const data = await response.json();
        setReceivingChain(data.destinationChain);
        setReceiverAddress(data.splitsAddress);
        setDonationTitle(data.modalTitle);
        setAlloPoolId(data.poolId);
      } catch (e) {
        setReceiverAddress("");
        setDonationTitle("");
        setAlloPoolId(0);
      }
    };

    if (selectedCampaign?.hypercert_id.split("-")[2]) {
      getDonationDetails();
    }
  }, [selectedCampaign]);

  const getChainNameById = (id: number) => {
    const chains = getChains(config);

    const chain = chains.find((chain) => chain.id === Number(id));

    return chain ? chain.name : id;
  };

  const approveHcTransfer = async () => {
    await hyperminterWrite.writeContractAsync({
      abi: hyperMinterABI,
      address: chainContracts[account.chainId ?? 10].hyperMinter,
      functionName: "setApprovalForAll",
      args: [
        chainContracts[account.chainId ?? 10].swapperBridgerContract,
        true,
      ],
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="flex justify-between items-center mb-8">
          <div className="text-4xl font-bold text-white items-center flex gap-2">
            <Image
              src="/doogly-logo.png" // Make sure to add your logo file to the public directory
              alt="Doogly Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            Doogly
          </div>
          <div>
            <ConnectButton />
          </div>
        </h1>

        {!account.isConnected ? (
          <>
            <div className="text-xl font-semibold text-white">
              Please Connect Wallet to Proceed
            </div>
          </>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white">
                Your Campaigns
              </h2>
              {!hcApproved ? (
                <Button
                  onClick={() => approveHcTransfer()}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Approve Hypercert Transfer
                </Button>
              ) : null}
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
                              // value={campaignForm.name}
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
                              // value={campaignForm.description}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="goal" className="text-right">
                              Goal (USD)
                            </Label>
                            <Input
                              id="goal"
                              type="number"
                              className="col-span-3"
                              // value={campaignForm.goal}
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
                              // value={campaignForm.address}
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
                              // value={campaignForm.image}
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
                              // value={campaignForm.impactScope}
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
                              // value={campaignForm.excludedImpactScope.join(
                              //   ", "
                              // )}
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
                              // value={campaignForm.workScope.join(", ")}
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
                              // value={campaignForm.excludedWorkScope.join(", ")}
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
                              // value={
                              //   campaignForm.workTimeframeStart
                              //     .toISOString()
                              //     .split("T")[0]
                              // }
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
                              // value={
                              //   campaignForm.workTimeframeEnd
                              //     .toISOString()
                              //     .split("T")[0]
                              // }
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
                              // value={
                              //   campaignForm.impactTimeframeStart
                              //     .toISOString()
                              //     .split("T")[0]
                              // }
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
                              // value={
                              //   campaignForm.impactTimeframeEnd
                              //     .toISOString()
                              //     .split("T")[0]
                              // }
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
                              // value={campaignForm.contributors.join(", ")}
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
                              // value={campaignForm.rights.join(", ")}
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
                              // value={campaignForm.excludedRights.join(", ")}
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
            {campaigns != null ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaigns.map((campaign) => (
                  <Card
                    key={campaign.fractions.data[0].metadata.id}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 transition-all cursor-pointer"
                  >
                    <CardHeader>
                      <CardTitle className="text-purple-700">
                        {campaign.fractions.data[0].metadata.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {campaign.fractions.data[0].metadata.description}
                        </p>

                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-500">Received</p>
                            <p className="text-2xl font-bold text-green-600">
                              {(
                                (campaign.totalUnits -
                                  campaign.fractions.data[0].units) /
                                10 ** 6
                              ).toFixed(3)}{" "}
                              USD
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Goal</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {campaign.totalUnits / 10 ** 6} USD
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full"
                            style={{
                              width: `${
                                ((campaign.totalUnits -
                                  campaign.fractions.data[0].units) /
                                  campaign.totalUnits) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>

                        <div className="flex justify-between text-sm text-gray-500">
                          <span>
                            Chain:{" "}
                            {getChainNameById(campaign.contract.chain_id)}
                          </span>
                          <span>
                            {campaign.fractions.data.length - 1} Contributors
                          </span>
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
            ) : null}
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
              <DialogTitle>
                {selectedCampaign?.fractions.data[0].metadata.name}
              </DialogTitle>
              <DialogDescription className="mt-2">
                {selectedCampaign?.fractions.data[0].metadata.description}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Received</Label>
                <span className="col-span-3 text-green-600 font-semibold">
                  {(
                    (selectedCampaign?.totalUnits -
                      selectedCampaign?.fractions.data[0].units) /
                    10 ** 6
                  ).toFixed(3)}{" "}
                  USD
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Goal</Label>
                <span className="col-span-3 text-blue-600 font-semibold">
                  {selectedCampaign?.totalUnits / 10 ** 6} USD
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Chain</Label>
                <span className="col-span-3">
                  {getChainNameById(selectedCampaign?.contract.chain_id)}
                </span>
              </div>
              {/* <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Address</Label>
                <code className="col-span-3 bg-gray-100 px-2 py-1 rounded text-sm">
                  {selectedCampaign?.address}
                </code>
              </div> */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Duration</Label>
                <span className="col-span-3">
                  {new Date(
                    selectedCampaign?.fractions.data[0].metadata
                      .impact_timeframe_from * 1000
                  ).toLocaleDateString()}{" "}
                  to{" "}
                  {new Date(
                    selectedCampaign?.fractions.data[0].metadata
                      .impact_timeframe_to * 1000
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Contributors</Label>
                <span className="col-span-3">
                  {selectedCampaign?.fractions.data.length - 1}
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
                      ((selectedCampaign?.totalUnits -
                        selectedCampaign?.fractions.data[0].units) /
                        selectedCampaign?.totalUnits) *
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
              {/* <Button
                onClick={() => setIsAllocationModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white ml-2"
              >
                Allocate Funds
              </Button> */}
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

            {/* New input fields for allocation details */}
            <div className="mt-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="destinationChain" className="text-right">
                    Receiving Chain
                  </Label>
                  <select
                    id="destinationChain"
                    className="col-span-3"
                    placeholder="Select destination chain"
                    onChange={(e) => setReceivingChain(e.target.value)}
                    defaultValue={receivingChain}
                  >
                    <option value="">Select a chain</option>
                    <option value="optimism">Optimism</option>
                    <option value="base">Base</option>
                    <option value="celo">Celo</option>
                    <option value="arbitrum">Arbitrum</option>
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="receiverAddress" className="text-right">
                    Receiver Address
                  </Label>
                  <Input
                    id="receiverAddress"
                    className="col-span-3"
                    placeholder="Enter receiver address"
                    defaultValue={receiverAddress}
                    onChange={(e) => setReceiverAddress(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="allocationPoolId" className="text-right">
                    Allo Pool ID (optional)
                  </Label>
                  <Input
                    id="allocationPoolId"
                    className="col-span-3"
                    placeholder="Enter allocation pool ID"
                    type="number"
                    onChange={(e) => setAlloPoolId(parseInt(e.target.value))}
                    defaultValue={alloPoolId}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="donationTitle" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="donationTitle"
                    className="col-span-3"
                    placeholder="Enter title"
                    onChange={(e) => setDonationTitle(e.target.value)}
                    defaultValue={donationTitle}
                  />
                </div>
                <Button
                  onClick={() => handleUpdateInfo()}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Update Info
                </Button>
              </div>
            </div>

            {receiverAddress ? (
              <div>
                <div className="mt-4">
                  <Label htmlFor="widget-code" className="sr-only">
                    Widget Code
                  </Label>
                  <pre className="p-4 bg-gray-100 rounded-md overflow-x-auto max-w-[450px] mx-auto">
                    <code
                      id="widget-code"
                      className="text-sm whitespace-pre-wrap break-all"
                    >
                      npm i @doogly/doogly-donate-component
                    </code>
                  </pre>
                </div>
                <div className="mt-4">
                  <Label htmlFor="widget-code" className="sr-only">
                    Widget Code
                  </Label>
                  <pre className="p-4 bg-gray-100 rounded-md overflow-x-auto max-w-[450px] mx-auto">
                    <code
                      id="widget-code"
                      className="text-sm whitespace-pre-wrap break-all"
                    >
                      {generateWidgetCode()}
                    </code>
                  </pre>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                Please fill the above details to view the widget
              </div>
            )}
            <DialogFooter className="mt-6">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(generateWidgetCode());
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
        <Dialog
          open={isAllocationModalOpen}
          onOpenChange={setIsAllocationModalOpen}
        >
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Allocate Funds</DialogTitle>
              <DialogDescription>
                Select a crypto address or ENS name to allocate funds.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <ul className="space-y-2">
                {cryptoAddresses.map((item, index) => (
                  <li key={index} className="flex items-center">
                    <input
                      type="radio"
                      name="allocationAddress"
                      id={`address-${index}`}
                      value={item.address}
                      onChange={() => handleAllocateFunds(item.address)}
                      className="mr-2"
                    />
                    <label htmlFor={`address-${index}`}>{item.address}</label>
                  </li>
                ))}
              </ul>
            </div>
            <DialogFooter>
              <Button variant="outline">Allocate</Button>
              <Button
                onClick={() => setIsAllocationModalOpen(false)}
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
