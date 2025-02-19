import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { fetchContractABIFromEtherscan } from "@/utils/abi";
import { Abi, AbiFunction } from "abitype";
import { WriteOnlyFunctionForm } from "./WriteOnlyFunctionForm";
import { ethers } from "ethers";
import { getParsedContractFunctionArgs } from "@/components/Contracts";
import { Token } from "@0xsquid/squid-types";

type ContractCall = {
  contractAddress?: string;
  functionName?: string;
  abi?: string;
  callType?: number;
  parameters?: string;
  isDynamic?: boolean;
  dynamicInputPos?: number;
  tokenAddress?: string;
  callData?: string;
};

type ContractCallInputProps = {
  contractCalls: ContractCall[];
  onContractCallsChange: (calls: ContractCall[]) => void;
  chainId: number;
  tokens: Token[];
};

export function ContractCallInput({
  contractCalls,
  onContractCallsChange,
  chainId,
  tokens,
}: ContractCallInputProps) {
  const [abi, setAbi] = useState<Abi>();
  const [currentCall, setCurrentCall] = useState<ContractCall>({});
  const [functionList, setFunctionList] = useState<AbiFunction[]>([]);
  const [functionNameList, setFunctionNameList] = useState<string[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string>();
  const [showAbiInput, setShowAbiInput] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [tokenList, setTokenList] = useState<Token[]>([]);
  const [filteredTokenList, setFilteredTokenList] = useState<Token[]>([]);

  // Callback function to receive form data from child
  const handleFormChange = (updatedForm: Record<string, any>) => {
    setFormData(updatedForm);
  };

  const handleInputChange = (
    field: keyof ContractCall,
    value: string | boolean
  ) => {
    setCurrentCall({ ...currentCall, [field]: value });
  };

  const handleAddCall = () => {
    if (abi && currentCall.functionName) {
      const data = getParsedContractFunctionArgs(formData);

      const contractInterface = new ethers.utils.Interface(abi as any);
      const callData = contractInterface.encodeFunctionData(
        currentCall.functionName,
        data
      );

      currentCall["callData"] = callData;
    }

    if (currentCall.isDynamic) {
      if (
        currentCall.tokenAddress ==
          "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" ||
        currentCall.tokenAddress == "0x0000000000000000000000000000000000000000"
      ) {
        currentCall.callType = 2;
      } else {
        currentCall.callType = 1;
      }
    } else {
      currentCall.callType = 0;
    }

    onContractCallsChange([...contractCalls, currentCall]);
    setCurrentCall({});
    setFormData({});
  };

  const handleFetchABI = async () => {
    try {
      const { abi } = await fetchContractABIFromEtherscan(
        currentCall.contractAddress as `0x${string}`,
        chainId
      );

      if (!abi || abi.result?.[0].ABI == "Contract source code not verified") {
        setShowAbiInput(true);
        throw new Error("Got empty or undefined ABI from Etherscan");
      }

      setAbi(abi);

      // Extract function names from ABI and set to functionList
      const functions = abi.filter(
        (item: AbiFunction) =>
          item.type === "function" && item.stateMutability !== "view"
      );

      setFunctionList(functions);

      const functionNames = functions.map((item: AbiFunction) => item.name);
      setFunctionNameList(functionNames);
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch or define your token list somewhere in your component
  useEffect(() => {
    setTokenList(tokens);
    setFilteredTokenList(tokens);
  }, [tokens]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Contract Call Details</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="contract-address">Contract Address</Label>
          <Input
            id="contract-address"
            value={currentCall.contractAddress || ""}
            onChange={(e) =>
              handleInputChange("contractAddress", e.target.value)
            }
            placeholder="0x..."
          />
          <Button className="mt-5" onClick={handleFetchABI}>
            Fetch Contract ABI
          </Button>
        </div>

        {showAbiInput ?? (
          <div>
            <Label htmlFor="abi">ABI</Label>
            <Textarea
              id="abi"
              value={currentCall.abi || ""}
              onChange={(e) => handleInputChange("abi", e.target.value)}
              placeholder="[{...}]"
            />
          </div>
        )}

        <div>
          <Label htmlFor="function-name">Function Name</Label>
          <Select
            value={selectedFunction}
            onValueChange={(e) => {
              setSelectedFunction(e);
              handleInputChange("functionName", e);
            }}
          >
            <SelectTrigger id="function-name">
              <SelectValue placeholder="Select function" />
            </SelectTrigger>
            <SelectContent>
              {functionNameList.map((func) => (
                <SelectItem key={func} value={func}>
                  {func}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedFunction ? (
          <WriteOnlyFunctionForm
            abiFunction={
              functionList.find(
                (i) => i.name == selectedFunction
              ) as AbiFunction
            }
            onFormChange={handleFormChange}
          />
        ) : null}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is-dynamic"
            checked={currentCall.isDynamic || false}
            onChange={(e) => {
              currentCall.isDynamic = !currentCall.isDynamic;
              handleInputChange("isDynamic", e.target.checked);
            }}
          />
          <Label htmlFor="is-dynamic">Dynamic Parameters</Label>
        </div>

        {currentCall.isDynamic ? (
          <div>
            <Label htmlFor="dynamic-input-position">
              Dynamic Input Position
            </Label>
            <div className="flex items-center">
              <Input
                id="dynamic-input-position"
                type="number"
                placeholder="Enter position"
                onChange={(e) =>
                  handleInputChange("dynamicInputPos", e.target.value)
                }
              />
              <span className="relative inline-block cursor-pointer group">
                ?
                <span className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-1 w-48 bg-black text-white text-center text-sm rounded py-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Dynamic input position is used to dynamically include all the
                  remaining balance of token after previous contract calls.
                </span>
              </span>
            </div>
            <Label htmlFor="dynamic-address">Token Address</Label>
            <div>
              <Input
                id="dynamic-address"
                placeholder="Enter token address"
                onChange={(e) =>
                  handleInputChange("tokenAddress", e.target.value)
                }
              />
              or
              <Select
                onValueChange={(value) =>
                  handleInputChange("tokenAddress", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  <Input
                    type="text"
                    placeholder="Search token..."
                    onChange={(e) => {
                      const searchTerm = e.target.value.toLowerCase();
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
          </div>
        ) : null}
        <Button onClick={handleAddCall}>Add Contract Call</Button>
      </div>
      <div className="mt-4">
        <h3 className="font-semibold">Added Contract Calls:</h3>
        <ul className="list-disc pl-5">
          {contractCalls.map((call, index) => (
            <li key={index}>
              {call.functionName} - {call.contractAddress}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
