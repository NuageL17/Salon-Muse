export type UserRole = "cliente" | "praticienne" | "gerante";

export type RdvStatut =
  | "en_attente"
  | "confirme"
  | "en_cours"
  | "termine"
  | "annule_cliente"
  | "annule_salon"
  | "no_show";

export interface Profile {
  id: string;
  role: UserRole;
  prenom: string | null;
  nom: string | null;
  telephone: string | null;
  code_parrainage: string | null;
  parrain_id: string | null;
  points_fidelite: number;
  consent_push: boolean;
  consent_geo: boolean;
  consent_marketing: boolean;
  created_at: string;
}

export interface Prestation {
  id: string;
  nom: string;
  description: string | null;
  categorie: string | null;
  duree_min: number;
  buffer_min: number;
  prix: number;
  acompte_requis: boolean;
  montant_acompte: number | null;
  actif: boolean;
  ordre_affichage: number;
  image_url: string | null;
}

export interface RendezVous {
  id: string;
  cliente_id: string;
  praticienne_id: string | null;
  prestation_id: string;
  debut: string;
  fin: string;
  statut: RdvStatut;
  prix_applique: number | null;
  acompte_paye: boolean;
  notes: string | null;
  created_at: string;
}