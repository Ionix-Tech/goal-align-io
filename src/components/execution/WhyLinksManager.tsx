import { useState } from "react";
import { Plus, Link2, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface WhyLink {
  id: string;
  url: string;
  label?: string;
}

interface WhyLinksManagerProps {
  links: WhyLink[];
  onLinksChange: (links: WhyLink[]) => void;
  readonly?: boolean;
}

export const WhyLinksManager = ({ links, onLinksChange, readonly = false }: WhyLinksManagerProps) => {
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddLink = () => {
    if (!newUrl.trim()) return;
    
    // Validar URL
    let urlToAdd = newUrl.trim();
    if (!urlToAdd.startsWith('http://') && !urlToAdd.startsWith('https://')) {
      urlToAdd = 'https://' + urlToAdd;
    }

    const newLink: WhyLink = {
      id: crypto.randomUUID(),
      url: urlToAdd,
      label: newLabel.trim() || undefined
    };

    onLinksChange([...links, newLink]);
    setNewUrl("");
    setNewLabel("");
    setIsAdding(false);
  };

  const handleRemoveLink = (id: string) => {
    onLinksChange(links.filter(l => l.id !== id));
  };

  return (
    <div className="space-y-3">
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((link) => (
            <div 
              key={link.id} 
              className="flex items-center gap-2 p-2 bg-muted/50 rounded-md group"
            >
              <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <a 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 text-sm text-primary hover:underline truncate"
              >
                {link.label || link.url}
              </a>
              <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              {!readonly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveLink(link.id)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {!readonly && (
        <>
          {isAdding ? (
            <div className="space-y-2 p-3 border border-dashed rounded-md">
              <div className="space-y-2">
                <Label className="text-xs">URL do Link *</Label>
                <Input
                  placeholder="https://exemplo.com/documento"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Título (opcional)</Label>
                <Input
                  placeholder="Ex: Relatório de análise"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddLink}
                  disabled={!newUrl.trim()}
                >
                  Adicionar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAdding(false);
                    setNewUrl("");
                    setNewLabel("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-dashed"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Link de Referência
            </Button>
          )}
        </>
      )}
    </div>
  );
};
