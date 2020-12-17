
export interface LocaleCsvInfo {
  keyIdx: number | null;
  commentIdx: number | null;
  timestampIdx: number | null;
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
  comment: string | null;
  timestamp: string | null;
  label: string | null;
  resx: string | null;
}