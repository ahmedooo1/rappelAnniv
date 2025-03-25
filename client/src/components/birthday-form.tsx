import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { insertBirthdaySchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Extend schema for client-side validation
const birthdayFormSchema = insertBirthdaySchema.extend({
  name: z.string().min(1, "Le nom est requis"),
  birthdate: z.string().min(1, "La date de naissance est requise"),
  message: z.string().optional(),
});

type BirthdayFormValues = z.infer<typeof birthdayFormSchema>;

interface BirthdayFormProps {
  onSuccess: () => void;
}

export default function BirthdayForm({ onSuccess }: BirthdayFormProps) {
  const { toast } = useToast();

  const form = useForm<BirthdayFormValues>({
    resolver: zodResolver(birthdayFormSchema),
    defaultValues: {
      name: "",
      birthdate: "",
      message: "",
    },
  });

  const birthdayMutation = useMutation({
    mutationFn: async (data: BirthdayFormValues) => {
      // Convert birthdate string to Date object for the API
      const formattedData = {
        ...data,
        birthdate: new Date(data.birthdate),
      };
      const res = await apiRequest("POST", "/api/birthdays", formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/birthdays'] });
      toast({
        title: "Anniversaire ajouté",
        description: "L'anniversaire a été ajouté avec succès!",
      });
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `L'anniversaire n'a pas pu être ajouté: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BirthdayFormValues) => {
    birthdayMutation.mutate(data);
  };

  return (
    <Card className="bg-white shadow-md">
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold mb-4">Ajouter un anniversaire</h2>
        
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
            
            <Button 
              type="submit" 
              className="w-full bg-[#4F46E5] hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={birthdayMutation.isPending}
            >
              {birthdayMutation.isPending ? "Ajout en cours..." : "Ajouter"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
