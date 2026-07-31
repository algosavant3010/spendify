import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const MonthlyReportButton = () => {
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("monthly-report");
      if (error) {
        const msg = (error as any).message || "";
        if (msg.includes("429")) toast.error("Rate limited. Try again shortly.");
        else if (msg.includes("402")) toast.error("AI credits exhausted.");
        else toast.error("Failed to generate report");
        return;
      }

      const doc = new jsPDF();
      const W = doc.internal.pageSize.getWidth();

      // Header banner
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, W, 38, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("Spendify Monthly Report", 14, 18);
      doc.setFontSize(11);
      doc.text(data.month, 14, 28);

      let y = 50;
      doc.setTextColor(20, 20, 20);
      doc.setFontSize(14);
      doc.text(data.headline || "Your monthly summary", 14, y);
      y += 12;

      // Numbers grid
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("INCOME", 14, y);
      doc.text("EXPENSES", 74, y);
      doc.text("NET SAVINGS", 134, y);
      y += 8;
      doc.setFontSize(16);
      doc.setTextColor(16, 185, 129);
      doc.text(`Rs ${Math.round(data.income).toLocaleString("en-IN")}`, 14, y);
      doc.setTextColor(239, 68, 68);
      doc.text(`Rs ${Math.round(data.expenses).toLocaleString("en-IN")}`, 74, y);
      doc.setTextColor(59, 130, 246);
      doc.text(`Rs ${Math.round(data.net).toLocaleString("en-IN")}`, 134, y);
      y += 14;

      const section = (title: string, items: string[]) => {
        if (!items?.length) return;
        doc.setFontSize(13);
        doc.setTextColor(20, 20, 20);
        doc.text(title, 14, y);
        y += 7;
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        items.forEach((it) => {
          const lines = doc.splitTextToSize(`• ${it}`, W - 28);
          doc.text(lines, 18, y);
          y += lines.length * 5 + 1;
        });
        y += 4;
      };

      section("Wins", data.wins || []);
      section("Concerns", data.concerns || []);
      section("Action Plan", data.actionPlan || []);

      if (data.topCategories?.length) {
        autoTable(doc, {
          startY: y,
          head: [["Category", "This Month", "Last Month", "Change"]],
          body: data.topCategories.map((c: any) => {
            const change = c.prev > 0 ? `${(((c.amount - c.prev) / c.prev) * 100).toFixed(0)}%` : "—";
            return [c.name, `Rs ${Math.round(c.amount).toLocaleString("en-IN")}`, `Rs ${Math.round(c.prev).toLocaleString("en-IN")}`, change];
          }),
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246] },
        });
      }

      doc.save(`spendify-report-${data.month.replace(/\s/g, "-")}.pdf`);
      toast.success("Report downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={generate} disabled={loading} variant="outline" size="sm" className="btn-glow">
      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
      AI Monthly Report
    </Button>
  );
};

export default MonthlyReportButton;
