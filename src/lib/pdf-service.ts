import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Owner, Tenant, Receipt, Agency } from '../types/rental';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const formatNumber = (num: any) => {
  const n = typeof num === 'number' ? num : parseFloat(num);
  if (isNaN(n)) return "0";
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export const generateLeasePDF = (owner: Owner, tenant: Tenant, agency: Agency) => {
  const doc = new jsPDF();
  const primaryColor = [124, 58, 237]; 
  
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont(undefined, 'bold');
  doc.text(agency.name || 'AGENCE IMMOBILIÈRE', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`${agency.address || ''} | Tél: ${agency.phone || ''}`, 105, 27, { align: 'center' });
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.line(20, 35, 190, 35);

  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text("CONTRAT DE BAIL À USAGE D'HABITATION", 105, 50, { align: 'center' });

  let y = 70;
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text("ENTRE LES SOUSSIGNÉS :", 20, y);
  
  y += 10;
  doc.text("LE BAILLEUR :", 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(`M/Mme ${agency.ownerName || 'Le Propriétaire'}, représenté par l'agence ${agency.name}`, 55, y);
  
  y += 10;
  doc.setFont(undefined, 'bold');
  doc.text("LE PRENEUR :", 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(`M/Mme ${tenant.firstName} ${tenant.lastName}, ID: ${tenant.idNumber || 'N/A'}`, 55, y);

  y += 20;
  doc.setFont(undefined, 'bold');
  doc.text("ARTICLE 1 : OBJET", 20, y);
  y += 7;
  doc.setFont(undefined, 'normal');
  doc.text(`Location d'un local (${tenant.unitName}) sis à ${owner.address || 'Adresse non spécifiée'}.`, 20, y);

  y += 15;
  doc.setFont(undefined, 'bold');
  doc.text("ARTICLE 2 : LOYER", 20, y);
  y += 7;
  doc.setFont(undefined, 'normal');
  doc.text(`Fixé à ${formatNumber(tenant.rentAmount)} FCFA par mois.`, 20, y);

  y = 220;
  doc.setFont(undefined, 'bold');
  const dateFait = format(new Date(), 'dd MMMM yyyy', { locale: fr });
  doc.text(`Fait à Dakar, le ${dateFait}`, 105, y, { align: 'center' });

  y += 15;
  doc.text("Le Preneur", 40, y);
  doc.text("Le Bailleur / Agence", 140, y);
  doc.line(20, y + 10, 80, y + 10);
  doc.line(130, y + 10, 190, y + 10);

  doc.save(`Bail_${tenant.lastName}.pdf`);
};

export const generateCautionPDF = (owner: Owner, tenant: Tenant, agency: Agency) => {
  const doc = new jsPDF();
  const primaryColor = [124, 58, 237];

  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(agency.name || 'AGENCE IMMOBILIÈRE', 105, 20, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(24);
  doc.text("REÇU DE CAUTION", 105, 50, { align: 'center' });

  doc.setFontSize(12);
  let y = 80;
  const texte = `Je soussigné, ${agency.ownerName || 'le gérant'}, de l'agence ${agency.name}, certifie avoir reçu de M/Mme ${tenant.firstName} ${tenant.lastName}, la somme de :`;
  const splitTexte = doc.splitTextToSize(texte, 170);
  doc.text(splitTexte, 20, y);

  y += 15;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(16);
  doc.text(`${formatNumber(tenant.rentAmount)} FCFA`, 105, y, { align: 'center' });
  
  y += 20;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(12);
  doc.text(`À titre de dépôt de garantie (Caution) pour le local situé à :`, 20, y);
  doc.text(`${owner.address || 'Adresse non spécifiée'}`, 20, y + 7);

  y = 210;
  doc.setFont(undefined, 'bold');
  const dateFait = format(new Date(), 'dd MMMM yyyy', { locale: fr });
  doc.text(`Fait à Dakar, le ${dateFait}`, 105, y, { align: 'center' });

  y += 20;
  doc.text("Signature du Preneur", 40, y);
  doc.text("Signature du Bailleur", 140, y);
  doc.line(20, y + 10, 80, y + 10);
  doc.line(130, y + 10, 190, y + 10);

  doc.save(`Recu_Caution_${tenant.lastName}.pdf`);
};

const downloadPdfBytes = (bytes: Uint8Array, filename: string) => {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const drawCenteredText = (args: {
  page: any;
  font: any;
  text: string;
  size: number;
  y: number;
  color?: ReturnType<typeof rgb>;
}) => {
  const { page, font, text, size, y, color = rgb(0, 0, 0) } = args;
  const { width } = page.getSize();
  const textWidth = font.widthOfTextAtSize(text, size);
  const x = Math.max(20, (width - textWidth) / 2);
  page.drawText(text, { x, y, size, font, color });
};

export const generateReceiptPDF = async (receipt: Receipt, agency: Agency) => {
  const templateUrl = '/templates/quittance-modele.pdf';
  const res = await fetch(templateUrl);
  if (!res.ok) throw new Error('Impossible de charger le modèle de quittance.');

  const bytes = await res.arrayBuffer();
  const pdfDoc = await PDFDocument.load(bytes);
  const page = pdfDoc.getPages()[0];
  const { height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // En-tête (sur le modèle)
  const agencyTitle = agency.name || 'AGENCE IMMOBILIÈRE';
  drawCenteredText({ page, font: fontBold, text: agencyTitle, size: 14, y: height - 70, color: rgb(0.15, 0.2, 0.55) });

  const headerLine = [
    agency.address?.trim() ? agency.address.trim() : null,
    agency.phone?.trim() ? `Tél: ${agency.phone.trim()}` : null,
    agency.email?.trim() ? `Mail: ${agency.email.trim()}` : null,
    agency.rccm?.trim() ? `RC: ${agency.rccm.trim()}` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  if (headerLine) {
    drawCenteredText({ page, font, text: headerLine, size: 9, y: height - 85, color: rgb(0.35, 0.35, 0.35) });
  }

  drawCenteredText({ page, font: fontBold, text: 'QUITTANCE DE LOYER', size: 18, y: height - 140, color: rgb(0, 0, 0) });

  // Champs (positionnement simple et lisible)
  const leftX = 60;
  const valueX = 185;
  const startY = height - 200;
  const lineGap = 22;

  const labelColor = rgb(0.25, 0.25, 0.25);
  const valueColor = rgb(0, 0, 0);

  const drawRow = (i: number, label: string, value: string) => {
    const y = startY - i * lineGap;
    page.drawText(label, { x: leftX, y, size: 11, font: fontBold, color: labelColor });
    page.drawText(value, { x: valueX, y, size: 11, font, color: valueColor });
  };

  drawRow(0, 'Quittance N° :', receipt.receiptNumber);
  drawRow(1, 'Locataire :', receipt.tenantName);
  drawRow(2, 'Montant :', `${formatNumber(receipt.amount)} FCFA`);

  const period = `${receipt.periodStart || 'N/A'} au ${receipt.periodEnd || 'N/A'}`;
  drawRow(3, 'Période :', period);

  if (receipt.paymentDate) {
    drawRow(4, 'Date paiement :', receipt.paymentDate);
  }

  // Mention en bas
  const footerY = 70;
  const generatedAt = format(new Date(), 'dd/MM/yyyy', { locale: fr });
  const footer = `Document généré le ${generatedAt}`;
  drawCenteredText({ page, font, text: footer, size: 9, y: footerY, color: rgb(0.4, 0.4, 0.4) });

  const out = await pdfDoc.save();
  downloadPdfBytes(out, `Quittance_${receipt.receiptNumber}.pdf`);
};