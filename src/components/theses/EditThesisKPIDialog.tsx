import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUpdateThesisKPI } from "@/hooks/useThesisKPIs";
import type { ThesisKPI } from "@/hooks/useThesisDetails";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  current_value: z.coerce.number().optional(),
  target_value: z.coerce.number().min(0, "Meta deve ser um número positivo"),
  unit: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditThesisKPIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpi: ThesisKPI | null;
}

export function EditThesisKPIDialog({
  open,
  onOpenChange,
  kpi,
}: EditThesisKPIDialogProps) {
  const updateKPI = useUpdateThesisKPI();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      current_value: 0,
      target_value: 0,
      unit: "",
    },
  });

  useEffect(() => {
    if (kpi) {
      form.reset({
        name: kpi.name,
        description: kpi.description || "",
        current_value: kpi.current_value ?? 0,
        target_value: kpi.target_value,
        unit: kpi.unit || "",
      });
    }
  }, [kpi, form]);

  const onSubmit = async (data: FormData) => {
    if (!kpi) return;
    
    await updateKPI.mutateAsync({
      id: kpi.id,
      thesis_id: kpi.thesis_id,
      name: data.name,
      description: data.description || null,
      current_value: data.current_value ?? null,
      target_value: data.target_value,
      unit: data.unit || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar KPI</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do KPI</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Faturamento mensal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o indicador..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="current_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Atual</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: %, R$, unidades" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateKPI.isPending}>
                {updateKPI.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
