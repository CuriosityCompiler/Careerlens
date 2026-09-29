"""Document extraction and OCR module for PDF, Word (DOCX/DOC), TXT, and Images."""
import io
import os
import logging
from typing import Tuple

log = logging.getLogger("careerlens.extractor")

def extract_text_from_pdf(content_bytes: bytes) -> str:
    """Extract text from PDF using pypdf, with OCR fallback if scanned."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(content_bytes))
        extracted = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                extracted.append(text)
        full_text = "\n".join(extracted).strip()
        if len(full_text) >= 50:
            return full_text
        log.info("PDF has very little native text, attempting OCR...")
    except Exception as e:
        log.warning(f"pypdf extraction failed: {e}")

    # Fallback to OCR if pypdf yielded sparse text (scanned PDF)
    return extract_text_with_ocr(content_bytes, is_pdf=True)

def extract_text_from_docx(content_bytes: bytes) -> str:
    """Extract text from Word .docx file using python-docx."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(content_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        # Also extract table text
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    paragraphs.append(row_text)
        return "\n".join(paragraphs).strip()
    except Exception as e:
        log.warning(f"python-docx extraction failed: {e}")
        return ""

def extract_text_with_ocr(content_bytes: bytes, is_pdf: bool = False) -> str:
    """OCR engine for image files or scanned documents using PyTesseract or Gemini Vision."""
    # 1. Try PyTesseract if available
    try:
        import pytesseract
        from PIL import Image
        if not is_pdf:
            image = Image.open(io.BytesIO(content_bytes))
            text = pytesseract.image_to_string(image)
            if len(text.strip()) > 30:
                return text.strip()
    except Exception as e:
        log.info(f"Local pytesseract unavailable or failed ({e}); checking Gemini Vision OCR...")

    # 2. Try Gemini Multimodal OCR if GEMINI_API_KEY is available
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if gemini_key:
        try:
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=gemini_key)
            mime_type = "application/pdf" if is_pdf else "image/png"
            part = types.Part.from_bytes(data=content_bytes, mime_type=mime_type)
            resp = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    part,
                    "Extract and return all the raw text from this resume document accurately, maintaining section headings, bullet points, and formatting. Do not add commentary."
                ]
            )
            if resp.text and len(resp.text.strip()) > 30:
                return resp.text.strip()
        except Exception as e:
            log.warning(f"Gemini OCR failed: {e}")

    return ""

def extract_document_text(filename: str, content_bytes: bytes) -> Tuple[str, str]:
    """
    Main extraction dispatcher.
    Returns: (extracted_text, method_used)
    """
    fn_lower = filename.lower()

    if fn_lower.endswith(".pdf"):
        text = extract_text_from_pdf(content_bytes)
        return text, "pdf_extractor"

    if fn_lower.endswith((".docx", ".doc")):
        text = extract_text_from_docx(content_bytes)
        return text, "docx_extractor"

    if fn_lower.endswith((".png", ".jpg", ".jpeg", ".webp")):
        text = extract_text_with_ocr(content_bytes, is_pdf=False)
        return text, "ocr_vision"

    # Default to utf-8 text
    try:
        text = content_bytes.decode("utf-8", errors="ignore")
        return text, "plain_text"
    except Exception:
        return "", "unknown"
