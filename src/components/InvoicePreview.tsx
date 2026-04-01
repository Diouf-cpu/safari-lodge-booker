import { BookingGroup } from '@/data/types';
import { RATE_PER_NIGHT } from '@/data/parks';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { MessageCircle, Mail, Printer, X } from 'lucide-react';

interface InvoicePreviewProps {
  group: {
    voucherNo: string;
    companyName: string;
    contactEmail: string;
    contactPhone: string;
    items: { parkName: string; siteName: string; arrivalDate: string; departureDate: string; nights: number; totalAmount: number }[];
    grandTotal: number;
  };
  onClose: () => void;
  onConfirm: () => void;
}

export function InvoicePreview({ group, onClose, onConfirm }: InvoicePreviewProps) {
  const invoiceText = `BOGA Campsite Booking Invoice\n\nVoucher: ${group.voucherNo}\nCompany: ${group.companyName}\nEmail: ${group.contactEmail}\nPhone: ${group.contactPhone}\n\nBookings:\n${group.items.map(b => `• ${b.parkName} - ${b.siteName}: ${b.arrivalDate} to ${b.departureDate} (${b.nights} nights) = P${b.totalAmount.toLocaleString()}`).join('\n')}\n\nTotal: P${group.grandTotal.toLocaleString()}\nRate: P${RATE_PER_NIGHT}/night`;

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
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1 bg-green-600 hover:bg-green-700 text-accent-foreground">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-2" /> Send via WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <a href={emailUrl}>
                <Mail className="h-4 w-4 mr-2" /> Send via Email
              </a>
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="flex-1">
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
