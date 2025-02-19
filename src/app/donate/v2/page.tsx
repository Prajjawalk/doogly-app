// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useLogin, usePrivy, useWallets } from "@privy-io/react-auth";
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
  useWriteContract,
  useSendTransaction,
  useConfig,
} from "wagmi";
import { getContract, PublicClient } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AxelarQueryAPI } from "@axelar-network/axelarjs-sdk";
import {
  ChainType,
  Token,
  ChainData,
  OnChainExecutionData,
} from "@0xsquid/squid-types";
import { readContract } from "wagmi/actions";

const erc20ContractABI = [
  {
    constant: false,
    inputs: [
      {
        name: "_spender",
        type: "address",
      },
      {
        name: "_value",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "_owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "balance",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "_owner",
        type: "address",
      },
      {
        name: "_spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

const uniswapFactoryABI = [
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint24", name: "", type: "uint24" },
    ],
    name: "getPool",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

export default function Page() {
  const account = useAccount();
  const sendDonation = useWriteContract();
  const switchChain = useSwitchChain();
  const erc20Write = useWriteContract();
  const { ready, authenticated } = usePrivy();

  const [initialized, setInitialized] = useState(false);
  const [config, setConfig] = useState();
  const [amount, setDonationAmount] = useState("0");
  const [submitButtonText, setSubmitButtonText] = useState("Donate");
  const [submitButtonDisabled, setSubmitButtonDisabled] = useState(false);
  const [selectedToken, setSelectedToken] = useState("native");
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);
  const [allTokens, setAllTokens] = useState<Token[]>();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [chains, setChains] = useState<ChainData[]>([]);
  const [currentToken, setCurrentToken] = useState<Token>();
  const [currentChainId, setCurrentChainId] = useState<bigint | string>();
  const [params, setParams] = useState();
  const [callback, setCallback] =
    useState<(transactionCallback: transactionCallback) => void>();
  const { wallets } = useWallets();
  const [connected, setConnected] = useState(false);
  const [chainSearchQuery, setChainSearchQuery] = useState("");
  const [tokenSearchQuery, setTokenSearchQuery] = useState("");
  const { login } = useLogin();
  const { sendTransactionAsync } = useSendTransaction();
  const wagmiConfig = useConfig();

  const dooglyApi = process.env.NEXT_PUBLIC_DOOGLY_API;

  useEffect(() => {
    const initialize = async () => {
      const params = new URLSearchParams(window.location.search);
      const toChain = params.get("toChain");
      const toToken = params.get("toToken");
      const toAddress = params.get("toAddress");
      const enableBoost = params.get("enableBoost") === "true";
      const approveSpending = params.get("approveSpending") === "true";

      const postHook = [];
      for (let idx = 0; params.has(`postHook[${idx}].target`); idx++) {
        postHook.push({
          target: params.get(`postHook[${idx}].target`),
          callData: params.get(`postHook[${idx}].callData`),
          callType: parseInt(params.get(`postHook[${idx}].callType`)),
          tokenAddress: params.get(`postHook[${idx}].tokenAddress`),
          inputPos: parseInt(params.get(`postHook[${idx}].inputPos`)),
        });
      }

      // Construct the transaction params
      let txparams = {
        fromAddress: "",
        fromChain: "",
        fromToken: "",
        fromAmount: "",
        toChain: toChain,
        toToken: toToken,
        toAddress: toAddress,
        enableBoost: enableBoost,
        approveSpending: approveSpending,
      };

      if (postHook.length > 0) {
        txparams["postHook"] = {
          chainType: ChainType.EVM,
          calls: postHook.map(
            (i: {
              target: `0x${string}`;
              callData: `0x${string}`;
              callType?: number;
              tokenAddress?: `0x${string}`;
              inputPos?: number;
            }) => {
              return {
                chainType: "evm",
                callType: i.callType ?? 0,
                target: i.target,
                value: "0",
                callData: i.callData,
                payload: {
                  tokenAddress: i.tokenAddress ?? "",
                  inputPos: i.inputPos ?? 0,
                },
                estimatedGas: "50000",
              };
            }
          ),
          provider: "Doogly", //This should be the name of your product or application that is triggering the hook
          description: "Cross-chain donation",
          logoURI: "",
        };
      }

      setParams(txparams);

      const callbackString = params.get("callback");
      const callback: (transactionCallback: transactionCallback) => void = eval(
        `(${callbackString})`
      );
      setCallback(callback);

      const response = await (await fetch(`${dooglyApi}/info`)).json();

      const filteredChains = response.chains.filter(
        (i: ChainData) =>
          i.chainType != ChainType.COSMOS &&
          i.chainType != ChainType.BTC &&
          i.chainType != ChainType.SOLANA
      );

      setAllTokens(response.tokens);
      setChains(rearrangedChains);
    };

    if (!initialized) {
      initialize();
      setInitialized(true);
    }
  });

  useEffect(() => {
    const fetchTokensAndSwitchChain = async (chain: string) => {
      const fromToken = allTokens?.filter(
        (t) => t.chainId === chain.toString()
      );
      setTokens(fromToken ?? []);
      setCurrentToken(fromToken?.[0]);
      const currentChainData = getChainData(chains, chain ?? "1");

      switch (currentChainData.chainType) {
        case ChainType.EVM:
          break;
        case ChainType.SOLANA:
          setConnected(false);
          break;
        case ChainType.BTC:
          setConnected(false);
          break;
      }
    };

    if (chains.length > 1) {
      fetchTokensAndSwitchChain(currentChainId.toString());
    }
  }, [currentChainId]);

  const getChainData = (
    chains: ChainData[],
    chainId: number | string
  ): ChainData | undefined => chains?.find((chain) => chain.chainId == chainId);

  const connectWallet = async () => {
    try {
      login();
      await wallets[0]?.switchChain(parseInt(currentChainId?.toString()));
      setConnected(true);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    }
  };

  // Function to approve the transactionRequest.target to spend fromAmount of fromToken
  const approveSpending = async (
    transactionRequestTarget: string,
    fromToken: string,
    fromAmount: string
  ) => {
    try {
      const erc20Read = await readContract(wagmiConfig, {
        abi: erc20ContractABI,
        address: currentToken?.address as `0x${string}`,
        functionName: "allowance",
        args: [account.address, transactionRequestTarget],
      });

      const currentAllowance = erc20Read as unknown as bigint;

      if (currentAllowance < BigInt(fromAmount)) {
        await erc20Write.writeContractAsync({
          address: fromToken as `0x${string}`,
          abi: erc20ContractABI,
          functionName: "approve",
          args: [transactionRequestTarget, fromAmount],
        });
      }
    } catch (e) {
      console.error("Approval failed:", e);
      throw e;
    }
  };

  // Function to get the optimal route for the swap using Squid API
  const getRoute = async (params: any) => {
    try {
      const result = await fetch(`${dooglyApi}/route`, {
        method: "POST",
        body: JSON.stringify(params),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const requestId = result.headers["x-request-id"]; // Retrieve request ID from response headers
      return { data: await result.json(), requestId: requestId };
    } catch (error) {
      if (error.response) {
        console.error("API error:", error.response.data);
      }
      console.error("Error with parameters:", params);
      throw error;
    }
  };

  // Function to get status
  const getStatus = async (params: any) => {
    try {
      const result = await axios.get("status", {
        params: {
          transactionId: params.transactionId,
          fromChainId: params.fromChainId,
          toChainId: params.toChainId,
          bridgeType: params.bridgeType,
        },
      });
      return result.data;
    } catch (error: any) {
      if (error.response) {
        console.error("API error:", error.response.data);
      }
      console.error("Error with parameters:", params);
      throw new Error(error.response.data);
    }
  };

  // Function to check solana transaction status and execute callback function
  const updateTransactionStatusAndExecuteCallback = async (
    transactionId: string,
    requestId: string,
    fromChainId: string,
    toChainId: string,
    bridgeType?: string
  ) => {
    const getStatusParams = bridgeType
      ? {
          transactionId,
          fromChainId,
          toChainId,
          bridgeType,
          requestId,
        }
      : {
          transactionId,
          requestId,
          fromChainId,
          toChainId,
        };

    let status;
    const completedStatuses = [
      "success",
      "partial_success",
      "needs_gas",
      "not_found",
    ];
    const maxRetries = 10;
    let retryCount = 0;

    do {
      try {
        status = await getStatus(getStatusParams);
        console.log(`Route status: ${status.squidTransactionStatus}`);
        callback({
          transactionId,
          fromChainId,
          toChainId,
          requestId,
          status: status.squidTransactionStatus,
        });
      } catch (error) {
        if (error.response && error.response.status === 404) {
          retryCount++;
          if (retryCount >= maxRetries) {
            console.error("Max retries reached. Transaction not found.");
            break;
          }
          console.log("Transaction not found. Retrying...");
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        } else {
          throw error;
        }
      }

      if (!completedStatuses.includes(status.squidTransactionStatus)) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } while (!completedStatuses.includes(status.squidTransactionStatus));
  };

  const publicClient = usePublicClient({
    chainId: account.chainId,
  });

  const walletClient = useWalletClient({
    account: account.address,
    chainId: account.chainId,
  });

  async function submitDonation() {
    const inputTokenAddress = currentToken.address;

    setSubmitButtonDisabled(true);
    setSubmitButtonText("Processing...");

    // For ERC20 token transactions
    const _donateAmount = ethers.utils.parseUnits(
      String(amount),
      currentToken.decimals
    );

    try {
      const erc20Contract = getContract({
        address: inputTokenAddress,
        abi: erc20ContractABI,
        client: {
          public: publicClient as PublicClient,
          wallet: {
            account: account,
          },
        },
      });

      params["fromChain"] = currentChainId?.toString();
      params["fromToken"] = currentToken?.address;
      params["fromAmount"] = _donateAmount.toString();
      params["fromAddress"] = wallets[0].address;

      // Get the swap route using Squid API
      const routeResult = await getRoute(params);
      const route = routeResult.data;

      console.log(route);

      const transactionRequest = route.route
        .transactionRequest as OnChainExecutionData;

      if (!transactionRequest) {
        throw new Error();
      }

      if (
        currentToken?.address != "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
      ) {
        await approveSpending(
          (transactionRequest as OnChainExecutionData).target,
          currentToken?.address as string,
          _donateAmount.toString()
        );

        // Wait for 2 seconds
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Execute the swap transaction
      const tx = await sendTransactionAsync({
        to: transactionRequest.target as `0x${string}`,
        data: transactionRequest.data as `0x${string}`,
        value: BigInt(transactionRequest.value),
      });

      if (tx) {
        await updateTransactionStatusAndExecuteCallback(
          tx,
          routeResult.requestId,
          currentChainId?.toString(),
          params.toChain
        );

        alert(`Donation successful! Transaction hash: ${tx}`);
        setSubmitButtonText("Donation Successful!");
      }
    } catch (error) {
      console.error("Donation failed:", error);
      alert("Donation failed. Please try again.");
    } finally {
      setSubmitButtonDisabled(false);
      setSubmitButtonText("Donate");
    }
  }

  return (
    <div
      className="mx-auto my-10 p-5 rounded-lg w-4/5 max-w-md"
      style={{ backgroundColor: "white" }}
    >
      <h2
        id="crypto-donate-modal-title"
        className="text-xl font-bold mb-4"
        style={{ color: "#892BE2" }}
      >
        {"Make cross-chain payment"}
      </h2>

      <div>
        <div className="mb-4">
          <button
            className={`rounded-md w-full flex justify-center`}
            style={{
              backgroundColor: "#8A2BE2",
              color: "white",
              border: "none",
              padding: "10px 20px",
              textAlign: "center",
              textDecoration: "none",
              display: "inline-block",
              fontSize: "16px",
              margin: "4px 2px",
              cursor: "pointer",
              borderRadius: "5px",
              transition: "background-color 0.3s ease",
            }}
            onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
          >
            <div className="mx-3 text-white">
              {currentChainId
                ? getChainData(chains, currentChainId.toString())?.networkName
                : "Select Chain"}
            </div>
          </button>
          {isChainDropdownOpen && (
            <div className="absolute mt-2 w-[80%] bg-white rounded-md shadow-lg py-1 z-10 max-h-48 overflow-y-auto">
              <div className="sticky top-0 bg-white p-2 border-b">
                <input
                  type="text"
                  placeholder="Search chains..."
                  className="w-full p-2 text-sm border rounded focus:outline-none focus:border-[#8A2BE2] text-[#8A2BE2]"
                  value={chainSearchQuery}
                  onChange={(e) => setChainSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()} // Prevent dropdown from closing
                />
              </div>
              {chains
                .filter((chain) =>
                  chain.networkIdentifier
                    .toLowerCase()
                    .includes(chainSearchQuery.toLowerCase())
                )
                .map((chain) => (
                  <button
                    key={chain.chainId}
                    className="block px-4 py-2 text-sm text-[#8A2BE2] hover:text-white hover:bg-[#8A2BE2] w-full text-left"
                    onClick={() => {
                      setCurrentChainId(chain.chainId);
                      setIsChainDropdownOpen(false);
                      setChainSearchQuery(""); // Reset search when selection is made
                    }}
                  >
                    <img
                      src={chain.chainIconURI}
                      alt={`${chain.networkIdentifier} logo`}
                      className="inline-block w-4 h-4 rounded-full mr-2"
                    />
                    {chain.networkIdentifier}
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="mb-4">
          <button
            className={`rounded-md w-full flex justify-center`}
            style={{
              backgroundColor: "#8A2BE2",
              color: "white",
              border: "none",
              padding: "10px 20px",
              textAlign: "center",
              textDecoration: "none",
              display: "inline-block",
              fontSize: "16px",
              margin: "4px 2px",
              cursor: "pointer",
              borderRadius: "5px",
              transition: "background-color 0.3s ease",
            }}
            onClick={() => {
              setIsTokenDropdownOpen(!isTokenDropdownOpen);
            }}
          >
            <div className="mx-3 text-white">
              {currentToken?.symbol ?? "Select Token"}
            </div>
          </button>
          {isTokenDropdownOpen && (
            <div className="absolute mt-2 w-[80%] bg-white rounded-md shadow-lg py-1 z-10 max-h-48 overflow-y-auto">
              <div className="sticky top-0 bg-white p-2 border-b">
                <input
                  type="text"
                  placeholder="Search tokens..."
                  className="w-full p-2 text-sm border rounded focus:outline-none focus:border-[#8A2BE2] text-[#8A2BE2]"
                  value={tokenSearchQuery}
                  onChange={(e) => setTokenSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()} // Prevent dropdown from closing
                />
              </div>
              {tokens
                .filter((token) =>
                  token.symbol
                    .toLowerCase()
                    .includes(tokenSearchQuery.toLowerCase())
                )
                .map((token, idx) => (
                  <button
                    key={idx}
                    className="block px-4 py-2 text-sm text-[#8A2BE2] hover:text-white hover:bg-[#8A2BE2] w-full text-left"
                    onClick={() => {
                      setCurrentToken(token);
                      setIsTokenDropdownOpen(false);
                      setTokenSearchQuery("");
                    }}
                  >
                    <img
                      src={token.logoURI}
                      alt={`${token.symbol} logo`}
                      className="inline-block w-4 h-4 rounded-full mr-2"
                    />
                    {token.symbol}
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="mb-4">
          <label
            htmlFor="crypto-donate-amount"
            className="block mb-2 text-gray-700"
          >
            Donation Amount
          </label>
          <input
            id="crypto-donate-amount"
            placeholder="Enter amount"
            className="w-full p-2 border border-gray-300 rounded"
            onChange={(e) => setDonationAmount(e.target.value)}
          />
        </div>
        <div className="flex justify-center">
          {connected ? (
            <button
              id="crypto-donate-submit"
              className="text-white border-none py-2 px-4 text-center text-lg rounded transition duration-300 ease-in-out"
              style={{ backgroundColor: config?.buttonColor || "#8A2BE2" }}
              onClick={submitDonation}
              disabled={submitButtonDisabled}
            >
              {submitButtonText}
            </button>
          ) : (
            <button
              id="crypto-connect"
              className="text-white border-none py-2 px-4 text-center text-lg rounded transition duration-300 ease-in-out"
              style={{ backgroundColor: config?.buttonColor || "#8A2BE2" }}
              onClick={() => connectWallet()}
            >
              {" "}
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
