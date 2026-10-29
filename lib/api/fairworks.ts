// FairWorks Frontend API Wrappers
// Type-safe RPC helpers for frontend developers (Iwan, Riski, Chello)

import { createClient } from "@/lib/supabase/client";
import type { TaskVoteChoice, Database } from "@/types/database";

type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

export async function createRoom(nama: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_room", { p_nama: nama });
  if (error) throw error;
  return data;
}

export async function joinRoom(kode: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("join_room", { p_kode: kode });
  if (error) throw error;
  return data;
}

export async function submitContract(roomId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("submit_contract", { p_room_id: roomId });
  if (error) throw error;
  return data;
}

export async function voteContract(roomId: string, agree: boolean, note?: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("vote_contract", {
    p_room_id: roomId,
    p_agree: agree,
    p_note: note,
  });
  if (error) throw error;
  return data;
}

export async function autoLock(roomId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("auto_lock", { p_room_id: roomId });
  if (error) throw error;
  return data;
}

export async function takeTask(taskId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("take_task", { p_task_id: taskId });
  if (error) throw error;
  return data;
}

export async function submitProof(taskId: string, link: string, note?: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("submit_proof", {
    p_task_id: taskId,
    p_link: link,
    p_note: note,
  });
  if (error) throw error;
  return data;
}

export async function castVote(taskId: string, vote: TaskVoteChoice, note?: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("cast_vote", {
    p_task_id: taskId,
    p_vote: vote,
    p_note: note,
  });
  if (error) throw error;
  return data;
}

export async function getReport(token: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_report", { p_token: token });
  if (error) throw error;
  return data;
}

export async function releaseTask(taskId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      assignee_id: null,
      status: "open",
      revision_note: null,
    })
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export type LinkChipType = "GitHub" | "Dokumen Google" | "Figma" | "Drive" | "Lainnya";

export function detectLinkType(url: string): LinkChipType {
  const lower = url.toLowerCase();
  if (lower.includes("github.com")) return "GitHub";
  if (lower.includes("docs.google.com")) return "Dokumen Google";
  if (lower.includes("figma.com")) return "Figma";
  if (lower.includes("drive.google.com")) return "Drive";
  return "Lainnya";
}

export async function createTask(params: {
  roomId: string;
  judul: string;
  deskripsi?: string;
  poin?: number;
  dueDate?: string;
}) {
  const supabase = createClient();
  const userRes = await supabase.auth.getUser();
  const userId = userRes.data.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      room_id: params.roomId,
      judul: params.judul.trim(),
      deskripsi: params.deskripsi?.trim() || null,
      poin: params.poin ?? 10,
      due_date: params.dueDate || null,
      status: "open",
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(
  taskId: string,
  params: {
    judul?: string;
    deskripsi?: string;
    poin?: number;
    dueDate?: string;
  }
) {
  const supabase = createClient();
  const payload: TaskUpdate = {};
  if (params.judul !== undefined) payload.judul = params.judul.trim();
  if (params.deskripsi !== undefined) payload.deskripsi = params.deskripsi.trim() || null;
  if (params.poin !== undefined) payload.poin = params.poin;
  if (params.dueDate !== undefined) payload.due_date = params.dueDate || null;

  const { data, error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", taskId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(taskId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
  return true;
}

export async function getUserDashboardData() {
  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return null;
  }

  // Ambil profil
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, nama")
    .eq("id", user.id)
    .single();

  // Ambil ruangan yang diikuti user
  const { data: memberRooms, error: roomErr } = await supabase
    .from("room_members")
    .select("room_id, peran, rooms(id, nama, kode, locked_at, contract_deadline)")
    .eq("user_id", user.id);

  if (roomErr) throw roomErr;

  // Tugas milik user yang masih berjalan (untuk kartu "Tugas Anda")
  const { data: myTasks } = await supabase
    .from("tasks")
    .select("id, judul, status, poin, due_date, rooms(nama)")
    .eq("assignee_id", user.id)
    .in("status", ["open", "doing", "review"])
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(8);

  return {
    user: profile || { id: user.id, email: user.email, nama: user.email?.split("@")[0] || "User" },
    rooms: memberRooms || [],
    myTasks: myTasks || [],
  };
}

export interface RoomTask {
  id: string;
  judul: string;
  deskripsi: string | null;
  poin: number;
  status: "open" | "doing" | "review" | "done";
  assignee_id: string | null;
  due_date: string | null;
  submit_link: string | null;
  submit_note: string | null;
  revision_note: string | null;
  created_at: string;
}

export interface RoomMember {
  user_id: string;
  peran: string;
  profiles: { nama: string | null } | null;
}

export interface RoomActivity {
  id: string;
  aksi: string;
  created_at: string;
  profiles: { nama: string | null } | null;
}

// Data lengkap satu ruangan: tugas, anggota, aktivitas terakhir
export async function getRoomData(roomId: string) {
  const supabase = createClient();
  const [{ data: tasks, error }, { data: members }, { data: activities }] = await Promise.all([
    supabase.from("tasks").select("*").eq("room_id", roomId).order("created_at", { ascending: true }),
    supabase.from("room_members").select("user_id, peran, profiles(nama)").eq("room_id", roomId),
    supabase
      .from("activity_log")
      .select("id, aksi, created_at, profiles:actor_id(nama)")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  if (error) throw error;
  return {
    tasks: (tasks ?? []) as RoomTask[],
    members: (members ?? []) as RoomMember[],
    activities: (activities ?? []) as RoomActivity[],
  };
}
