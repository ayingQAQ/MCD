import type { FoodIllustrationProps } from './types';
import { FoodIllustration } from './FoodIllustration';
/** The renderer is lazy-loaded only for export, never needed for the ordinary illustration. */
export async function renderFoodIllustrationSvg(props: FoodIllustrationProps): Promise<string> {
  const { renderToStaticMarkup } = await import('react-dom/server');
  const svg = renderToStaticMarkup(<FoodIllustration {...props} animated={false} className={undefined}/>);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${svg}\n`;
}
export async function downloadFoodIllustrationSvg(props: FoodIllustrationProps): Promise<void> {
  const svg = await renderFoodIllustrationSvg(props);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `mccosmos-${(props.preset?.id ?? props.foodId ?? 'unknown-bag').replace(/[^a-z0-9_-]/gi, '-')}.svg`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
