export interface AlcoholIdentity {
  name_exact: string;
  brand: string;
  producer: string;
  country: string;
  region: string;
  sub_region: string;
}

export interface AlcoholTechnical {
  raw_material: string;
  fermentation_type: string;
  distillation_method: string;
  abv: number | string;
}

export interface AlcoholChronology {
  vintage: string;
  maturation_time: string;
  barrel_type: string;
}

export interface AlcoholSensory {
  sight: string;
  nose: string;
  palate: string;
}

export interface AlcoholMarket {
  production_status: string;
  rarity: string;
  bottle_formats: string[];
}

export interface AlcoholDidactic {
  history_context: string;
  mixology_role: string;
  iconic_cocktails: string[];
}

export interface AlcoholAdvanced {
  raw_material: string;
  vessel_type: string;
  master_creator: string;
  history_context_short: string;
}

export interface AlcoholRecord {
  id: string;
  slug: string;
  family_id: string;
  category: string;
  subcategory: string;
  producer_group: string;
  denomination_of_origin: string;
  producer_type: string;
  identity: AlcoholIdentity;
  technical: AlcoholTechnical;
  chronology: AlcoholChronology;
  sensory: AlcoholSensory;
  market: AlcoholMarket;
  didactic: AlcoholDidactic;
  advanced: AlcoholAdvanced;
  imageUrl?: string | null;
  sourceUrl?: string;
  sourceRetailer?: string;
  productCode?: string;
  updatedAt?: string;
  linkedProductSlug?: string;
}
