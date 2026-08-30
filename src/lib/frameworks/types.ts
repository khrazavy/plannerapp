export interface GridArea {
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
}

export interface BlockTemplate {
  key: string;
  title: string;
  hint: string;
  placeholder: string;
  gridArea: GridArea;
}

export interface FrameworkTemplate {
  type: string;
  title: string;
  blocks: BlockTemplate[];
}
