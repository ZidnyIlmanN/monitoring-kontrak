// Level 1: Kontrak Payung (Umbrella Contract)
export interface KontrakPayung {
  id: string
  user_id: string
  nama_kontrak_payung: string
  nomor_oas: string
  waktu_perjanjian: string
  periode_kontrak: string
  nilai_kontrak: number
  sisa_nilai_kontrak?: number
  created_at: string
  updated_at: string
}

// Level 2: SPK (Work Orders)
export interface SPK {
  id: string
  kontrak_payung_id: string
  no_spk: string
  judul_spk: string
  durasi_spk: string
  nilai_rekapitulasi_estimasi_biaya: number
  realisasi_spk: number | null
  progress_percentage: number
  keterangan: string | null
  image_url_1: string | null
  image_url_2: string | null
  image_url_3: string | null
  pdf_url_1: string | null
  pdf_url_2: string | null
  pdf_url_3: string | null
  created_at: string
  updated_at: string
}

// Level 3: Notifikasi (Notifications)
export interface Notifikasi {
  id: string
  spk_id: string
  no_notif: string
  judul_notifikasi: string
  lokasi: string
  image_url: string | null
  pdf_url: string | null
  created_at: string
  updated_at: string
}

// Extended types with relations
export interface SPKWithNotifikasi extends SPK {
  notifikasi: Notifikasi[]
}

export interface KontrakPayungWithSPK extends KontrakPayung {
  spk: SPKWithNotifikasi[]
}

export interface Profile {
  id: string
  full_name: string
  role: "admin" | "user"
  created_at: string
}

// PDF Report interfaces
export interface NotifikasiData {
  id: string
  no_notif: string
  judul_notifikasi: string
  lokasi: string
}

export interface SPKData {
  id: string
  no_spk: string
  judul_spk: string
  durasi_spk: string
  nilai_rekapitulasi_estimasi_biaya: number
  realisasi_spk: number | null
  progress_percentage: number
  keterangan: string | null
  image_url_1: string | null
  image_url_2: string | null
  image_url_3: string | null
  notifikasi: NotifikasiData[]
}

export interface KontrakData {
  nama_kontrak_payung: string
  nomor_oas: string
  waktu_perjanjian: string
  periode_kontrak: string
  nilai_kontrak: number
  sisa_nilai_kontrak: number
}

export interface PDFData {
  kontrak: KontrakData
  spkList: SPKData[]
}

export type Report = PDFData
