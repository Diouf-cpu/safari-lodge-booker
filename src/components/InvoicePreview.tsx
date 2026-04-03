import { RATE_PER_NIGHT } from '@/data/parks';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { MessageCircle, Mail, Printer, X, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceItem {
  parkName: string;
  siteName: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  totalAmount: number;
  siteVoucherNo?: string;
}

interface InvoicePreviewProps {
  group: {
    voucherNo: string;
    companyName: string;
    contactEmail: string;
    contactPhone: string;
    items: InvoiceItem[];
    grandTotal: number;
  };
  onClose: () => void;
  onConfirm: () => void;
}

function generatePDF(group: InvoicePreviewProps['group']) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('BOGA', 20, 25);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Botswana Guides Association', 20, 32);
  doc.text('Maun, Botswana', 20, 37);

  doc.setFontSize(10);
  doc.text('INVOICE', pageWidth - 20, 20, { align: 'right' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${group.voucherNo}`, pageWidth - 20, 28, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(), 'dd MMM yyyy'), pageWidth - 20, 34, { align: 'right' });

  // Separator
  doc.setDrawColor(200);
  doc.line(20, 44, pageWidth - 20, 44);

  // Bill To
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text('BILLED TO', 20, 54);
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(group.companyName, 20, 61);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(group.contactEmail, 20, 67);
  doc.text(group.contactPhone, 20, 73);

  // Table
  const tableData = group.items.map(item => [
    `${item.parkName}\n${item.siteName}`,
    item.siteVoucherNo || '-',
    `${format(new Date(item.arrivalDate), 'dd MMM')} - ${format(new Date(item.departureDate), 'dd MMM yyyy')}`,
    item.nights.toString(),
    `P${item.totalAmount.toLocaleString()}`,
  ]);

  autoTable(doc, {
    startY: 82,
    head: [['Park / Site', 'Site Voucher', 'Dates', 'Nights', 'Amount']],
    body: tableData,
    theme: 'plain',
    headStyles: { fillColor: [245, 240, 230], textColor: [80, 70, 60], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30 },
      4: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 20, right: 20 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  doc.setFontSize(9);
  doc.text(`Rate per night: P${RATE_PER_NIGHT}`, pageWidth - 20, finalY, { align: 'right' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Due: P${group.grandTotal.toLocaleString()}`, pageWidth - 20, finalY + 10, { align: 'right' });

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text('This booking is subject to confirmation by BOGA administration.', pageWidth / 2, finalY + 25, { align: 'center' });
  doc.text('Payment must be made to confirm your reservation.', pageWidth / 2, finalY + 30, { align: 'center' });

  doc.save(`BOGA-Invoice-${group.voucherNo}.pdf`);
}

export function InvoicePreview({ group, onClose, onConfirm }: InvoicePreviewProps) {
  const invoiceText = `BOGA Campsite Booking Invoice\n\nVoucher: ${group.voucherNo}\nCompany: ${group.companyName}\nEmail: ${group.contactEmail}\nPhone: ${group.contactPhone}\n\nBookings:\n${group.items.map(b => `• ${b.parkName} - ${b.siteName}${b.siteVoucherNo ? ` (${b.siteVoucherNo})` : ''}: ${b.arrivalDate} to ${b.departureDate} (${b.nights} nights) = P${b.totalAmount.toLocaleString()}`).join('\n')}\n\nTotal: P${group.grandTotal.toLocaleString()}\nRate: P${RATE_PER_NIGHT}/night`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(invoiceText)}`;
  const emailUrl = `mailto:${group.contactEmail}?subject=BOGA Booking Invoice - ${group.voucherNo}&body=${encodeURIComponent(invoiceText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-display text-xl font-bold">Booking Invoice Preview</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-6">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="font-display text-2xl font-bold text-secondary">BOGA</h3>
              <p className="text-sm text-muted-foreground">Botswana Guides Association</p>
              <p className="text-sm text-muted-foreground">Maun, Botswana</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Invoice</p>
              <p className="font-mono text-lg font-bold">#{group.voucherNo}</p>
              <p className="text-sm text-muted-foreground">{format(new Date(), 'dd MMM yyyy')}</p>
            </div>
          </div>

          {/* Bill To */}
          <div className="bg-muted/50 rounded-xl p-4 mb-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Billed to</p>
            <p className="font-semibold">{group.companyName}</p>
            <p className="text-sm text-muted-foreground">{group.contactEmail}</p>
            <p className="text-sm text-muted-foreground">{group.contactPhone}</p>
          </div>

          {/* Items Table */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 font-medium text-muted-foreground">Park / Site</th>
                <th className="text-left py-3 font-medium text-muted-foreground">Site Voucher</th>
                <th className="text-left py-3 font-medium text-muted-foreground">Dates</th>
                <th className="text-center py-3 font-medium text-muted-foreground">Nights</th>
                <th className="text-right py-3 font-medium text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {group.items.map((item, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-3">
                    <p className="font-medium">{item.parkName}</p>
                    <p className="text-muted-foreground text-xs">{item.siteName}</p>
                  </td>
                  <td className="py-3 font-mono text-xs text-muted-foreground">{item.siteVoucherNo || '—'}</td>
                  <td className="py-3 text-muted-foreground">
                    {format(new Date(item.arrivalDate), 'dd MMM')} — {format(new Date(item.departureDate), 'dd MMM yyyy')}
                  </td>
                  <td className="py-3 text-center">{item.nights}</td>
                  <td className="py-3 text-right font-medium">P{item.totalAmount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-2 text-sm text-muted-foreground">
                <span>Rate per night</span>
                <span>P{RATE_PER_NIGHT}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-foreground font-display text-lg font-bold">
                <span>Total Due</span>
                <span>P{group.grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mb-6">
            This booking is subject to confirmation by BOGA administration. Payment must be made to confirm your reservation.
          </p>

          {/* Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button onClick={() => generatePDF(group)} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            <Button asChild className="bg-whatsapp hover:bg-whatsapp/90 text-whatsapp-foreground">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={emailUrl}>
                <Mail className="h-4 w-4 mr-2" /> Email
              </a>
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          </div>
        </div>

        <div className="p-6 border-t bg-muted/30">
          <Button onClick={onConfirm} className="w-full amber-glow text-accent-foreground border-0 font-semibold py-6">
            Confirm & Submit Booking
          </Button>
        </div>
      </div>
    </div>
  );
}
