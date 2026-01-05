import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import { Fragment } from "react";

interface BreadcrumbConfig {
  label: string;
  parent?: string;
}

const routeLabels: Record<string, BreadcrumbConfig> = {
  "/": { label: "Dashboard" },
  "/prioritization": { label: "Priorização" },
  "/portfolio": { label: "Portfólio" },
  "/theses": { label: "Objetivos Estratégicos" },
  "/management": { label: "Gestão" },
  "/intelligence": { label: "Inteligência" },
  "/settings": { label: "Configurações" },
  "/quick-idea": { label: "Nova Ideia" },
  "/create-project": { label: "Novo Projeto A3" },
};

interface BreadcrumbsProps {
  customSegments?: { label: string; href?: string }[];
}

export function Breadcrumbs({ customSegments }: BreadcrumbsProps) {
  const location = useLocation();
  const pathname = location.pathname;

  // Build breadcrumb items
  const items: { label: string; href?: string }[] = [];

  // Always start with home
  if (pathname !== "/") {
    items.push({ label: "Dashboard", href: "/" });
  }

  // Handle custom segments (for dynamic routes like project details)
  if (customSegments) {
    items.push(...customSegments);
  } else {
    // Handle static routes
    const config = routeLabels[pathname];
    if (config) {
      items.push({ label: config.label });
    } else {
      // Handle dynamic routes by path segments
      const segments = pathname.split("/").filter(Boolean);
      
      if (segments[0] === "theses" && segments[1]) {
        items.push({ label: "Objetivos Estratégicos", href: "/theses" });
        items.push({ label: "Detalhes da Tese" });
      } else if (segments[0] === "management" && segments[1]) {
        items.push({ label: "Gestão", href: "/management" });
        items.push({ label: "Execução do Projeto" });
      } else if (segments[0] === "projects" && segments[1]) {
        items.push({ label: "Priorização", href: "/prioritization" });
        if (segments[2] === "a3") {
          items.push({ label: "Projeto A3" });
        } else if (segments[2] === "structure") {
          items.push({ label: "Estruturação" });
        } else {
          items.push({ label: "Detalhes do Projeto" });
        }
      }
    }
  }

  // Don't render if only one item (current page with no parents)
  if (items.length <= 1 && pathname === "/") {
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
                  <BreadcrumbPage className="flex items-center gap-1.5">
                    {index === 0 && pathname !== "/" && <Home className="h-3.5 w-3.5" />}
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.href || "/"} className="flex items-center gap-1.5">
                      {index === 0 && <Home className="h-3.5 w-3.5" />}
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
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
