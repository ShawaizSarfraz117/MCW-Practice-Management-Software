import { Search, Plus, Share, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function TopBar() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] bg-white">
      <div className="relative w-[230px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Search clients" className="pl-9 h-10 bg-white border-[#e5e7eb]" />
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-sm text-gray-500">Fee income</div>
          <div className="font-semibold">$100.00</div>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Plus className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Share className="h-5 w-5" />
        </Button>

        <Button variant="default" className="bg-[#2d8467] hover:bg-[#236c53]">
          <MessageSquare className="mr-2 h-4 w-4" />
          Messages
        </Button>

        <Button variant="ghost" className="font-medium">
          AN
        </Button>
      </div>
    </header>
  )
}

