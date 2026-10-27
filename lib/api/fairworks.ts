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
