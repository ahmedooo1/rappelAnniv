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
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const birthdayFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  birthdate: z.string().min(1, "La date de naissance est requise"),
  message: z.string().optional(),
  groupId: z.number().default(1),
});

type BirthdayFormValues = z.infer<typeof birthdayFormSchema>;

interface BirthdayFormProps {
  onSuccess: () => void;
}

export function BirthdayForm({ onSuccess }: BirthdayFormProps) {
  const { toast } = useToast();

  const form = useForm<BirthdayFormValues>({
    resolver: zodResolver(birthdayFormSchema),
    defaultValues: {
      name: "",
      birthdate: "",
      message: "",
      groupId: 1,
    },
  });

  const birthdayMutation = useMutation({
    mutationFn: async (data: BirthdayFormValues) => {
      const response = await fetch('/api/birthdays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout de l\'anniversaire');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/birthdays'] });
      form.reset();
      toast({
        title: "Succès",
        description: "L'anniversaire a été ajouté avec succès",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
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
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
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
                  <FormLabel>Date de naissance</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormLabel>Message (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notes ou préférences..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={birthdayMutation.isPending}
            >
              {birthdayMutation.isPending ? "Ajout en cours..." : "Ajouter l'anniversaire"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}