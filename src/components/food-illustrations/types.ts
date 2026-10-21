export type FoodFamily = 'burger' | 'fries' | 'drink' | 'nugget' | 'dessert' | 'breakfast' | 'wrap' | 'unknown';
export type Expression = 'happy' | 'smile' | 'curious' | 'sleepy' | 'excited' | 'shy' | 'neutral';
export type Ingredient = 'beef' | 'chicken' | 'cheese' | 'lettuce' | 'egg' | 'sauce' | 'pickle' | 'bacon' | 'middle-bun';
export type Decoration = 'orbit' | 'satellite' | 'star-pin' | 'flag';
export type DetailLevel = 'compact' | 'standard' | 'full';
export interface IngredientLayer { kind: Ingredient; thickness?: number; offsetX?: number }
export interface FoodIllustrationPreset {
  id: string; name: string; family: FoodFamily; variant: string;
  ingredients?: readonly Ingredient[];
  layers?: readonly IngredientLayer[];
  bun?: 'domed' | 'flat' | 'long';
  colors?: Partial<Record<'container' | 'liquid' | 'accent' | 'filling', string>>;
  expression?: Expression;
  decorations?: readonly Decoration[];
  layoutSeed: number;
  /** All shipped presets are generic examples, never verified product recipes. */
  mapping: 'generic-example';
  notes: string;
}
export interface FoodIllustrationProps {
  foodId?: string; preset?: FoodIllustrationPreset; size?: number;
  expression?: Expression; cosmic?: boolean; animated?: boolean;
  className?: string; title?: string; 'aria-label'?: string; decorative?: boolean;
}
export interface DrawingContext { preset: FoodIllustrationPreset; expression: Expression; detail: DetailLevel }
export interface FoodIdentity { id?: string; name: string; category?: string }
export interface IllustrationMatch { presetId: string; status: 'generic-example'; reason: 'preset' | 'name-shape' | 'category' | 'unknown'; note: string }
