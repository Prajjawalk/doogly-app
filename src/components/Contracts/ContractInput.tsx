import { Dispatch, SetStateAction, useState } from "react";
import { Tuple } from "./Tuple";
import { TupleArray } from "./TupleArray";
import { AbiParameter } from "abitype";
import {
  AddressInput,
  Bytes32Input,
  BytesInput,
  InputBase,
  IntegerInput,
  IntegerVariant,
} from "@/components/Input";
import { AbiParameterTuple } from "@/utils/abi";

type ContractInputProps = {
  setForm: Dispatch<SetStateAction<Record<string, any>>>;
  form: Record<string, any> | undefined;
  stateObjectKey: string;
  paramType: AbiParameter;
};

/**
 * Generic Input component to handle input's based on their function param type
 */
export const ContractInput = ({
  setForm,
  form,
  stateObjectKey,
  paramType,
}: ContractInputProps) => {
  const [isSenderAddress, setIsSenderAddress] = useState(false);

  const inputProps = {
    name: stateObjectKey,
    value: form?.[stateObjectKey],
    placeholder: paramType.type,
    onChange: (value: any) => {
      setForm((form) => ({ ...form, [stateObjectKey]: value }));
    },
  };

  const renderInput = () => {
    switch (paramType.type) {
      case "address":
        return <AddressInput {...inputProps} />;
      case "bytes32":
        return <Bytes32Input {...inputProps} />;
      case "bytes":
        return <BytesInput {...inputProps} />;
      case "string":
        return <InputBase {...inputProps} />;
      case "tuple":
        return (
          <Tuple
            setParentForm={setForm}
            parentForm={form}
            abiTupleParameter={paramType as AbiParameterTuple}
            parentStateObjectKey={stateObjectKey}
          />
        );
      default:
        // Handling 'int' types and 'tuple[]' types
        if (paramType.type.includes("int") && !paramType.type.includes("[")) {
          return (
            <IntegerInput
              {...inputProps}
              disableMultiplyBy1e18={true}
              variant={paramType.type as IntegerVariant}
            />
          );
        } else if (paramType.type.startsWith("tuple[")) {
          return (
            <TupleArray
              setParentForm={setForm}
              parentForm={form}
              abiTupleParameter={paramType as AbiParameterTuple}
              parentStateObjectKey={stateObjectKey}
            />
          );
        } else {
          return <InputBase {...inputProps} />;
        }
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center ml-2">
        {paramType.name && (
          <span className="text-xs font-medium mr-2 leading-none">
            {paramType.name}
          </span>
        )}
        <span className="block text-xs font-extralight leading-none">
          {paramType.type}
        </span>
        {paramType.type === "address" && (
          <span
            className={`cursor-pointer ml-2 px-2 py-1 rounded-full text-xs ${
              isSenderAddress
                ? "bg-primary text-white"
                : "bg-gray-200 text-black"
            }`}
            onClick={() => {
              setIsSenderAddress(!isSenderAddress);
              if (isSenderAddress) {
                setForm((form) => ({ ...form, [stateObjectKey]: "" }));
              } else {
                setForm((form) => ({
                  ...form,
                  [stateObjectKey]:
                    "0xdeADbEEf1234567890AbCdeF1234567890ABCdEF",
                }));
              }
            }}
          >
            msg.sender?
          </span>
        )}
      </div>
      {renderInput()}
    </div>
  );
};
