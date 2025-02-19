import { Button } from "@/components/ui/button";

type FinalStepProps = {
  config: {
    destinationChain: string;
    destinationToken: string;
    destinationAddress: string;
    contractCalls: any[];
  };
  styles: {
    backgroundColor: string;
    buttonColor: string;
    textColor: string;
    headingColor: string;
  };
};

export function FinalStep({ config, styles }: FinalStepProps) {
  const widgetCode = `
<DooglyButton
  buttonText="Donate Now"
  modalTitle="Support Our Cause"
  apiUrl="https://api.doogly.org"
  config={{
    destinationChain: "${config.destinationChain}",
    destinationAddress: "${config.destinationAddress}",
    destinationOutputTokenAddress: "${config.destinationToken}",
  }}
  ${
    config.contractCalls.length > 0
      ? `postHook={ ${JSON.stringify(
          config.contractCalls.map((call) => {
            return {
              target: call.contractAddress,
              callData: call.callData,
              callType: call.callType ?? 0,
              tokenAddress: call.tokenAddress ?? "",
              inputPos: call.dynamicInputPos ?? 0,
            };
          })
        )}}`
      : ""
  }
  modalStyles={{
    backgroundColor: "${styles.backgroundColor}",
    buttonColor: "${styles.buttonColor}",
    textColor: "${styles.textColor}",
    headingColor: "${styles.headingColor}",
  }}
  /* Callback function executes on frontend after user executes transaction
  @type ({
          transactionId: string;
          requestId: string;
          fromChainId: string;
          toChainId: string;
          status: string; // ["success", "partial_success", "needs_gas", "not_found"]
        }) => void;
  **/
  callback={"CALLBACK FUNCTION (OPTIONAL)"}
  /* Webhook Url to post transaction details to backend if any once user confirms transaction
  Body - 
  {
    address: string;
    transactionHash: string;
    fromChain: string;
    toChain: string;
    data: additional webhook data
  }
  **/
  webhookUrl="WEBHOOK URL"
  webHookData="ADDITIONAL WEBHOOK DATA"
  // Add tailwind css classname for the checkout button that trigger modal
  buttonClassName="ADD CUSTOM CHECKOUT-BUTTOM STYLE"
/>
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(widgetCode);
    alert("Widget code copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-primary">Widget Code</h2>
      <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
        <code>{widgetCode}</code>
      </pre>
      <Button onClick={handleCopyCode}>Copy Code</Button>
      <div className="space-y-2">
        <h3 className="font-semibold text-primary">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>
            Install the npm package: <code>npm i @doogly/react</code>
          </li>
          <li>
            Import the component in your React file:{" "}
            <code>import {"{ DooglyButton }"} from '@doogly/react'</code>
          </li>
          <li>Paste the copied code into your React component's JSX</li>
          <li>Customize the button text, modal title, and styles as needed</li>
        </ol>
      </div>
    </div>
  );
}
