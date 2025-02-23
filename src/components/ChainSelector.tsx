import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChainData } from "@0xsquid/squid-types";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";

type ChainSelectorProps = {
  selectedChain: string;
  onSelect: (chain: string) => void;
  chains: ChainData[];
};

export function ChainSelector({
  selectedChain,
  onSelect,
  chains,
}: ChainSelectorProps) {
  const [filteredChainList, setFilteredChainList] =
    useState<ChainData[]>(chains);

  useEffect(() => {
    setFilteredChainList(chains);
  }, [chains]);
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-primary">
        Select Destination Chain
      </h2>

      <Select value={selectedChain} onValueChange={onSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a chain" />
        </SelectTrigger>
        <SelectContent>
          <Input
            type="text"
            placeholder="Search chain..."
            onChange={(e) => {
              const searchTerm = e.target.value.toLowerCase();
              // Filter your token list based on searchTerm
              const filteredChains = chains.filter((token) =>
                token.networkName.toLowerCase().includes(searchTerm)
              );
              setFilteredChainList(filteredChains);
            }}
          />
          {filteredChainList.map((chain) => (
            <SelectItem key={chain.chainId} value={chain.chainId}>
              <img
                src={chain.chainIconURI}
                alt={`${chain.networkName} logo`}
                className="inline-block w-4 h-4 mr-2"
              />
              {chain.networkName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
