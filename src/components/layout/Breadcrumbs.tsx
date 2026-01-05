import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

interface BreadcrumbConfig {
  label: string;
  parent?: { label: string; href?: string };
}

// Configuração baseada na estrutura do sidebar
const routeConfig: Record<string, BreadcrumbConfig> = {
  // Páginas sob "Estratégia"
  "/theses": { 
    label: "Objetivos", 
    parent: { label: "Estratégia" }
  },
  "/prioritization": { 
    label: "Priorização", 
    parent: { label: "Estratégia" }
  },
  "/portfolio": { 
    label: "Portfólio", 
    parent: { label: "Estratégia" }
  },
  
  // Páginas de nível raiz
  "/management": { label: "Gestão e Execução" },
  "/intelligence": { label: "Inteligência" },
  "/settings": { label: "Configurações" },
  
  // Ações rápidas
  "/quick-idea": { 
    label: "Nova Ideia", 
    parent: { label: "Estratégia" }
  },
  "/create-project": { 
    label: "Novo Projeto A3", 
    parent: { label: "Estratégia" }
  },
};

interface BreadcrumbsProps {
  customSegments?: { label: string; href?: string }[];
}

export function Breadcrumbs({ customSegments }: BreadcrumbsProps) {
  const location = useLocation();
  const pathname = location.pathname;

  // Build breadcrumb items
  const items: { label: string; href?: string }[] = [];

  // Handle custom segments (for dynamic routes like project details)
  if (customSegments) {
    items.push(...customSegments);
  } else {
    // Handle static routes
    const config = routeConfig[pathname];
    
    if (config) {
      // Adicionar parent se existir
      if (config.parent) {
        items.push({ 
          label: config.parent.label, 
          href: config.parent.href 
        });
      }
      // Adicionar página atual
      items.push({ label: config.label });
    } else {
      // Handle dynamic routes by path segments
      const segments = pathname.split("/").filter(Boolean);
      
      if (segments[0] === "theses" && segments[1]) {
        items.push({ label: "Estratégia" });
        items.push({ label: "Objetivos", href: "/theses" });
        items.push({ label: "Detalhes" });
      } else if (segments[0] === "management" && segments[1]) {
        items.push({ label: "Gestão e Execução", href: "/management" });
        items.push({ label: "Projeto" });
      } else if (segments[0] === "projects" && segments[1]) {
        items.push({ label: "Estratégia" });
        items.push({ label: "Priorização", href: "/prioritization" });
        if (segments[2] === "a3") {
          items.push({ label: "Projeto A3" });
        } else if (segments[2] === "structure") {
          items.push({ label: "Estruturação" });
        } else {
          items.push({ label: "Projeto" });
        }
      }
    }
  }

  // Don't render if no items or only one item at root level
  if (items.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <Fragment key={index}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>
                    {item.label}
                  </BreadcrumbPage>
                ) : item.href ? (
                  <BreadcrumbLink asChild>
                    <Link to={item.href}>
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <span className="text-muted-foreground">
                    {item.label}
                  </span>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
