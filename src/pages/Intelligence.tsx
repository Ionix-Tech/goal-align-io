import { Brain } from "lucide-react";

const Intelligence = () => {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Inteligência</h1>
        </div>
        <p className="text-muted-foreground">
          Análises e insights sobre o portfolio de projetos.
        </p>
      </div>
    </div>
  );
};

export default Intelligence;
