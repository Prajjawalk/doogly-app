import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type AddressInputProps = {
  address: string;
  onAddressChange: (address: string) => void;
  onContractCallToggle: (useContractCall: boolean) => void;
};

export function AddressInput({
  address,
  onAddressChange,
  onContractCallToggle,
}: AddressInputProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-primary">
        Enter Destination Address
      </h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="0x..."
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="contract-call" onCheckedChange={onContractCallToggle} />
          <Label htmlFor="contract-call">
            Execute contract calls after swap
          </Label>
        </div>
      </div>
    </div>
  );
}
