import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
}

export default function InfoModal({
  open,
  onOpenChange,
  title,
  content,
}: InfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-ocid="info.dialog">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-brand-forest">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {content}
        </div>
        <button
          type="button"
          data-ocid="info.close_button"
          onClick={() => onOpenChange(false)}
          className="mt-4 w-full rounded-full bg-brand-forest text-white py-2 text-sm font-medium hover:bg-brand-forest/90 transition-colors"
        >
          Close
        </button>
      </DialogContent>
    </Dialog>
  );
}
