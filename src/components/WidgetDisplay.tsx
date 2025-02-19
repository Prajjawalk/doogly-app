import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { ChainData, ChainType, Token } from "@0xsquid/squid-types";
import { Button } from "./ui/button";
import { QRCodeSVG } from "qrcode.react";

type WidgetDisplayProps = {
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
  onStylesChange: (styles: any) => void;
};

export function WidgetDisplay({
  config,
  styles,
  onStylesChange,
}: WidgetDisplayProps) {
  const handleStyleChange = (key: string, value: string) => {
    onStylesChange({ ...styles, [key]: value });
  };

  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);
  const [chainSearchQuery, setChainSearchQuery] = useState("");
  const [tokenSearchQuery, setTokenSearchQuery] = useState("");
  const [currentToken, setCurrentToken] = useState<Token>();
  const [allTokens, setAllTokens] = useState<Token[]>();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [chains, setChains] = useState<ChainData[]>([]);
  const [currentChainId, setCurrentChainId] = useState<bigint | string>();
  const [modalTitle, setModalTitle] = useState("Support Our Cause");
  const [submitButtonText, setSubmitButtonText] = useState("Donate");
  const [amount, setDonationAmount] = useState("0");
  const [showQR, setShowQR] = useState(false);

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

      // Rearranging the filteredChains to move the last element to the second position
      const rearrangedChains = [
        filteredChains[0], // First element remains the same
        filteredChains[filteredChains.length - 1], // Last element moved to second position
        ...filteredChains.slice(1, filteredChains.length - 1), // All elements except the first and last
      ];

      setAllTokens(response.tokens);
      setChains(rearrangedChains);
    };

    initialize();
  }, []);

  useEffect(() => {
    const fetchTokensAndSwitchChain = async (chain: string) => {
      const fromToken = allTokens?.filter(
        (t) => t.chainId === chain.toString()
      );
      setTokens(fromToken ?? []);
      setCurrentToken(fromToken?.[0]);
    };

    if (chains.length > 1 && currentChainId) {
      fetchTokensAndSwitchChain(currentChainId.toString());
    }
  }, [currentChainId]);

  const getChainData = (
    chains: ChainData[],
    chainId: number | string
  ): ChainData | undefined => chains?.find((chain) => chain.chainId == chainId);

  // Function to lighten a color
  function lightenColor(color: string, percent: number) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-primary">Widget Preview</h2>
      <div className="border p-4 rounded-md ">
        {/* <h3 style={{ color: styles.headingColor }}>Support Our Cause</h3>
        <button
          style={{
            backgroundColor: styles.buttonColor,
            color: styles.textColor,
            padding: "8px 16px",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Donate Now
        </button> */}
        <div
          className="sm:max-w-md border p-4"
          style={{
            backgroundColor: styles.backgroundColor || "white",
            margin: "auto",
            padding: "20px",
            borderRadius: "10px",
            width: "80%",
            maxWidth: "500px",
            top: "50%",
            left: "50%",
          }}
        >
          <div
            style={{
              color: styles.headingColor || "#8A2BE2",
              fontSize: "1.5rem",
              fontWeight: "bold",
              marginBottom: "1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {modalTitle}
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.5rem",
                color: styles.headingColor || "#8A2BE2",
              }}
            >
              &times;
            </button>
          </div>

          {showQR ? (
            <div className="flex flex-col gap-y-5 items-center p-4">
              <QRCodeSVG value={"https://doogly.org"} size={256} />
              <Button
                onClick={() => {
                  setShowQR(false);
                }}
                style={{
                  backgroundColor: styles.buttonColor || "#8A2BE2",
                  color: styles.textColor || "white",
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
              >
                Back to Donation Form
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mb-4">
                <button
                  className={`rounded-md w-full flex justify-center`}
                  style={{
                    backgroundColor: styles.buttonColor || "#8A2BE2",
                    color: styles.textColor || "white",
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
                  {currentChainId
                    ? getChainData(chains, currentChainId.toString())
                        ?.networkName
                    : "Select Chain"}
                </button>
                {isChainDropdownOpen && (
                  <div className="mt-2 w-full max-w-[calc(100%-1rem)] bg-white rounded-md shadow-lg py-1 max-h-48 overflow-y-auto">
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
                    backgroundColor: styles.buttonColor || "#8A2BE2",
                    color: styles.textColor || "white",
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
                  {currentToken?.symbol ?? "Select Token"}
                </button>
                {isTokenDropdownOpen && (
                  <div className="mt-2 w-full max-w-[calc(100%-1rem)] bg-white rounded-md shadow-lg py-1 max-h-48 overflow-y-auto">
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
                  className="block mb-2 text-sm font-medium"
                  style={{ color: styles.buttonColor || "#8A2BE2" }}
                >
                  Donation Amount
                </label>
                <input
                  placeholder="Enter amount"
                  className="w-full p-2 border border-gray-300 rounded placeholder:text-[color]"
                  style={{
                    color: styles.buttonColor || "#8A2BE2", // Set input text color to button color
                    backgroundColor: styles.backgroundColor
                      ? lightenColor(styles.backgroundColor, 20)
                      : "white", // Set input background to a lighter shade
                  }}
                  onChange={(e) => setDonationAmount(e.target.value)}
                />
                <style jsx>{`
                  input::placeholder {
                    color: ${styles.buttonColor ||
                    "#8A2BE2"}; // Set placeholder color to button color
                  }
                `}</style>
              </div>

              <div className="flex justify-between mt-4">
                <Button
                  style={{
                    backgroundColor: styles.buttonColor || "#8A2BE2",
                    color: styles.textColor || "white",
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
                >
                  {submitButtonText}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowQR(true);
                  }}
                  style={{
                    backgroundColor: styles.buttonColor || "#8A2BE2",
                    color: styles.textColor || "white",
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
                >
                  Show QR Code
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="font-semibold text-primary">Customize Colors</h3>
        <div>
          <Label htmlFor="bg-color">Background Color</Label>
          <Input
            id="bg-color"
            type="color"
            value={styles.backgroundColor ?? "white"}
            onChange={(e) =>
              handleStyleChange("backgroundColor", e.target.value)
            }
          />
        </div>
        <div>
          <Label htmlFor="button-color">Button Color</Label>
          <Input
            id="button-color"
            type="color"
            value={styles.buttonColor}
            onChange={(e) => handleStyleChange("buttonColor", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="text-color">Text Color</Label>
          <Input
            id="text-color"
            type="color"
            value={styles.textColor ?? "white"}
            onChange={(e) => handleStyleChange("textColor", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="heading-color">Heading Color</Label>
          <Input
            id="heading-color"
            type="color"
            value={styles.headingColor}
            onChange={(e) => handleStyleChange("headingColor", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
