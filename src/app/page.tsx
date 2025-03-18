"use client";

import { useEffect, useState } from "react";
import { ChainSelector } from "@/components/ChainSelector";
import { TokenSelector } from "@/components/TokenSelector";
import { AddressInput } from "@/components/AddressInput";
import { ContractCallInput } from "@/components/ContractCallInput";
import { WidgetDisplay } from "@/components/WidgetDisplay";
import { FinalStep } from "@/components/FinalStep";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ChainData, ChainType, Token } from "@0xsquid/squid-types";

type Step =
  | "selectChainAndToken"
  | "address"
  | "contractCall"
  | "widget"
  | "final";

export default function CrossChainWidgetCustomizer() {
  const [step, setStep] = useState<Step>("selectChainAndToken");
  const [config, setConfig] = useState({
    destinationChain: "",
    destinationToken: "",
    destinationAddress: "",
    contractCalls: [] as any,
  });
  const [addContractCalls, setAddContractCalls] = useState(false);
  const [widgetStyles, setWidgetStyles] = useState({
    backgroundColor: "#FFFFFF",
    buttonColor: "#AF3BC9",
    textColor: "#FFFFFF",
    headingColor: "#AF3BC9",
  });
  const [allTokens, setAllTokens] = useState<Token[]>();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [chains, setChains] = useState<ChainData[]>([]);

  const dooglyApi = process.env.NEXT_PUBLIC_DOOGLY_API;

  useEffect(() => {
    const initialize = async () => {
      const response = await (await fetch(`${dooglyApi}/info`)).json();

      const filteredChains = response.chains.filter(
        (i: ChainData) =>
          i.chainType != ChainType.COSMOS &&
          i.chainType != ChainType.BTC &&
          i.chainType != ChainType.SOLANA
      );

      setAllTokens(response.tokens);
      setChains(filteredChains);
    };

    initialize();
  }, []);

  const fetchTokensOfChain = (chain: string) => {
    const fromToken = allTokens?.filter((t) => t.chainId === chain.toString());
    setTokens(fromToken ?? []);
  };

  const handleNext = () => {
    switch (step) {
      case "selectChainAndToken":
        setStep("address");
        break;
      case "address":
        if (addContractCalls) {
          setStep("contractCall");
        } else {
          setStep("widget");
        }
        break;
      case "contractCall":
        setStep("widget");
        break;
      case "widget":
        setStep("final");
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case "address":
        setStep("selectChainAndToken");
        break;
      case "contractCall":
        setStep("address");
        break;
      case "widget":
        if (addContractCalls) {
          setStep("contractCall");
        } else {
          setStep("address");
        }
        break;
      case "final":
        setStep("widget");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-2 px-4 sm:px-6 lg:px-8">
      <nav className="flex items-center justify-between py-4 px-6 bg-white shadow">
        <div className="flex items-center">
          <img
            src="/doogly-logo.png"
            alt="Doogly Logo"
            className="h-8 w-8 mr-2"
          />
          <div className="text-2xl font-bold text-[#AF3BC9] drop-shadow-[0_2px_0px_rgba(0,0,0,1)]">
            Doogly
          </div>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto py-4">
        <Card>
          <CardTitle className="p-5 text-primary text-center flex items-center justify-center">
            Doogly Widget Creator
          </CardTitle>
          <CardContent className="p-6">
            {step === "selectChainAndToken" && (
              <div className="flex flex-col gap-y-5">
                <ChainSelector
                  selectedChain={config.destinationChain}
                  onSelect={(chain) => {
                    setConfig({ ...config, destinationChain: chain });
                    fetchTokensOfChain(chain);
                  }}
                  chains={chains}
                />
                <TokenSelector
                  selectedToken={config.destinationToken}
                  onSelect={(token) =>
                    setConfig({ ...config, destinationToken: token })
                  }
                  tokenList={tokens}
                />
              </div>
            )}
            {step === "address" && (
              <AddressInput
                address={config.destinationAddress}
                onAddressChange={(address) =>
                  setConfig({ ...config, destinationAddress: address })
                }
                onContractCallToggle={(useContractCall) => {
                  if (useContractCall) {
                    setAddContractCalls(true);
                  } else {
                    setAddContractCalls(false);
                  }
                }}
              />
            )}
            {step === "contractCall" && (
              <ContractCallInput
                contractCalls={config.contractCalls}
                onContractCallsChange={(calls) =>
                  setConfig({ ...config, contractCalls: calls })
                }
                destinationToken={config.destinationToken}
                chainId={parseInt(config.destinationChain)}
                tokens={tokens}
              />
            )}
            {step === "widget" && (
              <WidgetDisplay
                config={config}
                styles={widgetStyles}
                onStylesChange={setWidgetStyles}
              />
            )}
            {step === "final" && (
              <FinalStep config={config} styles={widgetStyles} />
            )}
            <div className="mt-6 flex justify-between">
              {step !== "selectChainAndToken" && (
                <Button onClick={handleBack}>Back</Button>
              )}
              {step !== "final" && (
                <Button onClick={handleNext} className="ml-auto">
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
