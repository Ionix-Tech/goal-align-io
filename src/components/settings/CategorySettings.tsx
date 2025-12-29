import { PROJECT_CATEGORIES } from "@/config/categories";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tags } from "lucide-react";

export function CategorySettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Categorias de Projetos
          </CardTitle>
          <CardDescription>
            Categorias disponíveis para classificação de projetos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROJECT_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.value} className="relative overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${category.colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{category.label}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {category.value}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            As categorias são predefinidas e não podem ser alteradas no momento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
