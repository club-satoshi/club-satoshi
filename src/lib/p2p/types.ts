export type Screen = "home" | "amount" | "pay" | "invoice" | "wait" | "seller";

export type Method = "cbu" | "usdt";

export type TxEstado =
  | "pendiente"
  | "recibido"
  | "completada"
  | "rechazada"
  | "vencida"
  | "cancelada";

export interface Vendor {
  id: string;
  nombre?: string;
  apellido?: string;
  cbu?: string;
  alias?: string;
  usdt?: string;
  ntfy?: string;
  liquidez?: number;
  desde?: string;
  hasta?: string;
  activo?: boolean;
  actualizado?: string;
}

export interface Tx {
  n: number;
  fecha: string;
  estado?: TxEstado;
  sats: number;
  vendedorId: string;
  metodo: Method;
  ars?: number;
  usdt?: number;
  invoice?: string;
  reclamado?: boolean;
  reclamo_at?: string;
  recibido_at?: string;
  completada?: string;
  vencida_at?: string;
  rechazada_at?: string;
  cancelada_at?: string;
  factura_nueva_at?: string;
  comentario?: string;
  comentario_at?: string;
}

export interface Snapshot {
  id: string;
  exists: boolean;
  data: () => Record<string, unknown> | undefined;
}

export interface DocRef {
  id: string;
  path: string;
  get: () => Promise<Snapshot>;
  set: (data: Record<string, unknown>) => Promise<void>;
  update: (data: Record<string, unknown>) => Promise<void>;
  delete: () => Promise<void>;
  onSnapshot: (next: (snap: Snapshot) => void) => () => void;
}

export interface QuerySnapshot {
  docs: Snapshot[];
  size: number;
  empty: boolean;
}

export interface CollectionRef {
  orderBy: (field: string, dir?: "asc" | "desc") => CollectionRef;
  limit: (n: number) => CollectionRef;
  get: () => Promise<QuerySnapshot>;
  doc: (id: string) => DocRef;
  onSnapshot: (
    next: (snap: QuerySnapshot) => void,
    onError?: (error: unknown) => void,
  ) => () => void;
}

export interface P2PStore {
  doc: (path: string) => DocRef;
  collection: (path: string) => CollectionRef;
  nextCode: (build: (n: number) => Record<string, unknown>) => Promise<number>;
}

export interface VendorStatus {
  on: boolean;
  t: string;
  s: string;
}
