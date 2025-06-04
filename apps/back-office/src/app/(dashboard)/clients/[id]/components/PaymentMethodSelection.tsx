import { Input } from "@mcw/ui";
import { RadioGroup, RadioGroupItem } from "@mcw/ui";
import { Label } from "@mcw/ui";

interface PaymentMethodSelectionProps {
  paymentMethod: string;
  paymentDate: string;
  checkNumber: string;
  onPaymentMethodChange: (value: string) => void;
  onPaymentDateChange: (value: string) => void;
  onCheckNumberChange: (value: string) => void;
}

export function PaymentMethodSelection({
  paymentMethod,
  paymentDate,
  checkNumber,
  onPaymentMethodChange,
  onPaymentDateChange,
  onCheckNumberChange,
}: PaymentMethodSelectionProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-4">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white mr-2">
          <span>2</span>
        </div>
        <h3 className="text-lg font-medium">Choose payment method</h3>
      </div>

      <p className="text-gray-600 mb-4">A payment method is required</p>

      <div className="bg-gray-100 rounded-md p-4">
        <RadioGroup
          className="space-y-4"
          value={paymentMethod}
          onValueChange={onPaymentMethodChange}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem id="card" value="card" />
            <Label className="flex items-center" htmlFor="card">
              <span className="mr-2">Online card on file</span>
              <div className="flex space-x-1">
                <div className="w-6 h-4 bg-black rounded" />
                <div className="w-6 h-4 bg-blue-500 rounded" />
                <div className="w-6 h-4 bg-gray-500 rounded" />
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem id="cash" value="cash" />
            <Label htmlFor="cash">Cash</Label>
          </div>

          {paymentMethod === "cash" && (
            <div className="pl-6">
              <div className="mb-2">
                <Label className="block mb-1" htmlFor="cash-payment-date">
                  Payment Date
                </Label>
                <Input
                  className="w-48"
                  id="cash-payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => onPaymentDateChange(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <RadioGroupItem id="check" value="check" />
            <Label htmlFor="check">Check</Label>
          </div>

          {paymentMethod === "check" && (
            <div className="pl-6 flex">
              <div>
                <Label className="block mb-1" htmlFor="check-payment-date">
                  Payment Date
                </Label>
                <Input
                  className="w-48"
                  id="check-payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => onPaymentDateChange(e.target.value)}
                />
              </div>
              <div className="ml-4">
                <Label className="block mb-1" htmlFor="check-number">
                  Check Number
                </Label>
                <Input
                  className="w-48"
                  id="check-number"
                  placeholder="Ex. 1234"
                  value={checkNumber}
                  onChange={(e) => onCheckNumberChange(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <RadioGroupItem id="external" value="external" />
            <div>
              <Label htmlFor="external">External card</Label>
              <p className="text-sm text-gray-500">
                Record a payment collected using an external payment processor
              </p>
            </div>
          </div>

          {paymentMethod === "external" && (
            <div className="pl-6">
              <div className="mb-2">
                <Label className="block mb-1" htmlFor="external-payment-date">
                  Payment Date
                </Label>
                <Input
                  className="w-48"
                  id="external-payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => onPaymentDateChange(e.target.value)}
                />
              </div>
            </div>
          )}
        </RadioGroup>
      </div>
    </div>
  );
}
