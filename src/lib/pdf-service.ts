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
  const primaryColor = [30, 58, 138]; // Bleu nuit professionnel
  
  // --- EN-TÊTE DE L'AGENCE ---
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont(undefined, 'bold');
  doc.text(agency.name?.toUpperCase() || 'AGENCE IMMOBILIÈRE', 105, 25, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  const agencyInfo = `${agency.address || ''} | Tél: ${agency.phone || ''} | Email: ${agency.email || ''}`;
  doc.text(agencyInfo, 105, 32, { align: 'center' });
  
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(20, 38, 190, 38);

  // --- TITRE DU CONTRAT ---
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text("CONTRAT DE BAIL À USAGE D'HABITATION", 105, 55, { align: 'center' });

  let y = 75;
  doc.setFontSize(11);
  
  // --- LES PARTIES ---
  doc.setFillColor(245, 245, 245);
  doc.rect(20, y - 5, 170, 45, 'F');
  
  doc.text("ENTRE LES SOUSSIGNÉS :", 25, y);
  y += 10;
  
  doc.setFont(undefined, 'bold');
  doc.text("LE BAILLEUR :", 25, y);
  doc.setFont(undefined, 'normal');
  const bailleurText = `M/Mme ${agency.ownerName || 'Le Gérant'}, agissant pour le compte de l'agence ${agency.name || 'Gestion Pro'}, domicilié à ${agency.address || 'Dakar'}.`;
  const splitBailleur = doc.splitTextToSize(bailleurText, 130);
  doc.text(splitBailleur, 55, y);
  
  y += (splitBailleur.length * 6) + 2;
  
  doc.setFont(undefined, 'bold');
  doc.text("LE PRENEUR :", 25, y);
  doc.setFont(undefined, 'normal');
  doc.text(`M/Mme ${tenant.firstName} ${tenant.lastName}, titulaire de la pièce d'identité N° ${tenant.idNumber || '........'}.`, 55, y);

  y += 25;

  // --- ARTICLES ---
  const drawArticle = (title: string, content: string) => {
    doc.setFont(undefined, 'bold');
    doc.text(title, 20, y);
    y += 7;
    doc.setFont(undefined, 'normal');
    const splitContent = doc.splitTextToSize(content, 170);
    doc.text(splitContent, 20, y);
    y += (splitContent.length * 6) + 10;
  };

  drawArticle(
    "ARTICLE 1 : OBJET DU CONTRAT",
    `Le Bailleur donne en location au Preneur, qui accepte, les locaux désignés ci-après : un(e) ${tenant.unitName} situé(e) à l'adresse suivante : ${owner.address || 'Adresse non spécifiée'}.`
  );

  drawArticle(
    "ARTICLE 2 : DESTINATION DES LIEUX",
    "Les locaux loués sont destinés exclusivement à l'usage d'habitation. Le Preneur s'engage à ne rien faire qui puisse changer cette destination."
  );

  drawArticle(
    "ARTICLE 3 : MONTANT DU LOYER",
    `Le présent bail est consenti et accepté moyennant un loyer mensuel de ${formatNumber(tenant.rentAmount)} FCFA (Francs CFA). Le loyer est payable d'avance, au plus tard le 05 de chaque mois.`
  );

  drawArticle(
    "ARTICLE 4 : DURÉE DU CONTRAT",
    `Le présent contrat prend effet à compter du ${format(new Date(tenant.startDate), 'dd MMMM yyyy', { locale: fr })} pour une durée indéterminée, renouvelable par tacite reconduction.`
  );

  // --- SIGNATURES ---
  y = 235;
  doc.setFont(undefined, 'bold');
  const dateFait = format(new Date(), 'dd MMMM yyyy', { locale: fr });
  doc.text(`Fait à Dakar, le ${dateFait} en deux exemplaires originaux.`, 105, y, { align: 'center' });

  y += 15;
  doc.text("Le Preneur (Lu et approuvé)", 45, y, { align: 'center' });
  doc.text("Le Bailleur / L'Agence", 145, y, { align: 'center' });
  
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y + 5, 70, y + 5);
  doc.line(130, y + 5, 180, y + 5);

  doc.save(`Contrat_Bail_${tenant.lastName}.pdf`);
};

export const generateCautionPDF = (owner: Owner, tenant: Tenant, agency: Agency) => {
  const doc = new jsPDF();
  const primaryColor = [30, 58, 138];

  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont(undefined, 'bold');
  doc.text(agency.name?.toUpperCase() || 'AGENCE IMMOBILIÈRE', 105, 25, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(24);
  doc.text("REÇU DE CAUTION", 105, 60, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  let y = 90;
  const texte = `Je soussigné, ${agency.ownerName || 'le gérant'}, représentant l'agence ${agency.name || 'Gestion Pro'}, certifie avoir reçu de M/Mme ${tenant.firstName} ${tenant.lastName}, la somme de :`;
  const splitTexte = doc.splitTextToSize(texte, 170);
  doc.text(splitTexte, 20, y);

  y += 20;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(18);
  doc.text(`${formatNumber(tenant.rentAmount)} FCFA`, 105, y, { align: 'center' });
  
  y += 25;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(12);
  doc.text(`À titre de dépôt de garantie (Caution) pour le local situé à :`, 20, y);
  doc.setFont(undefined, 'bold');
  doc.text(`${owner.address || 'Adresse non spécifiée'}`, 20, y + 7);

  y = 220;
  const dateFait = format(new Date(), 'dd MMMM yyyy', { locale: fr });
  doc.text(`Fait à Dakar, le ${dateFait}`, 105, y, { align: 'center' });

  y += 25;
  doc.text("Signature du Preneur", 45, y, { align: 'center' });
  doc.text("Cachet et Signature Agence", 145, y, { align: 'center' });

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

  const footerY = 70;
  const generatedAt = format(new Date(), 'dd/MM/yyyy', { locale: fr });
  const footer = `Document généré le ${generatedAt}`;
  drawCenteredText({ page, font, text: footer, size: 9, y: footerY, color: rgb(0.4, 0.4, 0.4) });

  const out = await pdfDoc.save();
  downloadPdfBytes(out, `Quittance_${receipt.receiptNumber}.pdf`);
};