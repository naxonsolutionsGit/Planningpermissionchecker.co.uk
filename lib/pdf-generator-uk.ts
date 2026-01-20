// UK Professional Standards PDF Generation Function
// This is a helper file with the enhanced PDF generation code

const generateUKProfessionalPDF = async (result, propertyType) => {
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    let pageNumber = 1;

    // Generate UK-standard report reference
    const reportRef = `PDRC-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;
    const reportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Helper: Add page footer
    const addPageFooter = () => {
        const footerY = pageHeight - 15;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${pageNumber}`, pageWidth - 20, footerY, { align: 'right' });
        doc.text(reportRef, 15, footerY);
        doc.text('www.planningpermissionchecker.co.uk', pageWidth / 2, footerY, { align: 'center' });
        pageNumber++;
    };

    // Add header with professional styling
    doc.setFillColor(30, 122, 111); // Dark teal
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PLANNING CHECK REPORT', pageWidth / 2, 25, { align: 'center' });

    doc.setFontSize(10);
    doc.text('Professional Planning Assessment', pageWidth / 2, 32, { align: 'center' });

    yPosition = 55;

    // Property Information Section
    doc.setFillColor(245, 245, 245);
    doc.rect(10, yPosition - 5, pageWidth - 20, 8, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PROPERTY INFORMATION', 15, yPosition);

    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text(`Address: ${result.address}`, 15, yPosition);
    yPosition += 6;
    doc.text(`Local Authority: ${result.localAuthority}`, 15, yPosition);
    yPosition += 6;
    doc.text(`Report Date: ${reportDate}`, 15, yPosition);
    yPosition += 6;
    doc.text(`Report ID: ${reportRef}`, 15, yPosition);

    yPosition += 12;

    // Overall Result Section
    doc.setFillColor(245, 245, 245);
    doc.rect(10, yPosition - 5, pageWidth - 20, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('OVERALL ASSESSMENT', 15, yPosition);

    yPosition += 15;
    doc.setFontSize(11);

    if (result.hasPermittedDevelopmentRights) {
        doc.setTextColor(39, 174, 96); // Green
        doc.text('✓ PERMITTED DEVELOPMENT RIGHTS APPLY', 15, yPosition);
    } else {
        doc.setTextColor(231, 76, 60); // Red
        doc.text('✗ PLANNING PERMISSION LIKELY REQUIRED', 15, yPosition);
    }

    yPosition += 7;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text(`Confidence Level: ${result.confidence || 99}%`, 15, yPosition);

    yPosition += 12;

    // Detailed Checks Section
    doc.setFillColor(245, 245, 245);
    doc.rect(10, yPosition - 5, pageWidth - 20, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DETAILED PLANNING CHECKS', 15, yPosition);

    yPosition += 15;

    result.checks.forEach((check) => {
        if (yPosition > pageHeight - 40) {
            addPageFooter();
            doc.addPage();
            yPosition = 20;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');

        if (check.status === 'pass') {
            doc.setTextColor(39, 174, 96); // Green
            doc.text(`✓ ${check.type}`, 15, yPosition);
        } else if (check.status === 'fail') {
            doc.setTextColor(231, 76, 60); // Red
            doc.text(`✗ ${check.type}`, 15, yPosition);
        } else {
            doc.setTextColor(243, 156, 18); // Orange
            doc.text(`⚠ ${check.type}`, 15, yPosition);
        }

        yPosition += 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        const descriptionLines = doc.splitTextToSize(check.description, pageWidth - 30);
        doc.text(descriptionLines, 20, yPosition);
        yPosition += descriptionLines.length * 4 + 4;

        if (check.documentationUrl) {
            doc.setTextColor(41, 128, 185); // Blue
            doc.textWithLink('View official documentation', 20, yPosition, { url: check.documentationUrl });
            doc.setTextColor(0, 0, 0);
            yPosition += 5;
        }

        yPosition += 4;
    });

    // Planning History Section
    if (result.planningHistory && result.planningHistory.length > 0) {
        if (yPosition > pageHeight - 60) {
            addPageFooter();
            doc.addPage();
            yPosition = 20;
        }

        yPosition += 8;
        doc.setFillColor(245, 245, 245);
        doc.rect(10, yPosition - 5, pageWidth - 20, 8, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('PLANNING HISTORY', 15, yPosition);

        yPosition += 15;

        result.planningHistory.forEach((app) => {
            if (yPosition > pageHeight - 40) {
                addPageFooter();
                doc.addPage();
                yPosition = 20;
            }

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(`${app.reference || 'No Ref'} - ${app.status || 'No Status'}`, 15, yPosition);
            yPosition += 4;

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            const descLines = doc.splitTextToSize(app.description || 'No description', pageWidth - 30);
            doc.text(descLines, 15, yPosition);
            yPosition += descLines.length * 4 + 2;

            if (app.url) {
                doc.setTextColor(41, 128, 185); // Blue
                doc.textWithLink('View history details', 15, yPosition, { url: app.url });
                doc.setTextColor(0, 0, 0);
                yPosition += 5;
            }

            yPosition += 3;
        });
    }

    // Summary Section
    if (yPosition > pageHeight - 60) {
        addPageFooter();
        doc.addPage();
        yPosition = 20;
    }

    yPosition += 8;
    doc.setFillColor(245, 245, 245);
    doc.rect(10, yPosition - 5, pageWidth - 20, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('SUMMARY', 15, yPosition);

    yPosition += 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(result.summary, pageWidth - 30);
    doc.text(summaryLines, 15, yPosition);
    yPosition += summaryLines.length * 4 + 12;

    // Legal Disclaimer
    if (yPosition > pageHeight - 80) {
        addPageFooter();
        doc.addPage();
        yPosition = 20;
    }

    doc.setFillColor(252, 243, 207); // Light yellow background
    doc.rect(10, yPosition - 5, pageWidth - 20, 8, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('IMPORTANT LEGAL NOTICE', 15, yPosition);

    yPosition += 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    const disclaimerText = [
        'This report is generated based on publicly available planning data and is provided for informational purposes only.',
        `The accuracy of this report is estimated at ${result.confidence || 99}%.`,
        'This does not constitute professional planning advice or a definitive determination of planning status.',
        'Always consult with your local planning authority and seek professional advice before proceeding with any development.',
        'The creators of this report accept no liability for decisions made based on this information.'
    ];

    disclaimerText.forEach(line => {
        const lines = doc.splitTextToSize(line, pageWidth - 30);
        doc.text(lines, 15, yPosition);
        yPosition += lines.length * 3.5 + 2;
    });

    addPageFooter();

    // Save the PDF
    const fileName = `planning-report-${result.address.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
    doc.save(fileName);
};

export { generateUKProfessionalPDF };
