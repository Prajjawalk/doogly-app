import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "./ui/input";
import { useEffect, useState } from "react";
import { Token } from "@0xsquid/squid-types";

type TokenSelectorProps = {
  selectedToken: string;
  onSelect: (token: string) => void;
  tokenList: Token[];
};

export function TokenSelector({
  selectedToken,
  onSelect,
  tokenList,
}: TokenSelectorProps) {
  const [filteredTokenList, setFilteredTokenList] =
    useState<Token[]>(tokenList);

  useEffect(() => {
    setFilteredTokenList(tokenList);
  }, [tokenList]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-primary">
        Select Destination Token
      </h2>

      <Select value={selectedToken} onValueChange={onSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a token" />
        </SelectTrigger>
        <SelectContent>
          <Input
            type="text"
            placeholder="Search token..."
            onChange={(e) => {
              const searchTerm = e.target.value.toLowerCase();
              // Filter your token list based on searchTerm
              const filteredTokens = tokenList.filter((token) =>
                token.name.toLowerCase().includes(searchTerm)
              );
              setFilteredTokenList(filteredTokens);
            }}
          />
          {filteredTokenList.map((token) => (
            <SelectItem key={token.address} value={token.address}>
              {token.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
