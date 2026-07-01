#!/usr/bin/env python3
"""
Script de OCR usando Tesseract para extrair dados de documentos
Banco Millennium Atlântico - Sistema de Crédito
"""

import sys
import json
import re
import os
from pathlib import Path
from typing import Dict, Any, Optional

try:
    import pytesseract
    from PIL import Image
    import cv2
    import numpy as np
    from pdf2image import convert_from_path
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"Dependências não instaladas: {str(e)}. Execute: pip install pytesseract pillow opencv-python pdf2image",
        "confidence": 0
    }))
    sys.exit(1)


class DocumentOCR:
    """Classe para processamento OCR de documentos"""
    
    def __init__(self):
        # Configurar caminho do Tesseract
        tesseract_path = os.getenv(
            'TESSERACT_PATH', 
            r'C:\Users\Antonio.Januario\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'
        )
        
        if os.path.exists(tesseract_path):
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
        else:
            # Tentar caminho padrão
            default_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
            if os.path.exists(default_path):
                pytesseract.pytesseract.tesseract_cmd = default_path
        
        # Configurar caminho do Poppler
        self.poppler_path = r'C:\Users\Antonio.Januario\AppData\Local\Programs\poppler\Library\bin'
        
        # Configurar Tesseract para português
        self.config = '--psm 6 --oem 3 -l por'
    
    def preprocess_image(self, image_path: str) -> np.ndarray:
        """Pré-processar imagem para melhorar OCR"""
        try:
            # Carregar imagem
            img = cv2.imread(image_path)
            
            # Converter para escala de cinza
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Aplicar threshold adaptativo
            thresh = cv2.adaptiveThreshold(
                gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY, 11, 2
            )
            
            # Remover ruído
            denoised = cv2.fastNlMeansDenoising(thresh)
            
            return denoised
        except Exception as e:
            # Se falhar, retornar imagem original
            return cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    
    def extract_text(self, image_path: str) -> str:
        """Extrair texto da imagem usando Tesseract"""
        try:
            # Verificar se é PDF
            if image_path.lower().endswith('.pdf'):
                # Converter PDF para imagens (passando o caminho do poppler)
                images = convert_from_path(
                    image_path, 
                    first_page=1, 
                    last_page=1, 
                    dpi=300,
                    poppler_path=self.poppler_path
                )
                if not images:
                    raise Exception("Não foi possível converter PDF para imagem")
                
                # Salvar primeira página como imagem temporária
                temp_image_path = image_path.replace('.pdf', '_temp.jpg')
                images[0].save(temp_image_path, 'JPEG')
                
                # Processar imagem temporária
                processed_img = self.preprocess_image(temp_image_path)
                
                # Executar OCR
                text = pytesseract.image_to_string(
                    processed_img, 
                    config=self.config
                )
                
                # Remover arquivo temporário
                try:
                    os.remove(temp_image_path)
                except:
                    pass
                
                return text
            else:
                # Processar imagem normal
                processed_img = self.preprocess_image(image_path)
                
                # Executar OCR
                text = pytesseract.image_to_string(
                    processed_img, 
                    config=self.config
                )
                
                return text
        except Exception as e:
            raise Exception(f"Erro ao extrair texto: {str(e)}")
    
    def extract_bi_data(self, image_path: str) -> Dict[str, Any]:
        """Extrair dados de um Bilhete de Identidade"""
        text = self.extract_text(image_path)
        
        data = {}
        confidence_scores = []
        
        # Extrair nome
        name_patterns = [
            r"Nome[:\s]*(.+?)(?:\n|$)",
            r"NOME[:\s]*(.+?)(?:\n|$)",
            r"Apelidos?[:\s]*(.+?)(?:\n|$)",
        ]
        for pattern in name_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                data['name'] = match.group(1).strip()
                confidence_scores.append(85)
                break
        
        # Extrair número do BI
        bi_patterns = [
            r"N[úu]mero[:\s]*(\d{9}[A-Z]{2}\d{3})",
            r"BI[:\s]*(\d{9}[A-Z]{2}\d{3})",
            r"(\d{9}[A-Z]{2}\d{3})",
        ]
        for pattern in bi_patterns:
            match = re.search(pattern, text)
            if match:
                data['bi_number'] = match.group(1).strip()
                confidence_scores.append(90)
                break
        
        # Extrair NIF
        nif_pattern = r"NIF[:\s]*(\d{10})"
        match = re.search(nif_pattern, text)
        if match:
            data['nif'] = match.group(1).strip()
            confidence_scores.append(90)
        
        # Extrair data de nascimento
        dob_patterns = [
            r"Data de Nascimento[:\s]*(\d{2}[-/]\d{2}[-/]\d{4})",
            r"Nascimento[:\s]*(\d{2}[-/]\d{2}[-/]\d{4})",
            r"(\d{2}[-/]\d{2}[-/]\d{4})",
        ]
        for pattern in dob_patterns:
            match = re.search(pattern, text)
            if match:
                dob = match.group(1).strip()
                # Normalizar formato
                dob = dob.replace('-', '/')
                data['date_of_birth'] = dob
                confidence_scores.append(80)
                break
        
        # Extrair data de validade
        expiry_patterns = [
            r"Data de Validade[:\s]*(\d{2}[-/]\d{2}[-/]\d{4})",
            r"Validade[:\s]*(\d{2}[-/]\d{2}[-/]\d{4})",
        ]
        for pattern in expiry_patterns:
            match = re.search(pattern, text)
            if match:
                expiry = match.group(1).strip()
                expiry = expiry.replace('-', '/')
                data['expiry_date'] = expiry
                confidence_scores.append(75)
                break
        
        # Calcular confiança geral
        confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        
        return {
            "success": True,
            "document_type": "bi",
            "data": data,
            "raw_text": text,
            "confidence": round(confidence, 2),
            "fields_extracted": len(data)
        }
    
    def extract_income_proof_data(self, image_path: str) -> Dict[str, Any]:
        """Extrair dados de comprovativo de rendimento"""
        text = self.extract_text(image_path)
        
        data = {}
        confidence_scores = []
        
        # Extrair nome do empregador
        employer_patterns = [
            r"Empresa[:\s]*(.+?)(?:\n|$)",
            r"Empregador[:\s]*(.+?)(?:\n|$)",
            r"(?:De|DA)\s+(.+?)(?:\n|\s+PARA)",
        ]
        for pattern in employer_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data['employer_name'] = match.group(1).strip()
                confidence_scores.append(70)
                break
        
        # Extrair nome do funcionário
        employee_patterns = [
            r"Funcion[áa]rio[:\s]*(.+?)(?:\n|$)",
            r"Nome[:\s]*(.+?)(?:\n|$)",
            r"(?:PARA|Para)\s+(.+?)(?:\n|$)",
        ]
        for pattern in employee_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data['employee_name'] = match.group(1).strip()
                confidence_scores.append(75)
                break
        
        # Extrair valor do salário (em AOA)
        salary_patterns = [
            r"Sal[áa]rio[:\s]*([\d\s.,]+)\s*(?:AOA|Kz)?",
            r"Vencimento[:\s]*([\d\s.,]+)\s*(?:AOA|Kz)?",
            r"Rendimento[:\s]*([\d\s.,]+)\s*(?:AOA|Kz)?",
            r"(?:AOA|Kz)\s*([\d\s.,]+)",
        ]
        for pattern in salary_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                salary_str = match.group(1).strip()
                # Remover espaços e converter para número
                salary_str = salary_str.replace(' ', '').replace('.', '').replace(',', '.')
                try:
                    salary = float(salary_str)
                    data['monthly_income'] = int(salary)
                    confidence_scores.append(80)
                    break
                except ValueError:
                    pass
        
        # Extrair data do documento
        date_patterns = [
            r"Data[:\s]*(\d{2}[-/]\d{2}[-/]\d{4})",
            r"Emitido em[:\s]*(\d{2}[-/]\d{2}[-/]\d{4})",
        ]
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                doc_date = match.group(1).strip()
                doc_date = doc_date.replace('-', '/')
                data['document_date'] = doc_date
                confidence_scores.append(70)
                break
        
        # Calcular confiança geral
        confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        
        return {
            "success": True,
            "document_type": "comprovativo_rendimento",
            "data": data,
            "raw_text": text,
            "confidence": round(confidence, 2),
            "fields_extracted": len(data)
        }
    
    def extract_address_proof_data(self, image_path: str) -> Dict[str, Any]:
        """Extrair dados de comprovativo de residência"""
        text = self.extract_text(image_path)
        
        data = {}
        confidence_scores = []
        
        # Extrair nome
        name_pattern = r"(?:Nome|Cliente)[:\s]*(.+?)(?:\n|$)"
        match = re.search(name_pattern, text, re.IGNORECASE)
        if match:
            data['name'] = match.group(1).strip()
            confidence_scores.append(75)
        
        # Extrair endereço
        address_patterns = [
            r"Morada[:\s]*(.+?)(?:\n|$)",
            r"Endere[çc]o[:\s]*(.+?)(?:\n|$)",
            r"Rua[:\s]*(.+?)(?:\n|$)",
        ]
        for pattern in address_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data['address'] = match.group(1).strip()
                confidence_scores.append(70)
                break
        
        # Extrair cidade/província
        city_pattern = r"(?:Luanda|Benguela|Huambo|Lobito|Namibe)"
        match = re.search(city_pattern, text, re.IGNORECASE)
        if match:
            data['city'] = match.group(0).strip()
            confidence_scores.append(80)
        
        confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        
        return {
            "success": True,
            "document_type": "comprovativo_residencia",
            "data": data,
            "raw_text": text,
            "confidence": round(confidence, 2),
            "fields_extracted": len(data)
        }


def main():
    """Função principal"""
    if len(sys.argv) < 3:
        print(json.dumps({
            "success": False,
            "error": "Uso: python ocr_tesseract.py <tipo_documento> <caminho_imagem>",
            "confidence": 0
        }))
        sys.exit(1)
    
    doc_type = sys.argv[1]
    image_path = sys.argv[2]
    
    # Verificar se arquivo existe
    if not Path(image_path).exists():
        print(json.dumps({
            "success": False,
            "error": f"Arquivo não encontrado: {image_path}",
            "confidence": 0
        }))
        sys.exit(1)
    
    # Processar documento
    ocr = DocumentOCR()
    
    try:
        if doc_type == 'bi':
            result = ocr.extract_bi_data(image_path)
        elif doc_type == 'comprovativo_rendimento':
            result = ocr.extract_income_proof_data(image_path)
        elif doc_type == 'comprovativo_residencia':
            result = ocr.extract_address_proof_data(image_path)
        else:
            result = {
                "success": False,
                "error": f"Tipo de documento desconhecido: {doc_type}",
                "confidence": 0
            }
        
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
            "confidence": 0
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
