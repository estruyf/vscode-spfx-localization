
export interface LocaleCsvInfo {
  keyIdx: number;
  localeIdx: HeaderIdx[];
  resxNames: HeaderIdx[];
}

export interface HeaderIdx {
  key: string;
  idx: number;
}

export interface LocaleCsvData {
  [locale: string]: LocaleData[];
}

export interface LocaleData {
  key: string | null;
  label: string | null;
  resx: string | null;
}