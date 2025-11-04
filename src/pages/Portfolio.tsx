import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Portfolio() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Portfólio Estratégico</h1>
        <p className="text-muted-foreground">
          Visão consolidada do portfólio de projetos estratégicos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta seção está sendo preparada para exibir o portfólio completo de projetos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Em breve você poderá visualizar e analisar todo o portfólio estratégico da organização.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
