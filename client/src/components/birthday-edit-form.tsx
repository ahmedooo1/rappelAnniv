import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { insertBirthdaySchema, type Birthday } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useEffect } from "react";

// Extend schema for client-side validation
const birthdayFormSchema = insertBirthdaySchema.extend({
  name: z.string().min(1, "Le nom est requis"),
  birthdate: z.string().min(1, "La date de naissance est requise"),
  message: z.string().optional(),
});

type BirthdayFormValues = z.infer<typeof birthdayFormSchema>;

interface BirthdayEditFormProps {
  birthdayId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BirthdayEditForm({ birthdayId, onSuccess, onCancel }: BirthdayEditFormProps) {
  const { toast } = useToast();

  const form = useForm<BirthdayFormValues>({
    resolver: zodResolver(birthdayFormSchema),
    defaultValues: {
      name: "",
      birthdate: "",
      message: "",
    },
  });

  // Fetch the birthday data
  const { data: birthday, isLoading } = useQuery({
    queryKey: ['/api/birthdays', birthdayId],
    queryFn: async () => {
      const response = await fetch(`/api/birthdays/${birthdayId}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de l\'anniversaire');
      }
      return response.json() as Promise<Birthday>;
    },
  });

  // Update form when data is loaded
  useEffect(() => {
    if (birthday) {
      // Format the date to YYYY-MM-DD for the date input
      const formattedDate = format(new Date(birthday.birthdate), 'yyyy-MM-dd');
      
      form.reset({
        name: birthday.name,
        birthdate: formattedDate,
        message: birthday.message || "",
      });
    }
  }, [birthday, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: BirthdayFormValues) => {
      // Convert birthdate string to the expected format for the API
      const formattedData = {
        ...data,
      };
      const res = await apiRequest("PUT", `/api/birthdays/${birthdayId}`, formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/birthdays'] });
      toast({
        title: "Anniversaire mis à jour",
        description: "L'anniversaire a été mis à jour avec succès!",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `L'anniversaire n'a pas pu être mis à jour: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BirthdayFormValues) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow-md">
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-4">Chargement des données...</h2>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-md">
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold mb-4">Modifier l'anniversaire</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Nom</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Prénom et nom" 
                      {...field} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="birthdate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Date de naissance</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Message (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ajouter un message personnel" 
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700"
                onClick={onCancel}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-[#4F46E5] hover:bg-indigo-700 text-white font-medium transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Mise à jour..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}