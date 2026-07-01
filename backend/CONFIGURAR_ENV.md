# ⚙️ CONFIGURAR .env PARA OCR

## Adicionar ao arquivo `backend/.env`

```env
# OCR Configuration
TESSERACT_PATH=C:\Users\Antonio.Januario\AppData\Local\Programs\Tesseract-OCR\tesseract.exe
PYTHON_PATH=python
OCR_LANGUAGE=por
```

---

## Arquivo .env completo deve ficar assim:

```env
# Database
DATABASE_URL=sua_url_supabase_aqui
SUPABASE_URL=sua_url_supabase_aqui
SUPABASE_KEY=sua_key_supabase_aqui

# JWT
JWT_SECRET=seu_secret_jwt_aqui

# OCR Configuration (NOVO)
TESSERACT_PATH=C:\Users\Antonio.Januario\AppData\Local\Programs\Tesseract-OCR\tesseract.exe
PYTHON_PATH=python
OCR_LANGUAGE=por

# Server
PORT=3000
```

---

## ✅ Próximos Passos

Depois de adicionar ao .env:

1. Salvar arquivo
2. Reiniciar backend: `npm run start:dev`
3. Testar OCR: Ver `backend/TESTAR_OCR.md`
