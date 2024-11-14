"use client";

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
  useWriteContract,
} from "wagmi";
import { getContract, PublicClient } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const account = useAccount();
  const sendDonation = useWriteContract();
  const switchChain = useSwitchChain();
  const erc20Write = useWriteContract();

  const [uniswapTokens, setUniswapTokens] = useState({});
  const [initialized, setInitialized] = useState(false);
  const [walletAddressInput, setWalletAddressInput] = useState(account.address);
  const [config, setConfig] = useState({});
  const id = params.id;

  // const config = {
  //   destinationChain: "optimism",
  //   destinationAddress: "0x8a4c14d50c43363a28647188534db7004112091c",
  //   splitsAddress: "0x61C5f2a37D65A173Eaf4157f02D4FD10043e2455",
  //   hypercertFractionId: "18668571214016525982527657712921667616899072",
  //   modalTitle: "Make Impact",
  //   poolId: 0,
  // };

  useEffect(() => {
    const initialize = async () => {
      // Fetch data from /api route with id as query param
      const response = await fetch(`/api?id=${id}`);
      const data = await response.json();
      data.hypercertFractionId = BigInt(data.hypercertFractionId) + BigInt(1);

      setConfig(data);

      // Fetch user's tokens and check Uniswap pools
      const uniswaptokens = await fetchUserTokensAndUniswapPools(
        account.chainId
      );
      setUniswapTokens(uniswaptokens);
    };

    if (account.isConnected && !initialized) {
      initialize();
      setInitialized(true);
    }
  }, [config, account, initialized]);

  const swapperBridgerABI = [
    {
      inputs: [],
      name: "USDC",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "destinationChain",
          type: "string",
        },
        {
          internalType: "string",
          name: "destinationAddress",
          type: "string",
        },
        {
          internalType: "address",
          name: "hcRecipientAddress",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "poolId",
          type: "uint256",
        },
        {
          internalType: "address payable",
          name: "_splitsAddress",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "_hypercertFractionId",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "inputTokenAddress",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "sendDonation",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [],
      name: "UNISWAP_V3_FACTORY",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

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

  const publicClient = usePublicClient({
    chainId: account.chainId,
  });

  const walletClient = useWalletClient({
    account: account.address,
    chainId: account.chainId,
  });

  const chainSelectHtml = switchChain.chains.map((chain) => (
    <option
      value={chain.id}
      selected={chain.id === account.chainId}
      key={chain.id}
    >
      {chain.name}
    </option>
  ));

  const tokenSelectHtml = Object.entries(uniswapTokens).map(
    ([symbol, token]) => (
      <option value={symbol} key={token.name}>
        {token.name} ({symbol})
      </option>
    )
  );

  const swapperBridgerContract = getContract({
    address: getChainParams(account.chainId)?.swapperBridgerContract,
    abi: swapperBridgerABI,
    client: {
      public: publicClient as PublicClient,
      wallet: walletClient,
    },
  });

  const donationAmountInput = document.getElementById("crypto-donate-amount");
  const submitButton = document.getElementById("crypto-donate-submit");
  const tokenSelect = document.getElementById("crypto-donate-token");

  function updateInputTokenAddress() {
    const selectedToken = tokenSelect.value;
    config.inputTokenAddress =
      uniswapTokens[selectedToken]?.address || config.inputTokenAddress;
  }

  const chainSelectEl = document.getElementById("crypto-donate-chain");
  const chainSelect = async () => {
    const newChainId = parseInt(chainSelectEl.value);
    if (newChainId !== account.chainId) {
      try {
        console.log(newChainId);
        await switchChain.switchChainAsync({ chainId: newChainId });

        if (switchChain.isSuccess) {
          const newUniswapTokens = await fetchUserTokensAndUniswapPools(
            newChainId
          );

          setUniswapTokens(newUniswapTokens);
        }

        if (switchChain.error) {
          console.log(switchChain.error);
          throw new Error(switchChain.error.message);
        }
      } catch (error) {
        console.error("Failed to switch chain:", error);
        chainSelectEl.value = account.chainId;
      }
    }
  };

  async function submitDonation() {
    const amount = donationAmountInput.value;
    if (!amount) return;

    const tokenSelect = document.getElementById("crypto-donate-token");
    const selectedToken = tokenSelect.value;
    const inputTokenAddress = uniswapTokens[selectedToken].address;

    submitButton.disabled = true;
    submitButton.textContent = "Processing...";

    try {
      if (selectedToken === "native") {
        // For native token transactions
        await sendDonation.writeContractAsync({
          address: getChainParams(account.chainId).swapperBridgerContract,
          abi: swapperBridgerABI,
          functionName: "sendDonation",
          args: [
            config.destinationChain,
            config.destinationAddress,
            walletAddressInput,
            config.poolId,
            config.splitsAddress,
            config.hypercertFractionId,
            "0x0000000000000000000000000000000000000000", // native token
            ethers.parseEther(amount),
          ],
          value: BigInt(100000000000000) + ethers.parseEther(amount),
        });
      } else {
        // For ERC20 token transactions
        const donationAmount = ethers.parseUnits(
          amount,
          uniswapTokens[selectedToken].decimals
        );

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

        // Check current allowance
        const currentAllowance = await erc20Contract.read.allowance([
          account.address,
          swapperBridgerContract.address,
        ]);

        // If current allowance is less than donation amount, request approval
        if (Number(currentAllowance) < donationAmount) {
          await erc20Write.writeContractAsync({
            address: inputTokenAddress,
            abi: erc20ContractABI,
            functionName: "approve",
            args: [swapperBridgerContract.address, donationAmount],
          });
        }

        // Send the donation
        await sendDonation.writeContractAsync({
          address: getChainParams(account.chainId).swapperBridgerContract,
          abi: swapperBridgerABI,
          functionName: "sendDonation",
          args: [
            config.destinationChain,
            config.destinationAddress,
            walletAddressInput,
            config.poolId,
            config.splitsAddress,
            config.hypercertFractionId,
            inputTokenAddress,
            donationAmount,
          ],
          value: BigInt(1000000000000000),
        });
      }

      if (sendDonation.isSuccess) {
        alert("Donation successful!");
      }
    } catch (error) {
      console.error("Donation failed:", error);
      alert("Donation failed. Please try again.");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Donate";
    }
  }

  async function fetchUserTokensAndUniswapPools(chainId) {
    const tokens = { native: getNativeToken(chainId) };
    // Fetch user's ERC20 tokens
    const userTokens = await fetchUserERC20Tokens(account.address, chainId);

    try {
      for (const token of userTokens) {
        try {
          const stablecoinAddress = await swapperBridgerContract.read.USDC();

          tokens["USDC"] = {
            symbol: "USDC",
            name: "USDC",
            address: stablecoinAddress,
            decimals: 6,
          };

          const uniswapFactoryAddress =
            await swapperBridgerContract.read.UNISWAP_V3_FACTORY();

          const uniswapV3FactoryContract = getContract({
            address: uniswapFactoryAddress as `0x${string}`,
            abi: uniswapFactoryABI,
            client: publicClient as PublicClient,
          });

          // Check if there's a pool with the stablecoin for this token
          const poolAddress = await uniswapV3FactoryContract.read.getPool([
            stablecoinAddress,
            token.address,
            3000,
          ]);

          if (
            poolAddress != ethers.ZeroAddress ||
            token.address == stablecoinAddress
          ) {
            tokens[token.symbol] = {
              symbol: token.symbol,
              name: token.name,
              address: token.address,
              decimals: token,
            };
          }
        } catch (error) {
          console.error(`Error checking pool for ${token.symbol}:`, error);
        }
      }
    } catch (error) {
      console.error("Error fetching addresses from contract:", error);
    }

    setUniswapTokens(tokens);
    return tokens;
  }

  async function fetchUserERC20Tokens(userAddress, chainId) {
    if (!userAddress || !chainId) {
      return [];
    }

    const apiUrl = getExplorerApiUrl(chainId);
    const apiKey = getExplorerApiKey(chainId);

    if (!apiUrl || !apiKey) {
      console.error("Unsupported chain");
      return [];
    }

    const url = `${apiUrl}?module=account&action=tokentx&address=${userAddress}&startblock=0&endblock=999999999&sort=asc&apikey=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "1") {
        console.error("Explorer API request failed");
        return [];
      }

      const uniqueTokens = new Set();
      const userTokens = [];
      for (const tx of data.result) {
        if (!uniqueTokens.has(tx.contractAddress)) {
          uniqueTokens.add(tx.contractAddress);
          userTokens.push({
            address: tx.contractAddress,
            symbol: tx.tokenSymbol,
            name: tx.tokenName,
            decimals: tx.tokenDecimal,
          });
        }
      }

      // Check balances and filter out tokens with zero balance
      const tokensWithBalance = [];
      for (const token of userTokens) {
        const contract = getContract({
          address: token.address,
          abi: erc20ContractABI,
          client: {
            public: publicClient,
          },
        });

        const balance = await contract.read.balanceOf([userAddress]);

        if (balance > 0) {
          tokensWithBalance.push(token);
        }
      }

      return tokensWithBalance;
    } catch (error) {
      console.error("Failed to fetch user ERC20 tokens:", error);
      return [];
    }
  }

  function getNativeToken(chainId) {
    const nativeTokens = {
      10: {
        symbol: "ETH",
        name: "Ethereum",
        address: "0x0000000000000000000000000000000000000000",
      },
      8453: {
        symbol: "ETH",
        name: "Ethereum",
        address: "0x0000000000000000000000000000000000000000",
      },
    };
    return (
      nativeTokens[chainId] || {
        symbol: "NATIVE",
        name: "Native Token",
        address: "0x0000000000000000000000000000000000000000",
      }
    );
  }

  function getExplorerApiUrl(chainId) {
    const apiUrls = {
      10: "https://api-optimistic.etherscan.io/api",
      8453: "https://api.basescan.org/api",
    };
    return apiUrls[chainId];
  }

  function getExplorerApiKey(chainId) {
    const apiKeys = {
      10: "9HBFD3UFSTQV71132ZASZ4T6M6Y1VHDGKM",
      8453: "X4R5GNYKKD34HKQGEVC6SXGHI62EGUYNJ8",
      42220: "4MY7GCBJXMB181R771BY5HRSCAQN2PXTUN",
    };
    return apiKeys[chainId];
  }

  function getChainParams(chainId) {
    const chains = {
      10: {
        chainId: "0xA",
        chainName: "Optimism",
        AxelarChainName: "optimism",
        nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
        rpcUrls: ["https://mainnet.optimism.io"],
        blockExplorerUrls: ["https://optimistic.etherscan.io"],
        swapperBridgerContract: "0x8a4c14d50c43363a28647188534db7004112091c",
      },
      8453: {
        chainId: "0x2105",
        chainName: "Base",
        AxelarChainName: "base",
        nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
        rpcUrls: ["https://mainnet.base.org"],
        blockExplorerUrls: ["https://basescan.org"],
        swapperBridgerContract: "0xeD99908D0697C408b26Ba35fE0800e565042c858",
      },
      42220: {
        chainId: "0xA4EC",
        chainName: "Celo",
        AxelarChainName: "celo",
        nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
        rpcUrls: ["https://forno.celo.org"],
        blockExplorerUrls: ["https://explorer.celo.org"],
      },
    };
    return chains[chainId];
  }

  return (
    <div className="bg-white mx-auto my-10 p-5 rounded-lg w-4/5 max-w-md">
      <h2
        id="crypto-donate-modal-title"
        className="text-purple-600 text-xl font-bold mb-4"
      >
        {config.modalTitle || "Make a Donation"}
      </h2>
      {account.isConnected ? (
        <div>
          <div className="mb-4">
            <ConnectButton />
          </div>
          <div className="mb-4">
            <label
              htmlFor="crypto-donate-wallet-address"
              className="block mb-2 text-gray-700"
            >
              Wallet Address
            </label>
            <input
              id="crypto-donate-wallet-address"
              type="text"
              className="w-full p-2 border border-gray-300 rounded bg-gray-100"
              defaultValue={account.address}
              onChange={(e) => setWalletAddressInput(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="crypto-donate-chain"
              className="block mb-2 text-gray-700"
            >
              Select Chain
            </label>
            <select
              id="crypto-donate-chain"
              className="w-full p-2 border border-gray-300 rounded bg-gray-100"
              onChange={chainSelect}
            >
              {chainSelectHtml}
            </select>
          </div>
          <div className="mb-4">
            <label
              htmlFor="crypto-donate-token"
              className="block mb-2 text-gray-700"
            >
              Select Token
            </label>
            <select
              id="crypto-donate-token"
              className="w-full p-2 border border-gray-300 rounded bg-gray-100"
              onChange={updateInputTokenAddress}
            >
              {tokenSelectHtml}
            </select>
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
              type="number"
              step="0.01"
              placeholder="Enter amount"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <button
            id="crypto-donate-submit"
            className="bg-purple-600 text-white border-none py-2 px-4 text-center text-lg rounded transition duration-300 ease-in-out hover:bg-purple-700"
            onClick={submitDonation}
          >
            Donate
          </button>
        </div>
      ) : (
        <>
          <ConnectButton />
        </>
      )}
    </div>
  );
}
