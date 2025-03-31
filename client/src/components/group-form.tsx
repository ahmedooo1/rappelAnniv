import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { insertGroupSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type GroupFormValues = z.infer<typeof insertGroupSchema>;

export default function GroupForm({ onSuccess }) {
  const { toast } = useToast();
  const form = useForm<GroupFormValues>({
    resolver: zodResolver(insertGroupSchema),
  });

  const mutation = useMutation({
    mutationFn: async (values: GroupFormValues) => {
      const response = await apiRequest("POST", "/api/groups", values);
      if (!response.ok) {
        throw new Error("Erreur lors de la création du groupe");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Groupe créé avec succès" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erreur lors de la création du groupe", variant: "destructive" });
    },
  });

  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du groupe</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Identifiant</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Création..." : "Créer le groupe"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}