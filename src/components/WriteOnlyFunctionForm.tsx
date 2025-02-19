import { useState } from "react";
import { AbiFunction } from "abitype";
import {
  ContractInput,
  IntegerInput,
  getFunctionInputKey,
  getInitialFormState,
  transformAbiFunction,
} from "@/components";

type WriteOnlyFunctionFormProps = {
  abiFunction: AbiFunction;
  inheritedFrom?: string;
  onFormChange?: (form: Record<string, any>) => void;
};

export const WriteOnlyFunctionForm = ({
  abiFunction,
  inheritedFrom,
  onFormChange,
}: WriteOnlyFunctionFormProps) => {
  const [form, setForm] = useState<Record<string, any>>(() =>
    getInitialFormState(abiFunction)
  );
  const [txValue, setTxValue] = useState<string>("");

  // TODO use `useMemo` to optimize also update in ReadOnlyFunctionForm
  const transformedFunction = transformAbiFunction(abiFunction);

  const updateForm = (updatedFormValue: Record<string, any>) => {
    setForm(updatedFormValue);
    if (onFormChange) {
      onFormChange(updatedFormValue);
    }
  };

  const inputs = transformedFunction.inputs.map((input, inputIndex) => {
    const key = getFunctionInputKey(abiFunction.name, input, inputIndex);
    return (
      <ContractInput
        key={key}
        setForm={updateForm}
        form={form}
        stateObjectKey={key}
        paramType={input}
      />
    );
  });
  const zeroInputs =
    inputs.length === 0 && abiFunction.stateMutability !== "payable";

  return (
    <div className="py-5 space-y-3 first:pt-0 last:pb-1">
      <div
        className={`flex gap-3 ${
          zeroInputs ? "flex-row justify-between" : "flex-col"
        }`}
      >
        <p className="font-medium my-0 break-words">{abiFunction.name}</p>
        {inputs}
        {abiFunction.stateMutability === "payable" ? (
          <div className="flex flex-col gap-1.5 w-full">
            <div className="flex items-center ml-2">
              <span className="text-xs font-medium mr-2 leading-none">
                payable value
              </span>
              <span className="block text-xs font-extralight leading-none">
                wei
              </span>
            </div>
            <IntegerInput
              disableMultiplyBy1e18={true}
              value={txValue}
              onChange={(updatedTxValue) => {
                setTxValue(updatedTxValue);
              }}
              placeholder="value (wei)"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};
