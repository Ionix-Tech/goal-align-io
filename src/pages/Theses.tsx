import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Theses() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Teses Estratégicas</h1>
        <p className="text-muted-foreground">
          Gerencie as teses estratégicas da organização
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta seção está sendo preparada para gerenciamento de teses estratégicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Em breve você poderá criar, editar e acompanhar as teses estratégicas da organização.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
