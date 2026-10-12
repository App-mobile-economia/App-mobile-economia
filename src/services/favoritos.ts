// CRUD dos favoritos na tabela "favoritos" do Supabase.
// O user_id é preenchido pelo próprio banco e a RLS garante que cada pessoa só enxerga os seus.
import { supabase } from '@/lib/supabase';

export type Favorito = { id: number; indicador: string; nota: string };

// READ - lista os favoritos do usuário
export async function listarFavoritos(): Promise<Favorito[]> {
  const { data, error } = await supabase.from('favoritos').select('id, indicador, nota').order('id');
  if (error) throw error;
  return data;
}

// CREATE - adiciona um favorito
export async function adicionarFavorito(indicador: string) {
  const { error } = await supabase.from('favoritos').insert({ indicador });
  if (error) throw error;
}

// UPDATE - altera a nota de um favorito
export async function atualizarNota(id: number, nota: string) {
  const { error } = await supabase.from('favoritos').update({ nota }).eq('id', id);
  if (error) throw error;
}

// DELETE - remove um favorito
export async function removerFavorito(id: number) {
  const { error } = await supabase.from('favoritos').delete().eq('id', id);
  if (error) throw error;
}
