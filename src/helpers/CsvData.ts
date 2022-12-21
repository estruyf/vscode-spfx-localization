
export interface ICsvData {

  getValue(r: number, c: number): string;
  setValue(r: number, c: number, v: string): void;

  addRow(r: number): void;

  rowCount: number;
  colCount: number;

  write(fileName: string, options: any): Promise<boolean>;
  read(filePath: string, options: any): Promise<boolean>;

  getData(): string[][];
}
