import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { type Birthday } from "@shared/schema";
import BirthdayCard from "./birthday-card";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { calculateDaysUntilBirthday, sortBirthdaysByProximity } from "@/utils/date-utils";
import { Search } from "lucide-react";

interface BirthdayListProps {
  birthdays: Birthday[];
  isLoading: boolean;
  onSearch: (query: string) => void;
  onEdit?: (id: number) => void;
}

export default function BirthdayList({ birthdays, isLoading, onSearch, onEdit }: BirthdayListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };
  
  // Sort birthdays by proximity
  const sortedBirthdays = sortBirthdaysByProximity(birthdays);
  
  return (
    <Card className="bg-white shadow-md">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Anniversaires à venir</h2>
          
          <div className="relative">
            <Input 
              id="search" 
              placeholder="Rechercher..." 
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-gray-200">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))
          ) : sortedBirthdays.length > 0 ? (
            // Birthdays list
            sortedBirthdays.map((birthday) => {
              const daysUntil = calculateDaysUntilBirthday(new Date(birthday.birthdate));
              const isUpcoming = daysUntil <= 7;
              
              return (
                <BirthdayCard
                  key={birthday.id}
                  birthday={birthday}
                  daysUntil={daysUntil}
                  isUpcoming={isUpcoming}
                />
              );
            })
          ) : (
            // Empty state
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun anniversaire trouvé</h3>
              <p className="mt-1 text-sm text-gray-500">Ajoutez des anniversaires pour commencer à les suivre.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
