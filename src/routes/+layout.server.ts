import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
  const { locals: { session } } = event;
  return {
    session
  };
}
