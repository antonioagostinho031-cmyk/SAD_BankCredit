import { Injectable } from '@nestjs/common';
import { OcrService } from './ocr.service';

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  errors: string[];
  warnings: string[];
  extractedData: any;
}

@Injectable()
export class DocumentValidationService {
  constructor(private ocrService: OcrService) {}

  async validateDocument(
    documentType: string,
    filePath: string,
    clientData?: any,
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      confidence: 0,
      errors: [],
      warnings: [],
      extractedData: {},
    };

    try {
      const ocrResult = await this.ocrService.extractTextFromDocument(filePath);
      result.extractedData = ocrResult.data;
      result.confidence = ocrResult.confidence;

      if (!ocrResult.success) {
        result.isValid = false;
        result.errors.push('Falha na extração de dados do documento');
        return result;
      }

      switch (documentType) {
        case 'bi':
          this.validateBI(result, clientData);
          break;
        case 'nif':
          this.validateNIF(result, clientData);
          break;
        case 'comprovativo_rendimento':
          this.validateIncomeProof(result, clientData);
          break;
        case 'comprovativo_vinculo':
          this.validateEmploymentProof(result, clientData);
          break;
        default:
          result.warnings.push('Tipo de documento não possui validação específica');
      }

      this.performGeneralValidations(result);

      if (result.errors.length > 0) {
        result.isValid = false;
      }

      return result;
    } catch (error: any) {
      result.isValid = false;
      result.errors.push(`Erro na validação: ${error.message}`);
      return result;
    }
  }

  private validateBI(result: ValidationResult, clientData?: any): void {
    const data = result.extractedData;

    if (!data.bi_number || data.bi_number.length < 13) {
      result.errors.push('Número de BI inválido ou ilegível');
    }

    if (!data.name || data.name.length < 5) {
      result.errors.push('Nome não identificado no documento');
    }

    if (!data.date_of_birth) {
      result.errors.push('Data de nascimento não identificada');
    }

    if (data.expiry_date) {
      const expiryDate = this.parseDate(data.expiry_date);
      const today = new Date();
      
      if (expiryDate < today) {
        result.errors.push('Documento expirado');
      } else {
        const monthsUntilExpiry = this.monthsDifference(today, expiryDate);
        if (monthsUntilExpiry < 6) {
          result.warnings.push('Documento expira em menos de 6 meses');
        }
      }
    }

    if (clientData) {
      if (clientData.bi_number && data.bi_number !== clientData.bi_number) {
        result.errors.push('Número de BI não corresponde aos dados cadastrais');
      }

      if (clientData.full_name && !this.namesMatch(data.name, clientData.full_name)) {
        result.warnings.push('Nome no documento difere dos dados cadastrais');
      }
    }
  }

  private validateNIF(result: ValidationResult, clientData?: any): void {
    const data = result.extractedData;

    if (!data.nif || data.nif.length < 9) {
      result.errors.push('NIF inválido ou ilegível');
    }

    if (clientData?.nif && data.nif !== clientData.nif) {
      result.errors.push('NIF não corresponde aos dados cadastrais');
    }
  }

  private validateIncomeProof(result: ValidationResult, clientData?: any): void {
    const data = result.extractedData;

    if (!data.monthly_income || data.monthly_income < 50000) {
      result.errors.push('Rendimento mensal não identificado ou abaixo do mínimo');
    }

    if (!data.employer_name) {
      result.warnings.push('Nome da entidade patronal não identificado');
    }

    if (clientData?.monthly_income) {
      const difference = Math.abs(data.monthly_income - clientData.monthly_income);
      const percentDiff = (difference / clientData.monthly_income) * 100;

      if (percentDiff > 20) {
        result.warnings.push('Rendimento declarado difere significativamente do comprovativo');
      }
    }
  }

  private validateEmploymentProof(result: ValidationResult, clientData?: any): void {
    const data = result.extractedData;

    if (!data.employer_name) {
      result.errors.push('Nome da entidade patronal não identificado');
    }

    if (clientData?.employer && data.employer_name !== clientData.employer) {
      result.warnings.push('Entidade patronal difere dos dados cadastrais');
    }
  }

  private performGeneralValidations(result: ValidationResult): void {
    if (result.confidence < 50) {
      result.errors.push('Qualidade do documento muito baixa - documento ilegível');
    } else if (result.confidence < 70) {
      result.warnings.push('Qualidade do documento baixa - recomenda-se novo envio');
    }

    if (Object.keys(result.extractedData).length === 0) {
      result.errors.push('Nenhum dado foi extraído do documento');
    }
  }

  async compareDocuments(doc1Data: any, doc2Data: any): Promise<any> {
    const inconsistencies = [];

    if (doc1Data.name && doc2Data.name && !this.namesMatch(doc1Data.name, doc2Data.name)) {
      inconsistencies.push('Nomes diferentes entre documentos');
    }

    if (doc1Data.bi_number && doc2Data.bi_number && doc1Data.bi_number !== doc2Data.bi_number) {
      inconsistencies.push('Números de BI diferentes');
    }

    if (doc1Data.nif && doc2Data.nif && doc1Data.nif !== doc2Data.nif) {
      inconsistencies.push('NIFs diferentes');
    }

    return {
      consistent: inconsistencies.length === 0,
      inconsistencies,
    };
  }

  private parseDate(dateStr: string): Date {
    const parts = dateStr.split('/');
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }

  private monthsDifference(date1: Date, date2: Date): number {
    return (
      date2.getMonth() -
      date1.getMonth() +
      12 * (date2.getFullYear() - date1.getFullYear())
    );
  }

  private namesMatch(name1: string, name2: string): boolean {
    const normalize = (str: string) =>
      str.toLowerCase().replace(/\s+/g, ' ').trim();
    
    const n1 = normalize(name1);
    const n2 = normalize(name2);

    if (n1 === n2) return true;

    const words1 = n1.split(' ');
    const words2 = n2.split(' ');

    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length >= 2;
  }
}
