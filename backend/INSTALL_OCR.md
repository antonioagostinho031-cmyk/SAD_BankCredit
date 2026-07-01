# 🔧 Instalação do Sistema OCR (Tesseract)

## Windows

### 1. Instalar Tesseract OCR

**Baixar o instalador:**
https://github.com/UB-Mannheim/tesseract/wiki

**Versão recomendada:**
`tesseract-ocr-w64-setup-5.3.3.20231005.exe`

**Durante a instalação:**
- ✅ Marcar opção: "Additional language data (download)"
- ✅ Selecionar idioma: **Portuguese** (por.traineddata)

**Caminho de instalação padrão:**
```
C:\Program Files\Tesseract-OCR\
```

### 2. Adicionar Tesseract ao PATH

**Windows 10/11:**
1. Abrir "Editar variáveis de ambiente do sistema"
2. Clicar em "Variáveis de Ambiente"
3. Em "Variáveis do sistema", encontrar `Path`
4. Clicar em "Editar"
5. Clicar em "Novo"
6. Adicionar: `C:\Program Files\Tesseract-OCR`
7. Clicar em "OK" em todas as janelas

### 3. Instalar Python (se não tiver)

**Baixar Python 3.11+:**
https://www.python.org/downloads/

**Durante a instalação:**
- ✅ Marcar: "Add Python to PATH"
- ✅ Marcar: "Install pip"

### 4. Instalar Dependências Python

```bash
cd backend
pip install -r requirements.txt
```

**Ou instalar manualmente:**
```bash
pip install pytesseract==0.3.10
pip install Pillow==10.2.0
pip install opencv-python==4.9.0.80
pip install numpy==1.26.4
```

### 5. Verificar Instalação

```bash
# Testar Tesseract
tesseract --version

# Deve mostrar:
# tesseract 5.3.3
#  leptonica-1.83.1
#  ...
```

```bash
# Testar script Python
python scripts/ocr_tesseract.py --help
```

---

## Linux (Ubuntu/Debian)

### 1. Instalar Tesseract

```bash
sudo apt update
sudo apt install tesseract-ocr tesseract-ocr-por
```

### 2. Instalar Dependências Python

```bash
cd backend
pip3 install -r requirements.txt
```

---

## MacOS

### 1. Instalar Tesseract

```bash
brew install tesseract
brew install tesseract-lang
```

### 2. Instalar Dependências Python

```bash
cd backend
pip3 install -r requirements.txt
```

---

## Configurar no Backend (.env)

Adicionar ao arquivo `backend/.env`:

```env
# OCR Configuration
TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe
PYTHON_PATH=python
OCR_LANGUAGE=por
```

---

## Testar OCR

### Teste Manual:

```bash
cd backend

# Testar com imagem de exemplo
python scripts/ocr_tesseract.py bi caminho/para/imagem_bi.jpg
```

### Resposta esperada:

```json
{
  "success": true,
  "document_type": "bi",
  "data": {
    "name": "JOÃO MANUEL SILVA",
    "bi_number": "006547891BA043",
    "nif": "1234567890",
    "date_of_birth": "15/03/1985",
    "expiry_date": "10/01/2030"
  },
  "confidence": 85.6,
  "fields_extracted": 5
}
```

---

## Troubleshooting

### Erro: "pytesseract.pytesseract.TesseractNotFoundError"

**Causa**: Tesseract não está no PATH ou caminho incorreto

**Solução**:
1. Verificar se Tesseract está instalado: `tesseract --version`
2. Adicionar caminho ao PATH do sistema
3. Reiniciar terminal/IDE

### Erro: "No module named 'cv2'"

**Causa**: OpenCV não instalado

**Solução**:
```bash
pip install opencv-python
```

### Erro: "Could not find traineddata file for 'por'"

**Causa**: Idioma português não instalado

**Solução**:
```bash
# Windows: Reinstalar Tesseract marcando idioma português
# Linux:
sudo apt install tesseract-ocr-por
```

### Baixa precisão no OCR

**Soluções**:
1. Usar imagens com boa resolução (mínimo 300 DPI)
2. Garantir boa iluminação no documento
3. Evitar documentos com dobras ou manchas
4. Usar scanner em vez de câmera quando possível

---

## Formatos de Imagem Suportados

✅ JPG/JPEG
✅ PNG
✅ TIFF
✅ BMP
✅ PDF (primeira página)

---

## Performance

**Tempo médio de processamento:**
- Bilhete de Identidade: 2-4 segundos
- Comprovativo de Rendimento: 3-5 segundos
- Comprovativo de Residência: 2-4 segundos

**Requisitos de Hardware:**
- RAM: Mínimo 2GB disponível
- CPU: Qualquer processador moderno
- Disco: ~500MB para Tesseract + dependências

---

## Próximos Passos

Depois de instalar:
1. ✅ Testar script Python manualmente
2. ✅ Reiniciar servidor NestJS
3. ✅ Testar upload de documentos no frontend
4. ✅ Verificar logs de validação

**Documentação completa**: Ver `backend/src/modules/documents/services/ocr.service.ts`
