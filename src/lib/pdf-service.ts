import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Owner, Tenant, Receipt, Agency } from '../types/rental';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

export const generateReceiptPDF = async (receipt: Receipt, agency: Agency) => {
  const doc = new jsPDF();
  const primaryColor = [30, 58, 138];
  
  // --- EN-TÊTE ---
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont(undefined, 'bold');
  doc.text(agency.name?.toUpperCase() || 'AGENCE IMMOBILIÈRE', 105, 25, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  const agencyInfo = `${agency.address || ''} | Tél: ${agency.phone || ''} | Email: ${agency.email || ''}`;
  doc.text(agencyInfo, 105, 32, { align: 'center' });
  
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(20, 38, 190, 38);

  // --- TITRE ---
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text("QUITTANCE DE LOYER", 105, 55, { align: 'center' });
  
  doc.setFontSize(11);
  doc.text(`N° ${receipt.receiptNumber}`, 105, 62, { align: 'center' });

  // --- CADRE RÉCAPITULATIF ---
  let y = 80;
  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(20, y, 170, 80, 3, 3, 'FD');

  y += 12;
  const drawRow = (label: string, value: string) => {
    doc.setFont(undefined, 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(label, 30, y);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(value, 80, y);
    y += 12;
  };

  drawRow("Locataire :", receipt.tenantName);
  drawRow("Local :", receipt.unitName || "Non spécifié");
  drawRow("Adresse :", receipt.propertyAddress || "Non spécifiée");
  drawRow("Période :", `Du ${receipt.periodStart} au ${receipt.periodEnd}`);
  drawRow("Montant :", `${formatNumber(receipt.amount)} FCFA`);

  // --- TEXTE LÉGAL ---
  y += 15;
  doc.setFontSize(10);
  const legalText = `Je soussigné, ${agency.ownerName || 'le gérant'}, représentant l'agence ${agency.name || 'Gestion Pro'}, donne quittance à M/Mme ${receipt.tenantName} pour le paiement de la somme de ${formatNumber(receipt.amount)} FCFA au titre du loyer et des charges pour la période mentionnée ci-dessus.`;
  const splitLegal = doc.splitTextToSize(legalText, 170);
  doc.text(splitLegal, 20, y);

  // --- SIGNATURE ---
  y = 220;
  const dateFait = format(new Date(), 'dd MMMM yyyy', { locale: fr });
  doc.setFont(undefined, 'bold');
  doc.text(`Fait à Dakar, le ${dateFait}`, 105, y, { align: 'center' });

  y += 20;
  doc.text("Cachet et Signature de l'Agence", 145, y, { align: 'center' });
  
  doc.setDrawColor(200, 200, 200);
  doc.line(120, y + 5, 180, y + 5);

  doc.save(`Quittance_${receipt.receiptNumber}.pdf`);
};