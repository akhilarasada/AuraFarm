
export interface User {
  email: string;
  trialsUsed: number;
  isVerified: boolean;
}

export interface AccessorySuggestion {
  name: string;
  category: string;
  description: string;
  styleReason: string;
  id: string;
  imageUrl?: string;
}

export interface CuratedSet {
  name: string;
  vibe: string;
  itemIds: string[]; // References to AccessorySuggestion IDs
  visualUrl?: string; // The generated composite image
}

export interface OutfitAnalysis {
  styleName: string;
  description: string;
  colorPalette: string[];
  occasions: string[];
  suggestions: AccessorySuggestion[];
  detectedPieces: string[];
  curatedSets: CuratedSet[];
}

export enum AnalysisCategory {
  ALL = 'All',
  SHOES = 'Shoes',
  WATCHES = 'Watches',
  JEWELRY = 'Jewelry',
  BAGS = 'Bags',
  EYEWEAR = 'Eyewear',
  CLOTHING = 'Clothing'
}
