import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PremiumPdfOptions {
  title?: string;
  brandName?: string;
  brandColor?: string; // hex
  accentColor?: string; // hex
  logoDataUrl?: string; // base64 image if available
}

// Utility to split long text with jsPDF
const addWrappedText = (doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 7) => {
  const lines = doc.splitTextToSize(text, maxWidth);
  lines.forEach((line, idx) => doc.text(line, x, y + idx * lineHeight));
  return y + lines.length * lineHeight;
};

export const generateUserExportPdf = async (exportData: any, opts: PremiumPdfOptions = {}) => {
  const {
    title = 'Syncora - Personal Data Export',
    brandName = 'Syncora',
    brandColor = '#3B82F6', // Tailwind blue-500
    accentColor = '#111827', // gray-900
    logoDataUrl,
  } = opts;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Helpers
  const hexToRgb = (hex: string): [number, number, number] => {
    const cleaned = hex.replace('#', '');
    const bigint = parseInt(cleaned.length === 3 ? cleaned.split('').map(c => c + c).join('') : cleaned, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
  };
  const brandRGB = hexToRgb(brandColor);

  // Premium Cover
  const gradientBarHeight = 140;
  doc.setFillColor(brandRGB[0], brandRGB[1], brandRGB[2]);
  doc.rect(0, 0, pageWidth, gradientBarHeight, 'F');

  // Optional logo
  if (logoDataUrl) {
    try {
      const logoWidth = 140;
      const logoHeight = 140 * 0.25;
      doc.addImage(logoDataUrl, 'PNG', 40, 30, logoWidth, logoHeight, undefined, 'FAST');
    } catch {}
  } else {
    // Text-based logo using brandName
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text((brandName || 'SYNCORA').toUpperCase(), 40, 60);
  }

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(title, 40, 90);

  // Meta panel
  const panelY = gradientBarHeight + 24;
  doc.setTextColor(33, 33, 33);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);

  const now = new Date();
  const meta = [
    ['Generated For', exportData?.profile?.email || 'Unknown'],
    ['Name', `${exportData?.profile?.firstName || ''} ${exportData?.profile?.lastName || ''}`.trim() || '—'],
    ['Generated On', now.toLocaleString()],
  ];

  // Card
  doc.setDrawColor(230);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(40, panelY, pageWidth - 80, 90, 8, 8, 'FD');

  // Meta content
  let ty = panelY + 26;
  doc.setFont('helvetica', 'bold');
  meta.forEach(([label, value]) => {
    doc.setTextColor(100);
    doc.text(String(label), 60, ty);
    doc.setTextColor(20);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), 200, ty);
    doc.setFont('helvetica', 'bold');
    ty += 22;
  });

  // Section: Profile Summary
  const sectionStartY = panelY + 120;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39); // gray-900
  doc.text('Profile Summary', 40, sectionStartY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55); // gray-800

  const summaryLines: string[] = [];
  const p = exportData?.profile || {};
  summaryLines.push(`Email: ${p.email || '—'}`);
  if (p.firstName || p.lastName) summaryLines.push(`Name: ${[p.firstName, p.lastName].filter(Boolean).join(' ')}`);
  if (p.role) summaryLines.push(`Role: ${p.role}`);
  if (p.subscriptionPlan) summaryLines.push(`Plan: ${p.subscriptionPlan}`);
  if (typeof p.storageUsedBytes !== 'undefined') summaryLines.push(`Storage Used: ${p.storageUsedBytes} bytes`);

  let y = addWrappedText(doc, summaryLines.join('\n'), 40, sectionStartY + 18, pageWidth - 80, 16);

  // Quick Overview Cards (counts)
  const tasks: any[] = Array.isArray(exportData?.tasks) ? exportData.tasks : [];
  const notesArr: any[] = Array.isArray(exportData?.notes) ? exportData.notes : [];
  const contactsArr: any[] = Array.isArray(exportData?.contacts) ? exportData.contacts : [];
  const completedTasks = tasks.filter((t: any) => String(t.status || '').toUpperCase().includes('COMPLET')).length;

  const cardsY = y + 10;
  const cardWidth = (pageWidth - 80 - 20) / 3; // 3 cards with 10px gaps
  const cardHeight = 60;
  const drawCard = (x: number, title: string, value: string) => {
    doc.setDrawColor(230);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, cardsY, cardWidth, cardHeight, 8, 8, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(title, x + 16, cardsY + 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(20);
    doc.text(value, x + 16, cardsY + 46);
  };

  drawCard(40, 'Total Tasks', String(tasks.length));
  drawCard(40 + cardWidth + 10, 'Completed Tasks', String(completedTasks));
  drawCard(40 + (cardWidth + 10) * 2, 'Notes / Contacts', `${notesArr.length} / ${contactsArr.length}`);
  y = cardsY + cardHeight + 10;

  // Section: Notification Settings (Table)
  const notif = [
    ['Email Notifications', String(p.emailNotifications ?? '—')],
    ['Push Notifications', String(p.pushNotifications ?? '—')],
    ['Chat Notifications', String(p.chatNotifications ?? '—')],
    ['Task Notifications', String(p.taskNotifications ?? '—')],
  ];

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Notification Settings', 40, y);
  y += 8;

  autoTable(doc, {
    startY: y + 8,
    headStyles: { fillColor: brandRGB as any, halign: 'left' } as any,
    styles: { fontSize: 10 },
    head: [["Setting", "Value"]],
    body: notif,
    theme: 'grid',
    margin: { left: 40, right: 40 },
  });

  // Next start position
  // @ts-ignore
  let currentY = (doc as any).lastAutoTable?.finalY || (y + 40);

  // Section: Tasks
  // tasks already defined above
  if (tasks.length) {
    currentY += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(17, 24, 39);
    doc.text('Tasks', 40, currentY);
    currentY += 8;

    const taskRows = tasks.map((t: any) => [
      String(t.title ?? '—'),
      String(t.status ?? '—'),
      String(t.priority ?? '—'),
      t.dueDate ? String(t.dueDate) : '—',
      t.createdAt ? String(t.createdAt) : '—',
    ]);

    autoTable(doc, {
      startY: currentY + 8,
      headStyles: { fillColor: brandRGB as any, halign: 'left' } as any,
      styles: { fontSize: 10 },
      head: [["Title", "Status", "Priority", "Due", "Created"]],
      body: taskRows,
      theme: 'grid',
      margin: { left: 40, right: 40 },
    });
    // @ts-ignore
    currentY = (doc as any).lastAutoTable?.finalY || currentY + 40;
  }

  // Section: Notes
  const notes = notesArr;
  if (notes.length) {
    currentY += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(17, 24, 39);
    doc.text('Notes', 40, currentY);
    currentY += 8;

    const noteRows = notes.map((n: any) => [
      String(n.title ?? '—'),
      n.starred ? 'Yes' : 'No',
      n.archived ? 'Yes' : 'No',
      Array.isArray(n.tags) ? n.tags.join(', ') : (n.tags ?? '—'),
      n.createdAt ? String(n.createdAt) : '—',
    ]);

    autoTable(doc, {
      startY: currentY + 8,
      headStyles: { fillColor: brandRGB as any, halign: 'left' } as any,
      styles: { fontSize: 10 },
      head: [["Title", "Starred", "Archived", "Tags", "Created"]],
      body: noteRows,
      theme: 'grid',
      margin: { left: 40, right: 40 },
    });
    // @ts-ignore
    currentY = (doc as any).lastAutoTable?.finalY || currentY + 40;
  }

  // Section: Contacts
  const contacts = contactsArr;
  if (contacts.length) {
    currentY += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(17, 24, 39);
    doc.text('Contacts', 40, currentY);
    currentY += 8;

    const contactRows = contacts.map((c: any) => [
      String(c.name ?? '—'),
      String(c.email ?? '—'),
      String(c.phone ?? '—'),
      String(c.organization ?? '—'),
      String(c.position ?? '—'),
    ]);

    autoTable(doc, {
      startY: currentY + 8,
      headStyles: { fillColor: brandRGB as any, halign: 'left' } as any,
      styles: { fontSize: 10 },
      head: [["Name", "Email", "Phone", "Organization", "Position"]],
      body: contactRows,
      theme: 'grid',
      margin: { left: 40, right: 40 },
    });
    // @ts-ignore
    currentY = (doc as any).lastAutoTable?.finalY || currentY + 40;
  }

  // Footer
  const addFooter = () => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`${brandName} • ${new Date().getFullYear()}`, 40, pageHeight - 24);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 100, pageHeight - 24);
    }
  };

  addFooter();
  return doc;
};
