import { notFound, redirect } from 'next/navigation';
import { getCanvas, getCanvasBlock, getDatabaseInfo } from '@/lib/actions/canvas';
import { getFrameworkTemplate } from '@/lib/frameworks/lean-canvas';
import BlockEditorPage from './block-editor';

interface PageProps {
  params: Promise<{ id: string; blockKey: string }>;
}

export default async function BlockPage({ params }: PageProps) {
  const { id, blockKey } = await params;

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

  const blockTemplate = template.blocks.find((b) => b.key === blockKey);
  if (!blockTemplate) {
    notFound();
  }

  const block = await getCanvasBlock(id, blockKey);
  const contentJson = block?.contentJson || '{}';

  return (
    <BlockEditorPage
      canvasId={id}
      canvasName={canvas.name}
      blockKey={blockKey}
      blockTitle={blockTemplate.title}
      hint={blockTemplate.hint}
      initialContent={contentJson}
    />
  );
}
