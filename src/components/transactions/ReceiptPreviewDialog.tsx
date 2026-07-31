import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReceiptPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptUrl: string | null;
  transactionTitle: string;
}

const ReceiptPreviewDialog = ({
  open,
  onOpenChange,
  receiptUrl,
  transactionTitle,
}: ReceiptPreviewDialogProps) => {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadReceipt = async () => {
      if (!open || !receiptUrl) {
        setDisplayUrl(null);
        return;
      }

      if (/^https?:\/\//i.test(receiptUrl)) {
        setDisplayUrl(receiptUrl);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase.storage
        .from("receipts")
        .createSignedUrl(receiptUrl, 300);

      if (!cancelled) {
        setIsLoading(false);
        if (error) {
          setDisplayUrl(null);
          toast.error("Could not securely load this receipt.");
        } else {
          setDisplayUrl(data.signedUrl);
        }
      }
    };

    void loadReceipt();
    return () => {
      cancelled = true;
    };
  }, [open, receiptUrl]);

  const handleDownload = async () => {
    if (!displayUrl) return;

    try {
      const response = await fetch(displayUrl);
      if (!response.ok) throw new Error("Receipt download failed");

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const extension = receiptUrl?.split("?")[0].split(".").pop() || "file";
      link.href = objectUrl;
      link.download = `receipt-${transactionTitle.replace(/\s+/g, "-")}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error("Could not download this receipt.");
    }
  };

  const isPDF = receiptUrl?.split("?")[0].toLowerCase().endsWith(".pdf");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle>Receipt Preview - {transactionTitle}</DialogTitle>
            <Button
              onClick={handleDownload}
              size="sm"
              variant="outline"
              disabled={!displayUrl || isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Download
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-4 max-h-[70vh] overflow-auto">
          {isLoading && (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading receipt" />
            </div>
          )}
          {!isLoading && displayUrl && (
            isPDF ? (
              <iframe
                src={displayUrl}
                className="h-[600px] w-full rounded-lg border"
                title="Receipt PDF"
                sandbox=""
              />
            ) : (
              <img
                src={displayUrl}
                alt={`Receipt for ${transactionTitle}`}
                className="h-auto w-full rounded-lg"
              />
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptPreviewDialog;
