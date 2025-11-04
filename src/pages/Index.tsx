import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Target, TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="text-center space-y-8 p-8 max-w-2xl">
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary rounded-2xl">
              <Target className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight">COMPASS</h1>
          <p className="text-xl text-muted-foreground">
            Sistema de Gestão de Portfolio de Projetos Estratégicos
          </p>
        </div>

        <div className="pt-4">
          <Button 
            size="lg" 
            onClick={() => navigate("/create-project")}
            className="text-lg px-8 py-6"
          >
            <TrendingUp className="mr-2 h-5 w-5" />
            Criar Novo Projeto
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
