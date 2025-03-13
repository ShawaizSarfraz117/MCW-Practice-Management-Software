import { getServerSession } from 'next-auth';
import { Card } from '@/components/ui/card';
import { 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp 
} from 'lucide-react';

async function getStats() {
  // This would normally fetch data from your API/database
  // For now, return mock data
  return {
    totalClients: 152,
    upcomingAppointments: 8,
    todaysAppointments: 4,
    completedSessions: 28
  };
}

export default async function DashboardPage() {
  const session = await getServerSession();
  const stats = await getStats();
  
  const userName = session?.user?.name || 'User';
  const firstName = userName.split(' ')[0];
  
  const dashboardCards = [
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Upcoming Appointments',
      value: stats.upcomingAppointments,
      icon: Calendar,
      color: 'bg-green-500'
    },
    {
      title: "Today's Appointments",
      value: stats.todaysAppointments,
      icon: Clock,
      color: 'bg-purple-500'
    },
    {
      title: 'Completed Sessions',
      value: stats.completedSessions,
      icon: TrendingUp,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {firstName}</h1>
        <p className="text-gray-600">Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardCards.map((card, index) => (
          <Card key={index} className="border-none shadow-md">
            <div className="p-6 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} rounded-full p-3 text-white`}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Today's Schedule</h2>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center p-3 border border-gray-100 rounded-md hover:bg-gray-50">
                  <div className="bg-blue-100 text-blue-800 rounded-md p-2.5 mr-3">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Client {index + 1}</p>
                    <p className="text-sm text-gray-500">{`${9 + index}:00 AM - ${10 + index}:00 AM`}</p>
                  </div>
                  <div className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full">
                    Confirmed
                  </div>
                </div>
              ))}
              <button className="text-blue-600 font-medium text-sm hover:underline w-full text-center mt-2">
                View All Appointments
              </button>
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Clients</h2>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center p-3 border border-gray-100 rounded-md hover:bg-gray-50">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    <Users className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Client Name {index + 1}</p>
                    <p className="text-sm text-gray-500">Last session: {index + 1} days ago</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800">
                    <Calendar className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <button className="text-blue-600 font-medium text-sm hover:underline w-full text-center mt-2">
                View All Clients
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 