// FairWorks Database TypeScript Definitions
// Polished matching Supabase Schema & RPC (T2) with Postgrest-js v1.18+ GenericSchema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TaskStatus = 'open' | 'doing' | 'review' | 'done';
export type MemberRole = 'ketua' | 'anggota';
export type ContractVote = 'agree' | 'request_changes';
export type TaskVoteChoice = 'ok' | 'revisi';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          nama: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          nama?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nama?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          nama: string;
          kode: string;
          owner_id: string;
          report_token: string;
          locked_at: string | null;
          contract_deadline: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nama: string;
          kode: string;
          owner_id: string;
          report_token?: string;
          locked_at?: string | null;
          contract_deadline?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nama?: string;
          kode?: string;
          owner_id?: string;
          report_token?: string;
          locked_at?: string | null;
          contract_deadline?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      room_members: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          peran: MemberRole;
          contract_vote: ContractVote | null;
          contract_vote_note: string | null;
          contract_voted_at: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          peran?: MemberRole;
          contract_vote?: ContractVote | null;
          contract_vote_note?: string | null;
          contract_voted_at?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          peran?: MemberRole;
          contract_vote?: ContractVote | null;
          contract_vote_note?: string | null;
          contract_voted_at?: string | null;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      tasks: {
        Row: {
          id: string;
          room_id: string;
          judul: string;
          deskripsi: string | null;
          poin: number;
          due_date: string | null;
          status: TaskStatus;
          assignee_id: string | null;
          submit_link: string | null;
          submit_note: string | null;
          submit_at: string | null;
          revision_note: string | null;
          vote_round: number;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          judul: string;
          deskripsi?: string | null;
          poin?: number;
          due_date?: string | null;
          status?: TaskStatus;
          assignee_id?: string | null;
          submit_link?: string | null;
          submit_note?: string | null;
          submit_at?: string | null;
          revision_note?: string | null;
          vote_round?: number;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          judul?: string;
          deskripsi?: string | null;
          poin?: number;
          due_date?: string | null;
          status?: TaskStatus;
          assignee_id?: string | null;
          submit_link?: string | null;
          submit_note?: string | null;
          submit_at?: string | null;
          revision_note?: string | null;
          vote_round?: number;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey";
            columns: ["assignee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      task_votes: {
        Row: {
          id: string;
          task_id: string;
          voter_id: string;
          vote_round: number;
          vote: TaskVoteChoice;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          voter_id: string;
          vote_round?: number;
          vote: TaskVoteChoice;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          voter_id?: string;
          vote_round?: number;
          vote?: TaskVoteChoice;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_votes_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_votes_voter_id_fkey";
            columns: ["voter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      activity_log: {
        Row: {
          id: string;
          room_id: string;
          actor_id: string | null;
          aksi: string;
          task_id: string | null;
          meta: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          actor_id?: string | null;
          aksi: string;
          task_id?: string | null;
          meta?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          actor_id?: string | null;
          aksi?: string;
          task_id?: string | null;
          meta?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_log_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_log_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          room_id: string | null;
          tipe: string;
          payload: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          room_id?: string | null;
          tipe: string;
          payload?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          room_id?: string | null;
          tipe?: string;
          payload?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_room: {
        Args: { p_nama: string };
        Returns: Json;
      };
      join_room: {
        Args: { p_kode: string };
        Returns: Json;
      };
      submit_contract: {
        Args: { p_room_id: string };
        Returns: Json;
      };
      vote_contract: {
        Args: { p_room_id: string; p_agree: boolean; p_note?: string };
        Returns: Json;
      };
      auto_lock: {
        Args: { p_room_id: string };
        Returns: Json;
      };
      take_task: {
        Args: { p_task_id: string };
        Returns: Json;
      };
      submit_proof: {
        Args: { p_task_id: string; p_link: string; p_note?: string };
        Returns: Json;
      };
      cast_vote: {
        Args: { p_task_id: string; p_vote: 'ok' | 'revisi'; p_note?: string };
        Returns: Json;
      };
      get_report: {
        Args: { p_token: string };
        Returns: Json;
      };
    };
    Enums: {
      task_status: TaskStatus;
      member_role: MemberRole;
      contract_vote: ContractVote;
      task_vote_choice: TaskVoteChoice;
    };
    CompositeTypes: Record<string, never>;
  };
}
