import { ClipboardCheck } from "lucide-react";

const Management = () => {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <ClipboardCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Gestão e Execução</h1>
        </div>
        <p className="text-muted-foreground">
          Acompanhamento e execução dos projetos estratégicos.
        </p>
      </div>
    </div>
  );
};

export default Management;
