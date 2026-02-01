import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import { getRandomSubset } from "@/config/guideContent";

interface GuidePopoverProps {
  items: string[];
  count?: number;
  label?: string;
  title?: string;
}

export function GuidePopover({ items, count = 5, label = "Exemplos", title }: GuidePopoverProps) {
  const [displayItems, setDisplayItems] = useState<string[]>([]);

  const handleOpen = (open: boolean) => {
    if (open) {
      setDisplayItems(getRandomSubset(items, count));
    }
  };

  const refresh = () => {
    setDisplayItems(getRandomSubset(items, count));
  };

  return (
    <Popover onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="text-xs gap-1 h-7">
          <Lightbulb className="h-3 w-3" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4" align="start">
        {title && <p className="text-sm font-medium mb-2">{title}</p>}
        <ul className="space-y-2">
          {displayItems.map((item, i) => (
            <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
              <span className="text-primary font-medium shrink-0">{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3 text-xs w-full"
          onClick={refresh}
        >
          Mostrar outros exemplos
        </Button>
      </PopoverContent>
    </Popover>
  );
}
