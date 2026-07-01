# 🧪 TESTAR OCR - Guia Rápido

## ✅ CONFIGURAÇÃO APLICADA

Tesseract configurado para o caminho:
```
C:\Users\Antonio.Januario\AppData\Local\Programs\Tesseract-OCR\tesseract.exe
```

---

## 🚀 PASSO 1: VERIFICAR INSTALAÇÃO

### **Verificar Tesseract**:
```bash
"C:\Users\Antonio.Januario\AppData\Local\Programs\Tesseract-OCR\tesseract.exe" --version
```

**Deve mostrar**:
```
tesseract 5.x.x
leptonica-1.xx.x
...
```

---

## 🚀 PASSO 2: INSTALAR DEPENDÊNCIAS PYTHON

```bash
cd backend
pip install pytesseract pillow opencv-python numpy
```

**Ou usar o arquivo requirements.txt**:
```bash
pip install -r requirements.txt
```

---

## 🚀 PASSO 3: CRIAR TABELA NO SUPABASE

1. Abrir Supabase → SQL Editor
2. Copiar conteúdo de: `backend/src/database/create-update-requests-table.sql`
3. Executar

---

## 🚀 PASSO 4: CRIAR IMAGEM DE TESTE

### **Opção A: Usar imagem de BI real**
- Tirar foto do BI
- Salvar como: `C:\temp\bi_teste.jpg`

### **Opção B: Criar documento de texto simples**
1. Abrir Word/Notepad
2. Digitar:
```
REPÚBLICA DE ANGOLA
BILHETE DE IDENTIDADE

Nome: MARIA SILVA COSTA
Data de Nascimento: 15/03/1990
Número: 123456789BA043
NIF: 1234567890
Data de Validade: 15/03/2030
```
3. Salvar como PDF
4. Converter para JPG online ou screenshot

---

## 🚀 PASSO 5: TESTAR SCRIPT PYTHON

```bash
cd backend

# Testar extração de BI
python scripts/ocr_tesseract.py bi C:\temp\bi_teste.jpg
```

### **Resposta Esperada**:
```json
{
  "success": true,
  "document_type": "bi",
  "data": {
    "name": "MARIA SILVA COSTA",
    "bi_number": "123456789BA043",
    "nif": "1234567890",
    "date_of_birth": "15/03/1990",
    "expiry_date": "15/03/2030"
  },
  "raw_text": "...",
  "confidence": 85.6,
  "fields_extracted": 5
}
```

### **Se der erro**:

#### **Erro: "TesseractNotFoundError"**
```bash
# Adicionar ao .env:
TESSERACT_PATH=C:\Users\Antonio.Januario\AppData\Local\Programs\Tesseract-OCR\tesseract.exe
```

#### **Erro: "traineddata not found for 'por'"**
```bash
# Baixar manualmente:
# 1. Ir para: https://github.com/tesseract-ocr/tessdata/blob/main/por.traineddata
# 2. Download "por.traineddata"
# 3. Copiar para: C:\Users\Antonio.Januario\AppData\Local\Programs\Tesseract-OCR\tessdata\
```

#### **Erro: "No module named 'cv2'"**
```bash
pip install opencv-python
```

---

## 🚀 PASSO 6: TESTAR BACKEND

### **Reiniciar servidor**:
```bash
cd backend
npm run start:dev
```

Deve iniciar sem erros.

---

## 🚀 PASSO 7: TESTAR API

### **Usando Postman/Insomnia**:

**1. Fazer Login (obter token)**:
```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "maria.cliente1@email.com",
  "password": "senha123"
}
```

**Copiar o `access_token` da resposta**

---

**2. Criar Solicitação de Atualização**:
```http
POST http://localhost:3000/api/v1/clients/update-request
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: multipart/form-data

full_name: Maria Silva Costa
bi_number: 123456789BA043
email: maria.nova@email.com
phone: +244 933 123 456
reason: Atualização de nome completo
documents: [escolher arquivo bi_teste.jpg]
```

---

