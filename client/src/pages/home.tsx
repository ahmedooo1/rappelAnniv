import { Container } from "../components/ui/container";
import BirthdayForm from "../components/birthday-form";
import BirthdayEditForm from "../components/birthday-edit-form";
import BirthdayList from "../components/birthday-list";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingBirthdayId, setEditingBirthdayId] = useState<number | null>(null);
  const { toast } = useToast();
  
  const { data: birthdays, isLoading, refetch } = useQuery({
    queryKey: ['/api/birthdays'],
    queryFn: async () => {
      const response = await fetch('/api/birthdays');
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des anniversaires');
      }
      return response.json();
    },
  });

  const { data: filteredBirthdays, isLoading: isSearchLoading } = useQuery({
    queryKey: ['/api/birthdays/search', searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/birthdays/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la recherche');
      }
      return response.json();
    },
    enabled: Boolean(searchQuery),
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleEdit = (id: number) => {
    setEditingBirthdayId(id);
  };

  const handleCancelEdit = () => {
    setEditingBirthdayId(null);
  };

  const handleEditSuccess = () => {
    setEditingBirthdayId(null);
    refetch();
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/birthdays/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de l\'anniversaire');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/birthdays'] });
      toast({
        title: "Anniversaire supprimé",
        description: "L'anniversaire a été supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: "destructive",
      });
    }
  });

  const handleDelete = (id: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet anniversaire ?")) {
      deleteMutation.mutate(id);
    }
  };

  const displayBirthdays = searchQuery ? filteredBirthdays : birthdays;

  return (
    <div className="bg-[#F9FAFB] min-h-screen">
      <Container>
        <header className="mb-8 pt-8">
          <h1 className="text-3xl font-semibold text-center text-[#4F46E5]">Rappel d'Anniversaires</h1>
          <p className="text-center text-[#6B7280] mt-2">Gardez une trace des anniversaires importants de votre division</p>
        </header>

        <div className="lg:flex lg:space-x-8">
          <div className="lg:w-1/3 mb-8 lg:mb-0">
            {editingBirthdayId ? (
              <BirthdayEditForm 
                birthdayId={editingBirthdayId} 
                onSuccess={handleEditSuccess} 
                onCancel={handleCancelEdit} 
              />
            ) : (
              <BirthdayForm onSuccess={() => refetch()} />
            )}
          </div>
          
          <div className="lg:w-2/3">
            <BirthdayList 
              birthdays={displayBirthdays || []} 
              isLoading={isLoading || isSearchLoading} 
              onSearch={handleSearch}
              onEdit={handleEdit}
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
