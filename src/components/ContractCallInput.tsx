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
import { orgAbi } from "@/data";

const erc20Abi = [
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
];

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
  destinationToken?: string;
  tokens: Token[];
};

interface AugmentedAbiFunction extends AbiFunction {
  uid: string;
}

export function ContractCallInput({
  contractCalls,
  onContractCallsChange,
  chainId,
  destinationToken,
  tokens,
}: ContractCallInputProps) {
  const [abi, setAbi] = useState<Abi>();
  const [currentCall, setCurrentCall] = useState<ContractCall>({});
  const [functionList, setFunctionList] = useState<AugmentedAbiFunction[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string>();
  const [showAbiInput, setShowAbiInput] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [tokenList, setTokenList] = useState<Token[]>([]);
  const [filteredTokenList, setFilteredTokenList] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOrgAddressInput, setShowOrgAddressInput] = useState(false);
  const [orgAddress, setOrgAddress] = useState("");

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

      const functionAbi: AbiFunction = functionList.find(
        (f) => f.uid == selectedFunction
      ) as AbiFunction;

      const contractInterface = new ethers.utils.Interface([
        functionAbi as any,
      ]);
      const callData = contractInterface.encodeFunctionData(
        currentCall.functionName,
        data
      );

      currentCall["callData"] = callData;
    }

    if (currentCall.isDynamic) {
      if (
        currentCall.tokenAddress?.toLowerCase() ==
          "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" ||
        currentCall.tokenAddress?.toLowerCase() ==
          "0x0000000000000000000000000000000000000000"
      ) {
        currentCall.callType = 2;
      } else {
        currentCall.callType = 1;
      }
    } else {
      currentCall.callType = 0;
    }

    if (
      currentCall.tokenAddress?.toLowerCase() ==
        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" ||
      currentCall.tokenAddress?.toLowerCase() ==
        "0x0000000000000000000000000000000000000000"
    ) {
      onContractCallsChange([...contractCalls, currentCall]);
    } else {
      const erc20Interface = new ethers.utils.Interface(erc20Abi);
      const approveData = erc20Interface.encodeFunctionData("approve", [
        currentCall.contractAddress,
        ethers.constants.MaxUint256,
      ]);
      onContractCallsChange([
        ...contractCalls,
        {
          contractAddress: currentCall.tokenAddress,
          functionName: "approve",
          callType: 1,
          isDynamic: true,
          dynamicInputPos: 1,
          tokenAddress: currentCall.tokenAddress,
          callData: approveData,
        },
        currentCall,
      ]);
    }

    setCurrentCall({});
    setFormData({});
  };

  const handleFetchABI = async () => {
    setLoading(true);
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

      const augmentedFunctions = augmentMethodsWithUid(functions);

      setFunctionList(augmentedFunctions);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch or define your token list somewhere in your component
  useEffect(() => {
    setTokenList(tokens);
    setFilteredTokenList(tokens);
  }, [tokens]);

  const augmentMethodsWithUid = (
    methods: AbiFunction[]
  ): AugmentedAbiFunction[] => {
    // Group methods by their name to identify overloaded functions
    const methodsByName: Record<string, AbiFunction[]> = {};
    methods.forEach((method) => {
      if (!methodsByName[method.name]) {
        methodsByName[method.name] = [];
      }
      methodsByName[method.name].push(method);
    });

    // Process each method, adding UID with index only for overloaded functions
    const augmentedMethods: AugmentedAbiFunction[] = [];
    Object.entries(methodsByName).forEach(([, group]) => {
      if (group.length > 1) {
        // overloaded methods
        group.forEach((method, index) => {
          augmentedMethods.push({
            ...method,
            uid: `${method.name}_${index}`,
          });
        });
      } else {
        // regular methods
        augmentedMethods.push({
          ...group[0],
          uid: group[0].name,
        });
      }
    });

    return augmentedMethods;
  };

  return (
    <div>
      {/* <h2 className="text-lg font-semibold mb-4">Contract Call Details</h2> */}
      <h3 className="text-lg font-semibold mb-4">
        Perform cross-chain interactions
      </h3>
      <div className="flex flex-wrap gap-4">
        {/* <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => handleInputChange("functionName", "lendOnAave")}
        >
          Lend on Aave
        </button> */}
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            setShowOrgAddressInput(!showOrgAddressInput);
          }}
        >
          Receive Donations on Endaoment
        </button>
      </div>
      {showOrgAddressInput && (
        <div className="space-y-4 mt-4">
          <Label htmlFor="org-ein">Enter Org EIN</Label>
          <Input
            id="org-ein"
            placeholder="EIN..."
            onChange={(e) => setOrgAddress(e.target.value)}
          />
          <Button
            onClick={async () => {
              try {
                const response = await fetch(
                  `/api/fetchContractAddress?ein=${orgAddress}`
                );
                if (!response.ok) {
                  throw new Error("Failed to fetch contract address");
                }
                const data = await response.json();
                const contractAddress = data.contractAddress;

                const contractInterface = new ethers.utils.Interface(orgAbi);
                const callData = contractInterface.encodeFunctionData(
                  "donate",
                  [0]
                );
                const currentCall: ContractCall = {
                  contractAddress: contractAddress,
                  functionName: "donate",
                  callType: 1,
                  isDynamic: true,
                  dynamicInputPos: 0,
                  tokenAddress: destinationToken,
                  callData: callData,
                };
                const erc20Interface = new ethers.utils.Interface(erc20Abi);
                const approveData = erc20Interface.encodeFunctionData(
                  "approve",
                  [currentCall.contractAddress, ethers.constants.MaxUint256]
                );
                onContractCallsChange([
                  ...contractCalls,
                  {
                    contractAddress: currentCall.tokenAddress,
                    functionName: "approve",
                    callType: 1,
                    isDynamic: true,
                    dynamicInputPos: 1,
                    tokenAddress: currentCall.tokenAddress,
                    callData: approveData,
                  },
                  currentCall,
                ]);
              } catch (error) {
                console.error(error);
                alert("Error fetching contract address: " + error);
              }
            }}
          >
            Add Contract Call
          </Button>
        </div>
      )}
      <div className="mt-4 text-sm">
        Or
        <br />
        <h3 className="text-lg font-semibold mb-4">
          Create custom contract call
        </h3>
      </div>
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
          <Button className="mt-5" onClick={handleFetchABI} disabled={loading}>
            {loading ? "Loading..." : "Fetch Contract ABI"}
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
              handleInputChange(
                "functionName",
                functionList.find((f) => f.uid == e)?.name as string
              );
            }}
          >
            <SelectTrigger id="function-name">
              <SelectValue placeholder="Select function" />
            </SelectTrigger>
            <SelectContent>
              {functionList.map((func) => (
                <SelectItem key={func.uid} value={func.uid}>
                  {func.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedFunction ? (
          <WriteOnlyFunctionForm
            abiFunction={
              functionList.find((i) => i.uid == selectedFunction) as AbiFunction
            }
            onFormChange={handleFormChange}
          />
        ) : null}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is-dynamic"
            style={{
              background: "white",
            }}
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
