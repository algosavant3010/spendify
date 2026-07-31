import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: string;
  date: string;
  description?: string;
  categories?: {
    name: string;
  };
}

export const exportToCSV = (transactions: Transaction[], filename: string = 'transactions.csv') => {
  const headers = ['Date', 'Title', 'Category', 'Type', 'Amount', 'Description'];
  
  const csvContent = [
    headers.join(','),
    ...transactions.map(t => [
      t.date,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.categories?.name || 'Uncategorized'}"`,
      t.type,
      t.amount,
      `"${(t.description || '').replace(/"/g, '""')}"`
    ].join(','))
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
};

export const exportToPDF = (transactions: Transaction[], filename: string = 'transactions.pdf') => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.setTextColor(99, 102, 241); // Primary color
  doc.text('Spendify - Transaction Report', 14, 20);
  
  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 28);
  
  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalIncome - totalExpenses;
  
  // Add summary section
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Summary', 14, 38);
  
  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129); // Success color
  doc.text(`Total Income: $${totalIncome.toFixed(2)}`, 14, 46);
  doc.setTextColor(239, 68, 68); // Destructive color
  doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 14, 52);
  doc.setTextColor(99, 102, 241); // Primary color
  doc.text(`Balance: $${balance.toFixed(2)}`, 14, 58);
  
  // Add transactions table
  const tableData = transactions.map(t => [
    t.date,
    t.title,
    t.categories?.name || 'Uncategorized',
    t.type,
    `$${Number(t.amount).toFixed(2)}`,
    t.description || '-'
  ]);
  
  autoTable(doc, {
    startY: 68,
    head: [['Date', 'Title', 'Category', 'Type', 'Amount', 'Description']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 20 },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 'auto' }
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    didParseCell: (data) => {
      if (data.column.index === 3 && data.cell.raw === 'income') {
        data.cell.styles.textColor = [16, 185, 129];
      } else if (data.column.index === 3 && data.cell.raw === 'expense') {
        data.cell.styles.textColor = [239, 68, 68];
      }
    }
  });
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  doc.save(filename);
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
