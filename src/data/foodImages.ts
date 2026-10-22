import manifest from './food-images.json';

export interface FoodImage {
  foodId: string;
  foodName: string;
  menuName: string;
  code: string;
  url: string;
  src: string;
  match: 'exact' | 'alias' | 'family-reference';
  /** Public label required when the image shows another size of the same product. */
  referenceLabel?: string;
  note?: string;
  sourceTool?: 'query-meals' | 'query-meal-detail' | 'official-product-page' | 'official-nutrition-page' | 'official-promotion-page';
  sourcePage?: string;
  reservationDate?: string;
}

export interface FoodImageManifest {
  fetchedAt: string;
  tool: 'query-meals';
  store: { code: string; name: string };
  images: FoodImage[];
}

// The manifest records reviewed product matches; categories and nutrition never
// determine a photograph. Unmatched foods deliberately have no entry.
export function createFoodImageLookup(source: FoodImageManifest) {
  const images = new Map(source.images
    .filter(image => (image.match === 'exact' || image.match === 'alias' || (image.match === 'family-reference' && !!image.referenceLabel?.trim())) && image.src.startsWith('/food-photos/'))
    .map(image => [image.foodId, image]));
  return (foodId: string): FoodImage | undefined => images.get(foodId);
}

export const foodImageManifest = manifest as FoodImageManifest;
export const getFoodImage = createFoodImageLookup(foodImageManifest);
