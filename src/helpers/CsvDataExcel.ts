import { ICsvData } from "./CsvData";
import * as ExcelJS from '@nbelyh/exceljs';

export class CsvDataExcel implements ICsvData {

  private wb: ExcelJS.Workbook;
  private ws: ExcelJS.Worksheet;

  private columnCount = -1;

  constructor(data?: string[][], name?: string) {
    this.wb = new ExcelJS.Workbook();
    this.ws = this.wb.addWorksheet(name);
    if (data) {
      this.columnCount = data[0].length;
      this.ws.addRows(data as any[]);
    }
  }
  
  getData(): string[][] {
    const result = [];
    const ws = this.ws;
    for (let r = 0; r < ws.rowCount; ++r) {
      result.push(Array(ws.columnCount));
      for (let c = 0; c < ws.columnCount; ++c) {
        result[r][c] = ws.getCell(r + 1, c + 1).value || '';
      }
    }
    return result;
  }

  getValue(r: number, c: number): string {
    if (r < this.ws.rowCount && c < this.columnCount) {
      const cell = this.ws.getCell(r + 1, c + 1);
      return cell.value as string;
    } else {
      return '';
    }
  }

  setValue(r: number, c: number, v: string) {
    if (r < this.ws.rowCount && c < this.columnCount) {
      const cell = this.ws.getCell(r + 1, c + 1);
      cell.value = v;
    }
  }

  addRow(r: number) {
    this.ws.insertRow(r + 1, Array(this.colCount).join('.').split('.'));
    
    // Expand table if it exists
    const tables = this.ws.getTables();
    if (tables?.length > 0) {
      for (const it of tables) {
        const table = (it as any)?.table;
        if (table?.tableRef) {
          const match = table.tableRef.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
          if (match) {
            const [, startCol, startRow, endCol, endRow] = match;
            const endRowNum = parseInt(endRow);
            // Check if inserted row is within or after table range
            if (r + 1 <= endRowNum + 1) {
              table.tableRef = `${startCol}${startRow}:${endCol}${endRowNum + 1}`;
            }
          }
        }
      }
    }
  }

  get rowCount(): number {
    return this.ws.rowCount;
  }

  get colCount(): number {
    return this.ws.columnCount;
  }

  write(filePath: string, options: Object): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.wb.xlsx.writeFile(filePath).then(() => resolve(true), err => reject(err));
    });
  }

  read(filePath: string, options: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.wb.xlsx.readFile(filePath).then(wb => {
        this.wb = wb;
        this.ws = wb.worksheets[0];
        this.columnCount = this.ws.columnCount;
        resolve(true);
      }, err => {
        reject(err);
      });
    });
  }
}
