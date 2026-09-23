/**
 * A single exercise returned by the catalogue search.
 *
 * <p>There is no image URL here on purpose: the animation lives in Fitness.Catalog.Api as
 * binary data, so the client builds the address from the identifier - a preview comes from
 * `/catalog/{catalogExerciseId}/image`, and once imported from `/exercise/{localExerciseId}/image`.
 */
export interface CatalogSearchResult {
  catalogExerciseId: string;
  name: string;
  bodyCategory?: string;
  equipmentCategory?: string;
  targetMuscle?: string;
  secondaryMuscles?: string[];
  instructions?: string[];
  hasImage: boolean;
  isAlreadyImported: boolean;
  localExerciseId?: number | null;
}
