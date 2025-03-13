import { getServerSession } from 'next-auth';
import { Card } from '@/components/ui/card';
import { Calendar, FileText, MessageSquare, Clock } from 'lucide-react';

async function getClientData() {
  // This would normally fetch data from your API/database
  // For now, return mock data
  return {
    upcomingAppointments: 2,
    pendingDocuments: 1,
    unreadMessages: 3,
    lastAppointment: '2023-03-15',
  };
}

export default async function ClientPortalPage() {
  const session = await getServerSession();
  const clientData = await getClientData();
  
  const userName = session?.user?.name || 'Client';
  const firstName = userName.split(' ')[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {firstName}</h1>
        <p className="text-gray-600">Here's your health dashboard.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-md">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Appointments</p>
                <p className="text-3xl font-bold mt-1">{clientData.upcomingAppointments}</p>
              </div>
              <div className="bg-blue-500 rounded-full p-3 text-white">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <a href="/client-portal/appointments" className="text-blue-600 text-sm font-medium hover:underline">
                View appointments
              </a>
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-md">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Documents to Complete</p>
                <p className="text-3xl font-bold mt-1">{clientData.pendingDocuments}</p>
              </div>
              <div className="bg-orange-500 rounded-full p-3 text-white">
                <FileText className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <a href="/client-portal/documents" className="text-blue-600 text-sm font-medium hover:underline">
                View documents
              </a>
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-md">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread Messages</p>
                <p className="text-3xl font-bold mt-1">{clientData.unreadMessages}</p>
              </div>
              <div className="bg-green-500 rounded-full p-3 text-white">
                <MessageSquare className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <a href="/client-portal/messages" className="text-blue-600 text-sm font-medium hover:underline">
                View messages
              </a>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-md">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Your Upcoming Appointments</h2>
            
            {clientData.upcomingAppointments > 0 ? (
              <div className="space-y-4">
                {Array.from({ length: clientData.upcomingAppointments }).map((_, index) => (
                  <div key={index} className="flex items-center p-3 border border-gray-100 rounded-md hover:bg-gray-50">
                    <div className="bg-blue-100 text-blue-800 rounded-md p-2.5 mr-3">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Appointment with Dr. Smith</p>
                      <p className="text-sm text-gray-500">{`March ${20 + index}, 2023 | 10:00 AM`}</p>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full">
                      Confirmed
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No upcoming appointments scheduled.</p>
                <button className="mt-2 text-blue-600 font-medium hover:underline">
                  Request an appointment
                </button>
              </div>
            )}
          </div>
        </Card>

        <Card className="border-none shadow-md">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 border border-gray-100 rounded-md">
                <div className="bg-blue-100 text-blue-800 rounded-md p-2 mt-1">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Appointment completed</p>
                  <p className="text-sm text-gray-500">Your session with Dr. Smith was completed.</p>
                  <p className="text-xs text-gray-400 mt-1">March 15, 2023</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 border border-gray-100 rounded-md">
                <div className="bg-green-100 text-green-800 rounded-md p-2 mt-1">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">New message received</p>
                  <p className="text-sm text-gray-500">Dr. Smith sent you a new message.</p>
                  <p className="text-xs text-gray-400 mt-1">March 10, 2023</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 border border-gray-100 rounded-md">
                <div className="bg-orange-100 text-orange-800 rounded-md p-2 mt-1">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Document completed</p>
                  <p className="text-sm text-gray-500">You completed the intake form.</p>
                  <p className="text-xs text-gray-400 mt-1">March 5, 2023</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 