from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
import io

class ResumeService:
    @staticmethod
    def generate_pdf(data: dict):
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # Header
        p.setFont("Times-Bold", 24)
        p.drawCentredString(width/2.0, height - 0.5*inch, data.get("name", "Name"))
        
        p.setFont("Times-Roman", 10)
        contact = f"{data.get('phone', '')} | {data.get('email', '')} | {data.get('linkedin', '')} | {data.get('github', '')}"
        p.drawCentredString(width/2.0, height - 0.75*inch, contact)

        # Sections
        y = height - 1.25*inch
        
        def draw_section(title, content):
            nonlocal y
            p.setFont("Times-Bold", 11)
            p.drawString(0.5*inch, y, title.upper())
            p.line(0.5*inch, y - 2, width - 0.5*inch, y - 2)
            y -= 20
            p.setFont("Times-Roman", 10)
            for line in str(content).split('\n'):
                p.drawString(0.5*inch, y, line)
                y -= 12
            y -= 10

        draw_section("Education", data.get("education", ""))
        draw_section("Experience", data.get("experience", ""))
        draw_section("Skills", data.get("skills", ""))

        p.showPage()
        p.save()
        buffer.seek(0)
        return buffer.getvalue()
