export interface ExportResult {
  success: boolean;
  message: string;
  data?: Buffer;
}

export async function exportCanvasToPdf(canvasId: string): Promise<ExportResult> {
  void canvasId;
  return {
    success: false,
    message: 'PDF export not yet implemented',
  };
}
