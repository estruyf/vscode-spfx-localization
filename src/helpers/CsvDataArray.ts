import { ICsvData } from "./CsvData";
import * as fs from "fs";
import * as stringify from "csv-stringify";
import * as parse from "csv-parse";
import { UTF8_BOM } from "./ExtensionSettings";

interface IOptions {
  delimiter: string;
  bom: boolean;
}

export class CsvDataArray implements ICsvData {

  private data: string[][] = [];
  constructor(data?: string[][], name?: string) {
    if (data) {
      this.data = data;
    }
  }

  getData(): string[][] {
    return this.data;
  }

  getValue(r: number, c: number): string {
    if (r < this.rowCount && c < this.colCount) {
      return this.data[r][c] || '';
    } else {
      return '';
    }
  }
  setValue(r: number, c: number, v: string) {
    if (r < this.rowCount && c < this.colCount) {
      this.data[r][c] = v;
    }
  }
  addRow(r: number) {
    this.data.splice(r, 0, Array(this.colCount).join('.').split('.'));
  }
  get rowCount(): number {
    return this.data && this.data.length;
  }
  get colCount(): number {
    return this.data && this.data.length && this.data[0] && this.data[0].length;
  }

  read(filePath: string, options: IOptions): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const input = fs.readFileSync(filePath);
      parse(input, { delimiter: options.delimiter, bom: options.bom }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          this.data = data;
          resolve(true);
        }
      })
    });
  }

  write(filePath: string, options: IOptions): Promise<boolean> {
    return new Promise((resolve, reject) => {
      stringify(this.data, { delimiter: options.delimiter }, (err: any | Error, output: any) => {
        if (err) {
          reject(err);
        } else {
          if (output) {
            const bom = options.bom ? UTF8_BOM : '';
            fs.writeFileSync(filePath, bom + output, { encoding: "utf8" });
            resolve(true);
          } else {
            resolve(false);
          }
        }
      });
    })
  }

}