import { Container } from "../components/ui/container";
import { GroupCard } from "../components/group-card";
import { Button } from "../components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import GroupForm from "../components/group-form";

export default function Home() {
  const [showGroupForm, setShowGroupForm] = useState(false);
  const { data: groups, isLoading } = useQuery({
    queryKey: ['/api/groups'],
    queryFn: async () => {
      const response = await fetch('/api/groups');
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des groupes');
      }
      return response.json();
    },
  });

  return (
    <div className="bg-[#F9FAFB] min-h-screen">
      <Container>
        <header className="mb-8 pt-8">
          <h1 className="text-3xl font-semibold text-center text-[#4F46E5]">Groupes d'Anniversaires</h1>
          <p className="text-center text-[#6B7280] mt-2">Sélectionnez un groupe ou créez-en un nouveau</p>
        </header>

        <div className="mb-8">
          <Button onClick={() => setShowGroupForm(!showGroupForm)}>
            {showGroupForm ? "Annuler" : "Créer un nouveau groupe"}
          </Button>
        </div>

        {showGroupForm && <GroupForm onSuccess={() => setShowGroupForm(false)} />}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups?.map(group => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      </Container>
    </div>
  );
}