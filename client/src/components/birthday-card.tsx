import { Calendar } from "lucide-react";
import { formatDate } from "@/utils/date-utils";
import { type Birthday } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface BirthdayCardProps {
  birthday: Birthday;
  daysUntil: number;
  isUpcoming: boolean;
}

export default function BirthdayCard({ birthday, daysUntil, isUpcoming }: BirthdayCardProps) {
  const formattedDate = formatDate(new Date(birthday.birthdate), daysUntil);
  
  return (
    <div 
      className={`p-4 rounded-lg border ${
        isUpcoming 
          ? "border-amber-200 bg-[#FEF3C7]" 
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-lg">{birthday.name}</h3>
          <div className="flex items-center mt-1">
            <Calendar className="h-4 w-4 text-gray-600 mr-1" />
            <span className="text-sm text-gray-600">{formattedDate}</span>
          </div>
          {birthday.message && (
            <p className="text-sm mt-2 text-gray-700">{birthday.message}</p>
          )}
        </div>
        
        {isUpcoming && (
          <div className="flex items-center">
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
              Bientôt
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
