import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = () => {
  injectSpeedInsights();
}
