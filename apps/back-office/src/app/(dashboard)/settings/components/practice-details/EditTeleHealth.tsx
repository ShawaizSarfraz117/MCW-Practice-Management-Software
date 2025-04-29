// "use client";
// import { useState } from "react";
// import { ChevronDown, X } from "lucide-react";
// import { Button } from "@mcw/ui";
// import { PracticeInformation } from "@/types/profile";
// import { usePracticeInformation } from "./hooks/usePracticeInformation";
// interface TelehealthDialogProps {
//   isOpen: boolean;
//   onClose: () => void;
//   practiceInfoState: PracticeInformation;
//   setPracticeInfoState: (practiceInfoState: PracticeInformation) => void;
// }
// export default function TelehealthDialog({
//   isOpen = true,
//   onClose = () => {},
//   practiceInfoState,
//   setPracticeInfoState,
// }: TelehealthDialogProps) {
//   // const { practiceInformation } = usePracticeInformation();
//   // const [officeName, setOfficeName] = useState(
//   //   practiceInformation?.telehealth.office_name,
//   // );
//   // const [selectedColor, setSelectedColor] = useState(
//   //   practiceInformation?.telehealth.color,
//   // );
//   // const [servicePlace, setServicePlace] = useState(
//   //   practiceInformation?.telehealth.service_place,
//   // );
//   // const colors = [
//   //   { name: "gray", class: "bg-gray-400" },
//   //   { name: "purple", class: "bg-purple-500" },
//   //   { name: "blue", class: "bg-blue-400" },
//   //   { name: "green", class: "bg-green-500" },
//   //   { name: "orange", class: "bg-orange-500" },
//   //   { name: "red", class: "bg-red-500" },
//   //   { name: "pink", class: "bg-pink-400" },
//   // ];
//   return (
//     <>
//       {isOpen && (
//         // <div className="fixed inset-0 bg-black/50 z-50">
//         //   <div
//         //     className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
//         //       isOpen ? "translate-x-0" : "translate-x-full"
//         //     }`}
//         //   >
//         //     <div className="h-full flex flex-col">
//         //       {/* Dialog Header */}
//         //       <div className="flex items-center justify-between p-4 border-b">
//         //         <h2 className="text-lg font-medium">Edit Telehealth Office</h2>
//         //         <Button
//         //           variant="ghost"
//         //           size="icon"
//         //           onClick={onClose}
//         //           className="rounded-full"
//         //         >
//         //           <X className="h-5 w-5 text-gray-500" />
//         //           <span className="sr-only">Close</span>
//         //         </Button>
//         //       </div>
//         //       {/* Dialog Content */}
//         //       <div className="flex-1 overflow-y-auto p-4 space-y-4">
//         //         {/* Office Name */}
//         //         <div className="space-y-2">
//         //           <label
//         //             htmlFor="office-name"
//         //             className="block text-sm font-medium text-gray-700"
//         //           >
//         //             Office Name
//         //           </label>
//         //           <input
//         //             id="office-name"
//         //             type="text"
//         //             defaultValue={practiceInformation?.telehealth.office_name}
//         //             value={officeName}
//         //             onChange={(e) => setOfficeName(e.target.value)}
//         //             className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//         //           />
//         //         </div>
//         //         {/* Location */}
//         //         <div className="space-y-2">
//         //           <label className="block text-sm font-medium text-gray-700">
//         //             Location
//         //           </label>
//         //           <div className="space-y-2">
//         //             <div>
//         //               <label
//         //                 htmlFor="street"
//         //                 className="block text-xs text-gray-500"
//         //               >
//         //                 Street
//         //               </label>
//         //               <input
//         //                 id="street"
//         //                 type="text"
//         //                 defaultValue={practiceInformation?.telehealth.address}
//         //                 placeholder="Search address"
//         //                 className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//         //               />
//         //             </div>
//         //             <div className="grid grid-cols-3 gap-2">
//         //               <div>
//         //                 <label
//         //                   htmlFor="city"
//         //                   className="block text-xs text-gray-500"
//         //                 >
//         //                   City
//         //                 </label>
//         //                 <input
//         //                   id="city"
//         //                   type="text"
//         //                   defaultValue={practiceInformation?.telehealth.city}
//         //                   className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//         //                 />
//         //               </div>
//         //               <div>
//         //                 <label
//         //                   htmlFor="state"
//         //                   className="block text-xs text-gray-500"
//         //                 >
//         //                   State
//         //                 </label>
//         //                 <div className="relative">
//         //                   <select
//         //                     defaultValue={practiceInformation?.telehealth.state}
//         //                     id="state"
//         //                     className="w-full p-2 border rounded-md appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
//         //                   >
//         //                     <option>N/A</option>
//         //                   </select>
//         //                   <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
//         //                 </div>
//         //               </div>
//         //               <div>
//         //                 <label
//         //                   htmlFor="zip"
//         //                   className="block text-xs text-gray-500"
//         //                 >
//         //                   ZIP
//         //                 </label>
//         //                 <input
//         //                   id="zip"
//         //                   type="text"
//         //                   className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//         //                 />
//         //               </div>
//         //             </div>
//         //           </div>
//         //           <p className="text-xs text-gray-500 mt-1">
//         //             This address is automatically hidden on the Client Portal,
//         //             and is only visible on billing documents if it is chosen as
//         //             the Client Billing address.
//         //           </p>
//         //         </div>
//         //         <div className="space-y-2">
//         //           <label className="block text-sm font-medium text-gray-700">
//         //             Color
//         //           </label>
//         //           <p className="text-xs text-gray-500">
//         //             Select a color for your location to surface in the calendar
//         //           </p>
//         //           <div className="flex gap-2 mt-2">
//         //             {colors.map((color) => (
//         //               <button
//         //                 key={color.name}
//         //                 onClick={() => setSelectedColor(color.name)}
//         //                 className={`w-8 h-8 rounded-full ${color.class} ${
//         //                   selectedColor === color.name
//         //                     ? "ring-2 ring-offset-2 ring-gray-400"
//         //                     : ""
//         //                 }`}
//         //                 aria-label={`Select ${color.name} color`}
//         //               />
//         //             ))}
//         //           </div>
//         //         </div>
//         //         {/* Insurance Place of Service */}
//         //         <div className="space-y-2">
//         //           <label
//         //             htmlFor="service-place"
//         //             className="block text-sm font-medium text-gray-700"
//         //           >
//         //             Insurance Place of Service
//         //           </label>
//         //           <div className="relative">
//         //             <select
//         //               id="service-place"
//         //               defaultValue={
//         //                 practiceInformation?.telehealth.service_place
//         //               }
//         //               value={servicePlace}
//         //               onChange={(e) => setServicePlace(e.target.value)}
//         //               className="w-full p-2 border rounded-md appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
//         //             >
//         //               <option>
//         //                 02 - Telehealth Provided Other than in Patient's Home
//         //               </option>
//         //               <option>
//         //                 10 - Telehealth Provided in Patient's Home
//         //               </option>
//         //               <option>11 - Office</option>
//         //             </select>
//         //             <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
//         //           </div>
//         //         </div>
//         //       </div>
//         //       <div className="p-4 border-t">
//         //         <Button
//         //           onClick={onClose}
//         //           className="w-full bg-green-600 hover:bg-green-700 text-white"
//         //         >
//         //           Save
//         //         </Button>
//         //       </div>
//         //     </div>
//         //   </div>
//         // </div>
//       )}
//     </>
//   );
// }
