#!/usr/bin/env python3
"""
Script de OCR MELHORADO usando Tesseract + LLM (opcional)
Banco Millennium Atlântico - Sistema de Crédito
Versão 2.0 - Com melhor qualidade e extração inteligente
"""

import sys
import json
import re
import os
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import pytesseract
    from PIL import Image, ImageEnhance, ImageFilter
    import cv2
    import numpy as np
    from pdf2image import convert_from_path
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"Dependências não instaladas: {str(e)}",
        "confidence": 0
    }))
    sys.exit(1)

# Tentar importar OpenAI (opcional)
try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False


@dataclass
class ExtractedField:
    """Campo extraído com confiança"""
    value: str
    confidence: float
    method: str  # 'regex', 'llm', 'fuzzy'
    raw_match: str = ""


class AdvancedOCR:
    """OCR avançado com múltiplas técnicas de processamento"""
    
    def __init__(self, use_llm: bool = False):
        # Configurar Tesseract
        tesseract_path = r'C:\Users\Antonio.Januario\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'
        if os.path.exists(tesseract_path):
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
        
        # Configurar Poppler
        self.poppler_path = r'C:\Users\Antonio.Januario\AppData\Local\Programs\poppler\Library\bin'
        
        # Configurar LLM (se disponível)
        self.use_llm = use_llm and HAS_OPENAI
        if self.use_llm:
            api_key = os.getenv('OPENAI_API_KEY')
            if api_key:
                self.llm_client = OpenAI(api_key=api_key)
                logger.info("✓ LLM habilitado para extração inteligente")
            else:
                self.use_llm = False
                logger.info("✗ LLM desabilitado (OPENAI_API_KEY não encontrada)")
        
        # Tesseract configs para diferentes cenários
        self.configs = {
            'default': '--psm 6 --oem 3 -l por',
            'single_block': '--psm 6 --oem 3 -l por',
            'single_line': '--psm 7 --oem 3 -l por',
            'sparse_text': '--psm 11 --oem 3 -l por',
        }
    
    def enhance_image(self, img: np.ndarray) -> List[np.ndarray]:
        """Criar múltiplas versões melhoradas da imagem"""
        enhanced_versions = []
        
        # 1. Versão original processada
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        enhanced_versions.append(gray)
        
        # 2. Com threshold adaptativo
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        enhanced_versions.append(thresh)
        
        # 3. Com denoising
        denoised = cv2.fastNlMeansDenoising(gray, h=10)
        enhanced_versions.append(denoised)
        
        # 4. Com contraste aumentado
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        contrasted = clahe.apply(gray)
        enhanced_versions.append(contrasted)
        
        # 5. Com sharpening
        kernel = np.array([[-1,-1,-1],
                          [-1, 9,-1],
                          [-1,-1,-1]])
        sharpened = cv2.filter2D(gray, -1, kernel)
        enhanced_versions.append(sharpened)
        
        return enhanced_versions
    
    def extract_text_multi_pass(self, image_path: str) -> str:
        """Extrair texto usando múltiplas passagens e configs"""
        try:
            # Carregar imagem
            if image_path.lower().endswith('.pdf'):
                images = convert_from_path(
                    image_path,
                    first_page=1,
                    last_page=1,
                    dpi=400,  # DPI maior para melhor qualidade
                    poppler_path=self.poppler_path
                )
                if not images:
                    raise Exception("Falha ao converter PDF")
                
                # Converter PIL Image para numpy array
                img = cv2.cvtColor(np.array(images[0]), cv2.COLOR_RGB2BGR)
            else:
                img = cv2.imread(image_path)
            
            if img is None:
                raise Exception(f"Não foi possível carregar imagem: {image_path}")
            
            # Criar versões melhoradas
            enhanced_versions = self.enhance_image(img)
            
            # Extrair texto de cada versão
            all_texts = []
            for i, enhanced_img in enumerate(enhanced_versions):
                for config_name, config in self.configs.items():
                    try:
                        text = pytesseract.image_to_string(enhanced_img, config=config)
                        if text.strip():
                            all_texts.append(text)
                            logger.info(f"Versão {i}, Config {config_name}: {len(text)} caracteres")
                    except Exception as e:
                        logger.warning(f"Erro na versão {i}, config {config_name}: {e}")
            
            # Escolher o texto mais longo e completo
            if all_texts:
                best_text = max(all_texts, key=len)
                logger.info(f"✓ Melhor extração: {len(best_text)} caracteres")
                return best_text
            else:
                return ""
        
        except Exception as e:
            logger.error(f"Erro ao extrair texto: {e}")
            return ""
    
    def extract_with_llm(self, text: str, document_type: str) -> Dict[str, Any]:
        """Usar LLM para extrair dados estruturados do texto"""
        if not self.use_llm:
            return {}
        
        try:
            prompts = {
                'bi': """Extraia os seguintes dados deste Bilhete de Identidade angolano:
- Nome completo
- Número do BI (formato: 9 dígitos + 2 letras + 3 dígitos, ex: 123456789BA012)
- NIF (10 dígitos)
- Data de nascimento (formato DD/MM/AAAA)
- Data de validade (formato DD/MM/AAAA)

Responda APENAS em JSON válido com as chaves: name, bi_number, nif, date_of_birth, expiry_date
Se não encontrar algum campo, use null.

Texto do documento:
""",
                'comprovativo_rendimento': """Extraia os seguintes dados desta declaração de rendimento:
- Nome da empresa/empregador
- Nome do funcionário
- Salário mensal (apenas o número, sem símbolos)
- Data do documento (formato DD/MM/AAAA)

Responda APENAS em JSON válido com as chaves: employer_name, employee_name, monthly_income, document_date
Se não encontrar algum campo, use null.

Texto do documento:
"""
            }
            
            prompt = prompts.get(document_type, "") + text
            
            response = self.llm_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Você é um especialista em extrair dados de documentos angolanos. Responda apenas com JSON válido."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=500
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Remover markdown se houver
            result_text = result_text.replace('```json', '').replace('```', '').strip()
            
            return json.loads(result_text)
        
        except Exception as e:
            logger.error(f"Erro ao usar LLM: {e}")
            return {}
    
    def extract_bi_data(self, image_path: str) -> Dict[str, Any]:
        """Extrair dados de BI com alta precisão"""
        text = self.extract_text_multi_pass(image_path)
        
        if not text.strip():
            return {
                "success": False,
                "error": "Não foi possível extrair texto do documento",
                "confidence": 0,
                "data": {}
            }
        
        # Tentar com LLM primeiro (mais preciso)
        if self.use_llm:
            llm_data = self.extract_with_llm(text, 'bi')
            if llm_data:
                confidence = 90 if len(llm_data) >= 3 else 70
                return {
                    "success": True,
                    "document_type": "bi",
                    "method": "llm",
                    "data": llm_data,
                    "raw_text": text,
                    "confidence": confidence
                }
        
        # Fallback: Regex patterns melhorados para documentos angolanos
        data = {}
        confidence_scores = []
        
        # Padrões NOME (mais flexíveis)
        name_patterns = [
            r"Nome[:\s]*([A-ZÀÁÂÃÇÉÊÍÓÔÕÚ][a-zàáâãçéêíóôõú]+(?:\s+[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ][a-zàáâãçéêíóôõú]+)+)",
            r"NOME[:\s]*([A-ZÀÁÂÃÇÉÊÍÓÔÕÚ\s]+?)(?:\n|\s{2,})",
            r"Apelido[se]*[:\s]*([A-ZÀÁÂÃÇÉÊÍÓÔÕÚ][a-zàáâãçéêíóôõú]+(?:\s+[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ][a-zàáâãçéêíóôõú]+)+)",
        ]
        for pattern in name_patterns:
            match = re.search(pattern, text, re.MULTILINE)
            if match:
                name = match.group(1).strip()
                if len(name.split()) >= 2:  # Pelo menos nome e sobrenome
                    data['name'] = name
                    confidence_scores.append(85)
                    break
        
        # Padrão BI ANGOLANO (9 dígitos + 2 letras + 3 dígitos)
        bi_patterns = [
            r"(\d{9}[A-Z]{2}\d{3})",
            r"N[úuº°]?[:\s]*(\d{9}[A-Z]{2}\d{3})",
            r"BI[:\s]*(\d{9}[A-Z]{2}\d{3})",
        ]
        for pattern in bi_patterns:
            match = re.search(pattern, text)
            if match:
                data['bi_number'] = match.group(1)
                confidence_scores.append(95)
                break
        
        # Padrão NIF ANGOLANO (10 dígitos)
        nif_patterns = [
            r"NIF[:\s]*(\d{10})",
            r"N\.?\s*I\.?\s*F\.?[:\s]*(\d{10})",
            r"Contrib[^\d]*(\d{10})",
        ]
        for pattern in nif_patterns:
            match = re.search(pattern, text)
            if match:
                data['nif'] = match.group(1)
                confidence_scores.append(90)
                break
        
        # Padrão DATA (formato angolano)
        date_pattern = r"(\d{2}[/-]\d{2}[/-]\d{4})"
        
        # Data de nascimento
        dob_contexts = ['nascimento', 'nascim', 'nasc', 'data de nasc']
        for context in dob_contexts:
            pattern = rf"{context}[^\d]*{date_pattern}"
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                dob = match.group(1).replace('-', '/')
                data['date_of_birth'] = dob
                confidence_scores.append(80)
                break
        
        # Data de validade
        expiry_contexts = ['validade', 'valid', 'emissão', 'expira']
        for context in expiry_contexts:
            pattern = rf"{context}[^\d]*{date_pattern}"
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                expiry = match.group(1).replace('-', '/')
                data['expiry_date'] = expiry
                confidence_scores.append(75)
                break
        
        # Calcular confiança
        if confidence_scores:
            avg_confidence = sum(confidence_scores) / len(confidence_scores)
            # Bonus se todos os campos críticos foram encontrados
            critical_fields = ['name', 'bi_number']
            if all(f in data for f in critical_fields):
                avg_confidence = min(100, avg_confidence + 10)
        else:
            avg_confidence = 0
        
        return {
            "success": len(data) > 0,
            "document_type": "bi",
            "method": "regex",
            "data": data,
            "raw_text": text,
            "confidence": round(avg_confidence, 2),
            "fields_extracted": len(data)
        }
    
    def extract_income_proof_data(self, image_path: str) -> Dict[str, Any]:
        """Extrair dados de comprovativo de rendimento"""
        text = self.extract_text_multi_pass(image_path)
        
        if not text.strip():
            return {
                "success": False,
                "error": "Não foi possível extrair texto do documento",
                "confidence": 0,
                "data": {}
            }
        
        # Tentar com LLM primeiro
        if self.use_llm:
            llm_data = self.extract_with_llm(text, 'comprovativo_rendimento')
            if llm_data:
                return {
                    "success": True,
                    "document_type": "comprovativo_rendimento",
                    "method": "llm",
                    "data": llm_data,
                    "raw_text": text,
                    "confidence": 85
                }
        
        # Fallback: Regex
        data = {}
        confidence_scores = []
        
        # Nome da empresa (patterns angolanos)
        employer_patterns = [
            r"(?:Empresa|Empregador)[:\s]*([A-ZÀÁÂÃÇÉÊÍÓÔÕÚ][^\n]{5,50})",
            r"([A-ZÀÁÂÃÇÉÊÍÓÔÕÚ][^\n]{5,50})(?:\s+Lda|SARL|S\.A\.|SA)",
            r"Declara[^\n]*(?:empresa|entidade)\s+([A-ZÀÁÂÃÇÉÊÍÓÔÕÚ][^\n]{5,40})",
        ]
        for pattern in employer_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data['employer_name'] = match.group(1).strip()
                confidence_scores.append(75)
                break
        
        # Salário (AOA ou Kz)
        salary_patterns = [
            r"(?:salário|sal[aá]rio|vencimento|remunera[çc][ãa]o)[^\d]{0,20}([\d\s.,]+)\s*(?:AOA|Kz|kwanzas)?",
            r"(?:AOA|Kz)\s*([\d\s.,]+)",
            r"([\d\s.]+,\d{2})\s*(?:AOA|Kz)",
            r"(?:valor|montante)[^\d]{0,15}([\d\s.,]+)",
        ]
        for pattern in salary_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                salary_str = match.group(1).strip()
                # Limpar e converter
                salary_str = re.sub(r'[^\d,.]', '', salary_str)
                salary_str = salary_str.replace('.', '').replace(',', '.')
                
                try:
                    salary = float(salary_str)
                    # Validar range razoável (50k a 50M AOA)
                    if 50000 <= salary <= 50000000:
                        data['monthly_income'] = int(salary)
                        confidence_scores.append(85)
                        break
                except ValueError:
                    pass
        
        # Nome do funcionário
        employee_patterns = [
            r"(?:Funcion[aá]rio|Colaborador|Senhor|Sr\.)[:\s]*([A-ZÀÁÂÃÇÉÊÍÓÔÕÚ][a-zàáâãçéêíóôõú]+(?:\s+[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ][a-zàáâãçéêíóôõú]+)+)",
            r"que\s+([A-ZÀÁÂÃÇÉÊÍÓÔÕÚ][a-zàáâãçéêíóôõú]+(?:\s+[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ][a-zàáâãçéêíóôõú]+)+)\s+trabalha",
        ]
        for pattern in employee_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                name = match.group(1).strip()
                if len(name.split()) >= 2:
                    data['employee_name'] = name
                    confidence_scores.append(70)
                    break
        
        # Data
        date_pattern = r"(\d{2}[/-]\d{2}[/-]\d{4})"
        match = re.search(date_pattern, text)
        if match:
            data['document_date'] = match.group(1).replace('-', '/')
            confidence_scores.append(70)
        
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        
        return {
            "success": len(data) > 0,
            "document_type": "comprovativo_rendimento",
            "method": "regex",
            "data": data,
            "raw_text": text,
            "confidence": round(avg_confidence, 2),
            "fields_extracted": len(data)
        }


