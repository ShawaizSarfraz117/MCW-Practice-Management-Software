import { Input, Label } from "@mcw/ui";
import { Trash2 } from "lucide-react";

export default function ProductsBillingForm({
  productInfo,
  setProductInfo,
  onDelete,
  index,
}: {
  productInfo: { name: string; price: string };
  setProductInfo: (productInfo: {
    id?: string;
    name: string;
    price: string;
  }) => void;
  onDelete?: () => void;
  index?: number;
}) {
  if (!productInfo) return null;
  // console.log("Info", productInfo);
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="space-y-2 md:col-span-2">
          {index! != 0 ? (
            <Label htmlFor="product-name">Added Product</Label>
          ) : (
            <Label htmlFor="product-name">Product Name</Label>
          )}
          <Input
            className="border-gray-300"
            value={productInfo.name}
            id="product-name"
            placeholder="Enter product name"
            onChange={(e) => {
              setProductInfo({ ...productInfo, name: e.target.value });
            }}
          />
        </div>
        <div className="space-y-2 flex items-end gap-2">
          <div className="flex-1">
            {index! == 0 && <Label htmlFor="price">Price</Label>}
            <Input
              className="border-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              value={productInfo.price}
              id="price"
              type="number"
              placeholder="Enter price"
              onChange={(e) => {
                setProductInfo({ ...productInfo, price: e.target.value });
              }}
            />
          </div>
          {index! != 0 && (
            <button
              onClick={onDelete}
              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
