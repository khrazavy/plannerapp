import { notFound, redirect } from 'next/navigation';
import { getCanvas, getCanvasBlocks, getDatabaseInfo } from '@/lib/actions/canvas';
import { getFrameworkTemplate } from '@/lib/frameworks/lean-canvas';
import { GridView } from '@/components/canvas/grid-view';
import CanvasHeader from './canvas-header';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CanvasPage({ params }: PageProps) {
  const { id } = await params;
  const dbInfo = await getDatabaseInfo();
  if (!dbInfo.active) {
    redirect('/');
  }
  const canvas = await getCanvas(id);

  if (!canvas) {
    notFound();
  }

  const template = getFrameworkTemplate(canvas.frameworkType);
  if (!template) {
    notFound();
  }

  const blocks = await getCanvasBlocks(id);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <CanvasHeader canvasId={id} canvasName={canvas.name} />

      <GridView
        canvasId={id}
        blocks={blocks}
        blockTemplates={template.blocks}
      />
    </div>
  );
}