**3. Resposta Esperada (200 OK)**:
```json
{
  "request_id": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
  "status": "pending_approval",
  "confidence_score": 87,
  "validation_results": [
    {
      "field": "full_name",
      "formValue": "Maria Silva Costa",
      "dbValue": "Maria Costa",
      "ocrValue": "MARIA SILVA COSTA",
      "isValid": true,
      "confidence": 95,
      "mismatch": "Valor alterado de 'Maria Costa' para 'Maria Silva Costa'"
    },
    {
      "field": "bi_number",
      "formValue": "123456789BA043",
      "dbValue": "006547891BA043",
      "ocrValue": "123456789BA043",
      "isValid": true,
      "confidence": 98,
      "mismatch": "Valor alterado"
    }
  ],
  "requires_manual_review": false
}
```

---

**4. Listar Minhas Solicitações**:
```http
GET http://localhost:3000/api/v1/clients/my-update-requests
Authorization: Bearer SEU_TOKEN_AQUI
```

---

**5. Aprovar Solicitação (como Admin)**:

**Login como admin**:
```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@atlantico.ao",
  "password": "senha123"
}
```

**Aprovar**:
```http
PATCH http://localhost:3000/api/v1/clients/update-request/REQUEST_ID_AQUI/approve
Authorization: Bearer ADMIN_TOKEN_AQUI
```

---

## ✅ CHECKLIST DE TESTE

- [ ] Tesseract instalado e funcionando
- [ ] Python packages instalados
- [ ] Tabela criada no Supabase
- [ ] Script Python funciona com imagem de teste
- [ ] Backend inicia sem erros
- [ ] API aceita upload de documentos
- [ ] OCR extrai dados corretamente
- [ ] Validação tripla funciona
- [ ] Score de confiança é calculado
- [ ] Solicitação é criada no BD
- [ ] Admin pode aprovar solicitação
- [ ] Dados são atualizados após aprovação

---

## 📊 RESULTADOS ESPERADOS

### **OCR**:
- ✅ Extrai nome completo
- ✅ Extrai número do BI
- ✅ Extrai NIF
- ✅ Extrai data de nascimento
- ✅ Score de confiança > 80%

### **Validação**:
- ✅ Compara formulário vs BD
- ✅ Compara formulário vs OCR
- ✅ Detecta diferenças
- ✅ Calcula similaridade
- ✅ Retorna score final

### **API**:
- ✅ Upload funciona
- ✅ Documentos são processados
- ✅ Solicitação é criada
- ✅ Status correto (pending_approval/pending_review)
- ✅ Aprovação atualiza dados

---

## 🐛 TROUBLESHOOTING

### **Problema: Confidence Score muito baixo (<50%)**

**Causas**:
- Imagem com baixa qualidade
- Iluminação ruim
- Documento com dobras
- Texto muito pequeno
- Imagem desfocada

**Soluções**:
- Usar imagem com resolução maior (mínimo 300 DPI)
- Melhorar iluminação
- Evitar sombras no documento
- Scanner em vez de câmera de celular
- Documento sem dobras ou manchas

---

### **Problema: Campos não são extraídos**

**Causas**:
- Formato do documento diferente do esperado
- Regex no script Python não encontra padrão

**Soluções**:
- Ver o `raw_text` na resposta
- Ajustar regex no `ocr_tesseract.py`
- Adicionar novos padrões de busca

---

### **Problema: Erro ao processar imagem**

**Causas**:
- Formato não suportado
- Arquivo corrompido
- Tamanho muito grande

**Soluções**:
- Converter para JPG ou PNG
- Redimensionar imagem (máx 2000x2000px)
- Verificar integridade do arquivo

---

## 📞 PRÓXIMO PASSO

Depois de testar com sucesso:
1. ✅ Confirmar que tudo funciona
2. 🚀 Criar página frontend de atualização
3. 🎨 Integrar upload de documentos
4. 📱 Testar fluxo completo end-to-end

---

**Tempo estimado de teste**: 15-20 minutos  
**Status**: Backend pronto para teste ✅
