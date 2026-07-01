import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private readonly pythonPath: string;
  private readonly ocrScriptPath: string;

  constructor(private configService: ConfigService) {
    this.pythonPath = this.configService.get('PYTHON_PATH', 'python');
    // Usar script melhorado se USE_ADVANCED_OCR=true
    const useAdvanced = this.configService.get('USE_ADVANCED_OCR', 'true');
    const scriptName = useAdvanced === 'true' ? 'ocr_tesseract_melhorado.py' : 'ocr_tesseract.py';
    this.ocrScriptPath = path.join(process.cwd(), 'scripts', scriptName);
    
    this.logger.log(`OCR Script: ${scriptName}`);
  }

  /**
   * Executar script Python de OCR
   */
  private async runPythonOCR(documentType: string, filePath: string): Promise<any> {
    try {
      const command = `${this.pythonPath} "${this.ocrScriptPath}" ${documentType} "${filePath}"`;
      
      this.logger.log(`Executando OCR: ${command}`);
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        this.logger.warn(`OCR Warning: ${stderr}`);
      }
      
      const result = JSON.parse(stdout);
      
      this.logger.log(`OCR concluído. Confiança: ${result.confidence}%`);
      
      return result;
    } catch (error: any) {
      this.logger.error(`Erro ao executar OCR: ${error.message}`);
      
      // Retornar resultado de fallback
      return {
        success: false,
        error: error.message,
        confidence: 0,
        data: {},
      };
    }
  }

  async extractTextFromDocument(filePath: string): Promise<any> {
    try {
      // Determinar tipo de documento pelo caminho ou nome
      const docType = this.identifyDocumentType(filePath);
      
      // Executar OCR Python
      const result = await this.runPythonOCR(docType, filePath);
      
      return result;
    } catch (error: any) {
      this.logger.error(`Erro em extractTextFromDocument: ${error.message}`);
      return {
        success: false,
        error: error.message,
        confidence: 0,
      };
    }
  }

  /**
   * Identificar tipo de documento
   */
  private identifyDocumentType(filePath: string): string {
    const fileName = path.basename(filePath).toLowerCase();
    
    if (fileName.includes('bi') || fileName.includes('identidade')) {
      return 'bi';
    } else if (fileName.includes('renda') || fileName.includes('salario')) {
      return 'comprovativo_rendimento';
    } else if (fileName.includes('residencia') || fileName.includes('morada')) {
      return 'comprovativo_residencia';
    }
    
    return 'bi'; // Default
  }

  private async performOCR(filePath: string): Promise<string> {
    // Método legado - manter para compatibilidade
    const result = await this.extractTextFromDocument(filePath);
    return result.raw_text || '';
  }

  private parseExtractedData(text: string): any {
    const data: any = {};

    const nameMatch = text.match(/Nome:\s*(.+)/i);
    if (nameMatch) data.name = nameMatch[1].trim();

    const biMatch = text.match(/Número:\s*(\w+)/i);
    if (biMatch) data.bi_number = biMatch[1].trim();

    const nifMatch = text.match(/NIF:\s*(\d+)/i);
    if (nifMatch) data.nif = nifMatch[1].trim();

    const dobMatch = text.match(/Data de Nascimento:\s*(\d{2}\/\d{2}\/\d{4})/i);
    if (dobMatch) data.date_of_birth = dobMatch[1].trim();

    const expiryMatch = text.match(/Data de Validade:\s*(\d{2}\/\d{2}\/\d{4})/i);
    if (expiryMatch) data.expiry_date = expiryMatch[1].trim();

    return data;
  }

  private calculateConfidence(data: any): number {
    const fields = Object.keys(data);
    const completeness = fields.length / 5;
    
    let qualityScore = 0;
    if (data.bi_number && data.bi_number.length === 13) qualityScore += 0.2;
    if (data.nif && data.nif.length === 10) qualityScore += 0.2;
    if (data.name && data.name.length > 5) qualityScore += 0.2;
    if (data.date_of_birth) qualityScore += 0.2;
    if (data.expiry_date) qualityScore += 0.2;

    return Math.min(100, (completeness + qualityScore) * 50);
  }

  async extractDataFromBI(filePath: string): Promise<any> {
    const ocrResult = await this.runPythonOCR('bi', filePath);
    
    if (!ocrResult.success) {
      this.logger.error(`Falha no OCR do BI: ${ocrResult.error}`);
    }
    
    return {
      bi_number: ocrResult.data?.bi_number || null,
      name: ocrResult.data?.name || null,
      date_of_birth: ocrResult.data?.date_of_birth || null,
      nif: ocrResult.data?.nif || null,
      expiry_date: ocrResult.data?.expiry_date || null,
      confidence: ocrResult.confidence || 0,
      raw_text: ocrResult.raw_text,
    };
  }

  async extractDataFromIncomeProof(filePath: string): Promise<any> {
    const ocrResult = await this.runPythonOCR('comprovativo_rendimento', filePath);
    
    if (!ocrResult.success) {
      this.logger.error(`Falha no OCR do comprovativo: ${ocrResult.error}`);
    }
    
    return {
      employer_name: ocrResult.data?.employer_name || null,
      employee_name: ocrResult.data?.employee_name || null,
      monthly_income: ocrResult.data?.monthly_income || null,
      document_date: ocrResult.data?.document_date || null,
      confidence: ocrResult.confidence || 0,
      raw_text: ocrResult.raw_text,
    };
  }

  async extractDataFromAddressProof(filePath: string): Promise<any> {
    const ocrResult = await this.runPythonOCR('comprovativo_residencia', filePath);
    
    if (!ocrResult.success) {
      this.logger.error(`Falha no OCR do comprovativo de residência: ${ocrResult.error}`);
    }
    
    return {
      name: ocrResult.data?.name || null,
      address: ocrResult.data?.address || null,
      city: ocrResult.data?.city || null,
      confidence: ocrResult.confidence || 0,
      raw_text: ocrResult.raw_text,
    };
  }
}
