// FairWorks Frontend API Wrappers
// Type-safe RPC helpers for frontend developers (Iwan, Riski, Chello)

import { createClient } from "@/lib/supabase/client";
import type { TaskVoteChoice } from "@/types/database";

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
