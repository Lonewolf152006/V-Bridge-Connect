import os
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf():
    output_path = os.path.join(os.getcwd(), 'VIT_Uma_Mam_Groups_Demo.pdf')
    doc = SimpleDocTemplate(
        output_path,
        pagesize=landscape(letter),
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#1E293B'),
        alignment=1, # Center
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#4F46E5'),
        alignment=1, # Center
        spaceAfter=15
    )
    cell_style = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#1E293B')
    )
    cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#0F172A')
    )
    header_style = ParagraphStyle(
        'HeaderCell',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#FFFFFF')
    )

    story = []

    # Title & Subtitle
    story.append(Paragraph("Vidyalankar Institute of Technology (VIT) — Department of Electronics & Computer Science", title_style))
    story.append(Paragraph("Semester 5 Mini-Project Guide Allocation Roster — Dr. Uma Jaishankar Cohort", subtitle_style))

    # Table Header & Rows matching institutional PDF structure
    headers = [
        Paragraph("Group ID", header_style),
        Paragraph("Name of 1st Group Member", header_style),
        Paragraph("Name of 2nd Group Member", header_style),
        Paragraph("Name of 3rd Group Member", header_style),
        Paragraph("Name of 4th Group Member", header_style),
        Paragraph("Guide Allotted", header_style),
    ]

    data = [headers]

    uma_groups = [
        ("EXCS-5-Mini-2", "Arya Suryavanshi", "Riya Lepkar", "Shreeya Joshi", "NA", "Dr. Uma Jaishankar"),
        ("EXCS-5-Mini-4", "Atharva Gadi", "Neil Khadakban", "Arya Tendulkar", "Karan Thakre", "Dr. Uma Jaishankar"),
        ("EXCS-5-Mini-10", "Parth gulbhile", "Tanmay gunjal", "Chhavi Talele", "Anugrah Jamdaade", "Dr. Uma Jaishankar"),
    ]

    for g_id, m1, m2, m3, m4, guide in uma_groups:
        row = [
            Paragraph(f"<b>{g_id}</b>", cell_bold),
            Paragraph(m1, cell_style),
            Paragraph(m2, cell_style),
            Paragraph(m3, cell_style),
            Paragraph(m4, cell_style),
            Paragraph(f"<b>{guide}</b>", cell_bold),
        ]
        data.append(row)

    col_widths = [100, 130, 130, 130, 120, 110]
    table = Table(data, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#312E81')), # Indigo-900
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]))

    story.append(table)
    doc.build(story)
    print(f"Generated PDF successfully: {output_path}")

if __name__ == '__main__':
    generate_pdf()