def main():
    """Função principal"""
    if len(sys.argv) < 3:
        print(json.dumps({
            "success": False,
            "error": "Uso: python ocr_tesseract_melhorado.py <tipo_documento> <caminho_imagem> [--use-llm]",
            "confidence": 0
        }))
        sys.exit(1)
    
    doc_type = sys.argv[1]
    image_path = sys.argv[2]
    use_llm = '--use-llm' in sys.argv or os.getenv('USE_LLM_OCR', '').lower() == 'true'
    
    # Verificar se arquivo existe
    if not Path(image_path).exists():
        print(json.dumps({
            "success": False,
            "error": f"Arquivo não encontrado: {image_path}",
            "confidence": 0
        }))
        sys.exit(1)
    
    # Processar documento
    ocr = AdvancedOCR(use_llm=use_llm)
    
    try:
        if doc_type == 'bi':
            result = ocr.extract_bi_data(image_path)
        elif doc_type == 'comprovativo_rendimento':
            result = ocr.extract_income_proof_data(image_path)
        else:
            result = {
                "success": False,
                "error": f"Tipo de documento desconhecido: {doc_type}",
                "confidence": 0
            }
        
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    except Exception as e:
        logger.error(f"Erro fatal: {e}", exc_info=True)
        print(json.dumps({
            "success": False,
            "error": str(e),
            "confidence": 0
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
