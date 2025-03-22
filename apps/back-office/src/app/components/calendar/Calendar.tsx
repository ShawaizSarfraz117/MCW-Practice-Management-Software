"use client"

import { ChevronLeft, ChevronDown, Settings } from "lucide-react"
import { Button } from "@mcw/ui"
import { Avatar, AvatarFallback } from "@mcw/ui"

export default function Calendar() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm">
            Today
          </Button>
          <h2 className="text-lg font-medium">Oct 2025</h2>
        </div>

        <div className="flex space-x-2">
          <Button variant="ghost" size="sm">
            Day
          </Button>
          <Button variant="secondary" size="sm">
            Week
          </Button>
          <Button variant="ghost" size="sm">
            Month
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <span>Color: Status</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Avatar>
              <AvatarFallback>TM</AvatarFallback>
            </Avatar>
            <span className="font-medium">Travis McNulty</span>
            <ChevronDown className="w-4 h-4" />
          </div>

          <div className="flex items-center space-x-1">
            <span>All locations</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </header>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7">
        {/* Time Column */}
        <div className="border-r pt-16">
          <div className="h-12 px-2 text-right text-sm text-muted-foreground">9 am</div>
          <div className="h-12 px-2 text-right text-sm text-muted-foreground">10 am</div>
          {/* More time slots would go here */}
        </div>

        {/* Days */}
        {["Sun 20", "Mon 21", "Tue 22", "Wed 23", "Thu 24", "Fri 25", "Sat 26"].map((day, i) => (
          <div key={i} className="border-r">
            <div className="h-16 border-b p-2 text-center">
              <div className="font-medium">{day}</div>
            </div>
            <div className="relative h-full">
              {i === 2 && (
                <div className="absolute top-[120px] left-1/2 transform -translate-x-1/2 bg-accent text-accent-foreground p-2 rounded text-xs w-[90%]">
                  New Appointment
                  <br />
                  12:00 PM - 12:50 PM
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 