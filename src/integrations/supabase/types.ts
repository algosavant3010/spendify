export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      budgets: {
        Row: { alert_threshold: number | null; amount: number; category_id: string | null; created_at: string | null; end_date: string | null; id: string; period: string; start_date: string; user_id: string };
        Insert: { alert_threshold?: number | null; amount: number; category_id?: string | null; created_at?: string | null; end_date?: string | null; id?: string; period?: string; start_date: string; user_id: string };
        Update: { alert_threshold?: number | null; amount?: number; category_id?: string | null; created_at?: string | null; end_date?: string | null; id?: string; period?: string; start_date?: string; user_id?: string };
        Relationships: [{ foreignKeyName: "budgets_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] }];
      };
      categories: {
        Row: { color: string | null; created_at: string | null; icon: string | null; id: string; name: string; type: Database["public"]["Enums"]["transaction_type"]; user_id: string };
        Insert: { color?: string | null; created_at?: string | null; icon?: string | null; id?: string; name: string; type: Database["public"]["Enums"]["transaction_type"]; user_id: string };
        Update: { color?: string | null; created_at?: string | null; icon?: string | null; id?: string; name?: string; type?: Database["public"]["Enums"]["transaction_type"]; user_id?: string };
        Relationships: [];
      };
      expense_splits: {
        Row: { created_at: string; id: string; settled: boolean | null; split_with: Json; title: string; total_amount: number; updated_at: string; user_id: string };
        Insert: { created_at?: string; id?: string; settled?: boolean | null; split_with?: Json; title: string; total_amount: number; updated_at?: string; user_id: string };
        Update: { created_at?: string; id?: string; settled?: boolean | null; split_with?: Json; title?: string; total_amount?: number; updated_at?: string; user_id?: string };
        Relationships: [];
      };
      profiles: {
        Row: { avatar_url: string | null; created_at: string; display_name: string | null; id: string; updated_at: string };
        Insert: { avatar_url?: string | null; created_at?: string; display_name?: string | null; id: string; updated_at?: string };
        Update: { avatar_url?: string | null; created_at?: string; display_name?: string | null; id?: string; updated_at?: string };
        Relationships: [];
      };
      savings_goals: {
        Row: { created_at: string | null; current_amount: number | null; id: string; name: string; target_amount: number; target_date: string | null; updated_at: string | null; user_id: string };
        Insert: { created_at?: string | null; current_amount?: number | null; id?: string; name: string; target_amount: number; target_date?: string | null; updated_at?: string | null; user_id: string };
        Update: { created_at?: string | null; current_amount?: number | null; id?: string; name?: string; target_amount?: number; target_date?: string | null; updated_at?: string | null; user_id?: string };
        Relationships: [];
      };
      transactions: {
        Row: { amount: number; category_id: string | null; created_at: string | null; date: string; description: string | null; id: string; is_recurring: boolean | null; receipt_url: string | null; recurring_frequency: string | null; title: string; type: Database["public"]["Enums"]["transaction_type"]; updated_at: string | null; user_id: string };
        Insert: { amount: number; category_id?: string | null; created_at?: string | null; date?: string; description?: string | null; id?: string; is_recurring?: boolean | null; receipt_url?: string | null; recurring_frequency?: string | null; title: string; type: Database["public"]["Enums"]["transaction_type"]; updated_at?: string | null; user_id: string };
        Update: { amount?: number; category_id?: string | null; created_at?: string | null; date?: string; description?: string | null; id?: string; is_recurring?: boolean | null; receipt_url?: string | null; recurring_frequency?: string | null; title?: string; type?: Database["public"]["Enums"]["transaction_type"]; updated_at?: string | null; user_id?: string };
        Relationships: [{ foreignKeyName: "transactions_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] }];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { transaction_type: "income" | "expense" };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];

export type Tables<TableName extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][TableName]["Row"];
export type TablesInsert<TableName extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][TableName]["Insert"];
export type TablesUpdate<TableName extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][TableName]["Update"];
export type Enums<EnumName extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][EnumName];

export const Constants = {
  public: { Enums: { transaction_type: ["income", "expense"] } },
} as const;
