import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAddThesisKPIMeasurement } from "@/hooks/useThesisKPIMeasurements";
import type { ThesisKPI } from "@/hooks/useThesisDetails";

const formSchema = z.object({
  measured_value: z.coerce.number(),
  measurement_date: z.date(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddKPIMeasurementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpi: ThesisKPI | null;
}

export function AddKPIMeasurementDialog({
  open,
  onOpenChange,
  kpi,
}: AddKPIMeasurementDialogProps) {
  const addMeasurement = useAddThesisKPIMeasurement();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      measured_value: kpi?.current_value ?? 0,
      measurement_date: new Date(),
      notes: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!kpi) return;
    
    await addMeasurement.mutateAsync({
      kpi_id: kpi.id,
      thesis_id: kpi.thesis_id,
      measured_value: data.measured_value,
      measurement_date: format(data.measurement_date, "yyyy-MM-dd"),
      notes: data.notes || null,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Medição: {kpi?.name}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="measurement_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Medição</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="measured_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Valor Medido {kpi?.unit && `(${kpi.unit})`}
                  </FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione observações sobre esta medição..."
                      className="resize-none"
                      {...field}
                    />
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
              <Button type="submit" disabled={addMeasurement.isPending}>
                {addMeasurement.isPending ? "Salvando..." : "Registrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
