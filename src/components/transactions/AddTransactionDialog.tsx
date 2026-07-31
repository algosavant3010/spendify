import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, RepeatIcon, Sparkles, Camera, Scan, Loader2, Mic } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import VoiceTransactionInput from "@/components/voice/VoiceTransactionInput";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const AddTransactionDialog = ({ open, onOpenChange, userId }: AddTransactionDialogProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    type: "expense" as "income" | "expense",
    categoryId: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringFrequency: "monthly" as "daily" | "weekly" | "monthly" | "yearly",
  });
  const [file, setFile] = useState<File | null>(null);
  const [isDetectingCategory, setIsDetectingCategory] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories", userId, formData.type],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .eq("type", formData.type);
      return data;
    },
  });

  const handleReceiptScan = async (selectedFile: File) => {
    setIsScanning(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to use receipt scanning");
        return;
      }

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setPreviewImage(base64);

        try {
          const { data, error } = await supabase.functions.invoke('scan-receipt', {
            body: { imageBase64: base64 },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (error) {
            console.error("Scan error:", error);
            if (error.message?.includes('429')) {
              toast.error("Rate limit exceeded. Please try again later.");
            } else if (error.message?.includes('402')) {
              toast.error("AI service requires payment.");
            } else {
              toast.error("Failed to scan receipt. Please try again.");
            }
            return;
          }

          if (data?.success && data?.data) {
            const extracted = data.data;
            
            // Auto-fill form with extracted data
            setFormData(prev => ({
              ...prev,
              title: extracted.title || prev.title,
              amount: extracted.amount?.toString() || prev.amount,
              description: extracted.description || prev.description,
              date: extracted.date || prev.date,
            }));

            // Try to match suggested category
            if (extracted.suggestedCategory && categories) {
              const matchedCategory = categories.find(
                (cat) => cat.name.toLowerCase().includes(extracted.suggestedCategory.toLowerCase()) ||
                         extracted.suggestedCategory.toLowerCase().includes(cat.name.toLowerCase())
              );
              if (matchedCategory) {
                setFormData(prev => ({ ...prev, categoryId: matchedCategory.id }));
              }
            }

            toast.success("Receipt scanned successfully!");
          } else {
            toast.error("Could not extract data from receipt");
          }
        } catch (err) {
          console.error("Scan error:", err);
          toast.error("Failed to scan receipt");
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("File read error:", error);
      toast.error("Failed to read image file");
      setIsScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Receipts must be a JPG, PNG, or PDF file.");
      e.target.value = "";
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("Receipts must be 5 MB or smaller.");
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
    if (selectedFile.type === "image/jpeg" || selectedFile.type === "image/png") {
      handleReceiptScan(selectedFile);
    }
  };

  const detectCategory = async () => {
    if (!formData.title || !formData.amount) {
      toast.error("Please enter title and amount first");
      return;
    }

    setIsDetectingCategory(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to use AI category detection");
        return;
      }

      const { data, error } = await supabase.functions.invoke('detect-category', {
        body: {
          title: formData.title,
          description: formData.description,
          amount: parseFloat(formData.amount),
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Error detecting category:", error);
        if (error.message?.includes('429')) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else if (error.message?.includes('402')) {
          toast.error("AI service requires payment. Please contact support.");
        } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          toast.error("Please sign in to use AI category detection.");
        } else {
          toast.error(`Failed to detect category: ${error.message || 'Please try again.'}`);
        }
        return;
      }

      const suggestedCategoryName = data.category;
      const matchedCategory = categories?.find(
        (cat) => cat.name.toLowerCase() === suggestedCategoryName.toLowerCase()
      );

      if (matchedCategory) {
        setFormData({ ...formData, categoryId: matchedCategory.id });
        toast.success(`Category detected: ${matchedCategory.name}`);
      } else {
        toast.info(`Suggested: ${suggestedCategoryName}, but no matching category found`);
      }
    } catch (error) {
      console.error('Error detecting category:', error);
      toast.error('Failed to detect category');
    } finally {
      setIsDetectingCategory(false);
    }
  };

  const createTransaction = useMutation({
    mutationFn: async () => {
      let receiptUrl = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        receiptUrl = fileName;
      }

      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        title: formData.title,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category_id: formData.categoryId || null,
        description: formData.description,
        date: formData.date,
        receipt_url: receiptUrl,
        is_recurring: formData.isRecurring,
        recurring_frequency: formData.isRecurring ? formData.recurringFrequency : null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["spending-chart"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Transaction added successfully!");
      onOpenChange(false);
      setFormData({
        title: "",
        amount: "",
        type: "expense",
        categoryId: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        isRecurring: false,
        recurringFrequency: "monthly",
      });
      setFile(null);
      setPreviewImage(null);
    },
    onError: (error) => {
      console.error("Error creating transaction:", error);
      toast.error("Failed to add transaction");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Add Transaction
          </DialogTitle>
          <DialogDescription>Record a new income or expense</DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); createTransaction.mutate(); }} className="space-y-4">
          {/* Quick Add Section - Receipt & Voice */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 hover:border-primary/50 transition-colors"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <span className="font-medium">Quick Add</span>
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                Use voice or upload a receipt to auto-fill
              </p>

              {/* Voice Input */}
              <VoiceTransactionInput
                onTranscriptParsed={(data) => {
                  setFormData(prev => ({
                    ...prev,
                    title: data.title || prev.title,
                    amount: data.amount || prev.amount,
                    type: data.type || prev.type,
                    description: data.description || prev.description,
                  }));
                  // Try to match category
                  if (data.suggestedCategory && categories) {
                    const matched = categories.find(
                      (cat) => cat.name.toLowerCase().includes(data.suggestedCategory!.toLowerCase())
                    );
                    if (matched) {
                      setFormData(prev => ({ ...prev, categoryId: matched.id }));
                    }
                  }
                }}
              />

              <div className="flex items-center gap-2 w-full">
                <div className="flex-1 border-t" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 border-t" />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="gap-2"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      Upload Receipt
                    </>
                  )}
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                className="hidden"
              />

              <AnimatePresence>
                {previewImage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full max-w-[200px]"
                  >
                    <img
                      src={previewImage}
                      alt="Receipt preview"
                      className="w-full h-auto rounded-lg border shadow-sm"
                    />
                    {isScanning && (
                      <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Analyzing...</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value: "income" | "expense") => setFormData({ ...formData, type: value, categoryId: "" })}>
                <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="space-y-2"
          >
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Grocery shopping"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <Label htmlFor="category">Category</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={detectCategory}
                disabled={isDetectingCategory}
                className="gap-1 text-primary hover:text-primary/80 transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                {isDetectingCategory ? "Detecting..." : "AI Detect"}
              </Button>
            </div>
            <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
              <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="space-y-2"
          >
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add notes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 min-h-[60px]"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="space-y-2"
          >
            <Label htmlFor="receipt">Additional Receipt (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="receipt"
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleFileChange}
                className="cursor-pointer transition-all duration-200"
              />
              {file && <Upload className="h-4 w-4 text-success" />}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4 p-4 rounded-lg border bg-muted/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RepeatIcon className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="recurring" className="cursor-pointer">Recurring Transaction</Label>
              </div>
              <Switch
                id="recurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked })}
              />
            </div>

            <AnimatePresence>
              {formData.isRecurring && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select 
                    value={formData.recurringFrequency} 
                    onValueChange={(value: "daily" | "weekly" | "monthly" | "yearly") => 
                      setFormData({ ...formData, recurringFrequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="flex gap-2 justify-end pt-2"
          >
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="transition-all duration-200 hover:bg-muted"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTransaction.isPending}
              className="transition-all duration-200 hover:shadow-glow"
            >
              {createTransaction.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Transaction"
              )}
            </Button>
          </motion.div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;
