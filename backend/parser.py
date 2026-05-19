import re
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Handle optional heavy parsing dependencies gracefully for zero-dependency local runs
try:
    import fitz # PyMuPDF
    HAS_FITZ = True
except ImportError:
    logger.warning("PyMuPDF (fitz) not found. PDF parsing branch is deactivated.")
    HAS_FITZ = False

try:
    import docx
    HAS_DOCX = True
except ImportError:
    logger.warning("python-docx not found. Word document parsing branch is deactivated.")
    HAS_DOCX = False

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    logger.warning("pandas not found. Excel spreadsheet parsing branch is deactivated.")
    HAS_PANDAS = False


def clean_text(text: str) -> str:
    if not text:
        return ""
    # Normalize multiple whitespace characters
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def is_likely_question(text: str) -> bool:
    cleaned = text.strip()
    if not cleaned:
        return False
    # A line ending with a question mark
    if cleaned.endswith("?"):
        return True
    # Question prefix indicators
    question_prefixes = [
        "what ", "how ", "why ", "when ", "where ", "who ", "which ", "does ", "do ", 
        "is ", "are ", "can ", "could ", "would ", "please describe", "explain ", 
        "describe ", "provide detail", "outline "
    ]
    cleaned_lower = cleaned.lower()
    if any(cleaned_lower.startswith(prefix) for prefix in question_prefixes) and len(cleaned) > 15:
        return True
    return False

def parse_pdf(file_path: str) -> Dict[str, Any]:
    """
    Parses a PDF document, extracts structural text layout, 
    and clusters paragraphs to find potential questions.
    """
    if not HAS_FITZ:
        logger.warning(f"PyMuPDF is not installed. Skipping PDF parse for: {file_path}")
        return {"full_text": "", "questions": []}
    doc = fitz.open(file_path)
    full_text = []
    extracted_questions = []
    
    current_section = "General"
    
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text_instances = page.get_text("blocks") # (x0, y0, x1, y1, text, block_no, block_type)
        
        # Sort blocks vertically, then horizontally
        sorted_instances = sorted(text_instances, key=lambda b: (b[1], b[0]))
        
        for instance in sorted_instances:
            block_text = clean_text(instance[4])
            if not block_text:
                continue
            
            # Simple Section Header heuristic (short bold-looking line, uppercase, etc.)
            if len(block_text) < 80 and (re.match(r'^\d+(\.\d+)*\s+[A-Z]', block_text) or block_text.isupper()):
                current_section = block_text
                continue
                
            full_text.append(block_text)
            
            # Check if this text block contains a question
            if is_likely_question(block_text):
                extracted_questions.append({
                    "raw_text": block_text,
                    "section_name": current_section,
                    "context_breadcrumbs": f"Page {page_num+1} > {current_section}"
                })
                
    return {
        "full_text": "\n".join(full_text),
        "questions": extracted_questions
    }

def parse_docx(file_path: str) -> Dict[str, Any]:
    """
    Parses a DOCX file, traversing hierarchical headings, normal text, 
    and tables, maintaining paragraph and column references.
    """
    if not HAS_DOCX:
        logger.warning(f"python-docx is not installed. Skipping DOCX parse for: {file_path}")
        return {"full_text": "", "questions": []}
    doc = docx.Document(file_path)
    full_text = []
    extracted_questions = []
    
    current_section = "General"
    
    # Process regular paragraphs
    for para in doc.paragraphs:
        block_text = clean_text(para.text)
        if not block_text:
            continue
            
        # Detect Heading style or structural title
        if para.style.name.startswith('Heading') or (len(block_text) < 100 and block_text.isupper()):
            current_section = block_text
            continue
            
        full_text.append(block_text)
        
        if is_likely_question(block_text):
            extracted_questions.append({
                "raw_text": block_text,
                "section_name": current_section,
                "context_breadcrumbs": f"Paragraph > {current_section}"
            })
            
    # Process tables
    for t_idx, table in enumerate(doc.tables):
        # Scan cells in tables
        for row_idx, row in enumerate(table.rows):
            for col_idx, cell in enumerate(row.cells):
                cell_text = clean_text(cell.text)
                if not cell_text:
                    continue
                
                # Check for questions inside tables (common in security questionnaires)
                if is_likely_question(cell_text):
                    extracted_questions.append({
                        "raw_text": cell_text,
                        "section_name": f"Table {t_idx+1} Row {row_idx+1}",
                        "context_breadcrumbs": f"Table {t_idx+1} > Row {row_idx+1} Col {col_idx+1}"
                    })
                    
    return {
        "full_text": "\n".join(full_text),
        "questions": extracted_questions
    }

def parse_spreadsheet(file_path: str) -> Dict[str, Any]:
    """
    Parses spreadsheets (XLSX, CSV) using pandas, traversing cells 
    to extract structural question tables.
    """
    if not HAS_PANDAS:
        logger.warning(f"pandas is not installed. Skipping Excel parse for: {file_path}")
        return {"full_text": "", "questions": []}
    # For spreadsheets, we read sheet by sheet
    xls = pd.ExcelFile(file_path)
    extracted_questions = []
    full_texts = []
    
    for sheet_name in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet_name, header=None)
        
        for r_idx, row in df.iterrows():
            for c_idx, val in enumerate(row):
                if pd.isna(val):
                    continue
                val_str = clean_text(str(val))
                if not val_str:
                    continue
                
                full_texts.append(val_str)
                
                if is_likely_question(val_str):
                    extracted_questions.append({
                        "raw_text": val_str,
                        "section_name": f"Sheet: {sheet_name}",
                        "context_breadcrumbs": f"Sheet {sheet_name} > Cell R{r_idx+1}C{c_idx+1}"
                    })
                    
    return {
        "full_text": "\n".join(full_texts),
        "questions": extracted_questions
    }

def parse_document(file_path: str, file_type: str) -> Dict[str, Any]:
    """
    Routes document parsing based on file extensions.
    """
    file_type = file_type.lower().strip()
    if file_type == "pdf":
        return parse_pdf(file_path)
    elif file_type in ["docx", "doc"]:
        return parse_docx(file_path)
    elif file_type in ["xlsx", "xls", "csv"]:
        return parse_spreadsheet(file_path)
    else:
        # Fallback to plain text
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        lines = content.split("\n")
        extracted_questions = []
        for l_idx, line in enumerate(lines):
            cleaned = clean_text(line)
            if is_likely_question(cleaned):
                extracted_questions.append({
                    "raw_text": cleaned,
                    "section_name": "Plain Text Ingest",
                    "context_breadcrumbs": f"Line {l_idx+1}"
                })
        return {
            "full_text": content,
            "questions": extracted_questions
        }
