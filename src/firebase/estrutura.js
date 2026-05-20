// src/firebase/estrutura.js
//
// Funções para salvar e buscar dados no Firestore do ProShelf.
// Importe as funções que precisar em cada tela.
//
// Estrutura do banco:
//
// users/{uid}                        → perfil do professor
// turmas/{uid}/lista/{turmaId}       → turmas do professor
//   └── registros/{registroId}       → aulas de cada turma
// cronogramas/{uid}/aulas/{aulaId}   → horário fixo semanal
// arquivos/{uid}/lista/{arquivoId}   → metadados dos arquivos
// calendario/{uid}/eventos/{id}      → eventos do calendário

import {
  doc, setDoc, getDoc,
  collection, addDoc, getDocs,
  updateDoc, deleteDoc,
  serverTimestamp, query, orderBy
} from "firebase/firestore";
import { db } from "../firebase";


// ═══════════════════════════════════════════════════════════
//  PERFIL DO PROFESSOR
// ═══════════════════════════════════════════════════════════

// Cria o perfil na primeira vez que o professor loga
export async function criarPerfil(uid, email) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return; // já existe, não sobrescreve

  await setDoc(ref, {
    nome: "",
    nomeUsuario: "",
    instituicao: "",
    modalidade: "Presencial",
    email: email,
    role: "professor",
    criadoEm: serverTimestamp(),
  });
}

// Atualiza perfil do professor
export async function salvarPerfil(uid, dados) {
  await setDoc(doc(db, "users", uid), {
    ...dados,
    atualizadoEm: serverTimestamp(),
  }, { merge: true });
}

// Busca perfil do professor
export async function buscarPerfil(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}


// ═══════════════════════════════════════════════════════════
//  TURMAS
// ═══════════════════════════════════════════════════════════

// Cria uma nova turma
// dados: { nome, disciplina, periodo }
export async function criarTurma(uid, dados) {
  const ref = collection(db, "turmas", uid, "lista");
  return await addDoc(ref, {
    nome: dados.nome || "",
    disciplina: dados.disciplina || "",
    periodo: dados.periodo || "Matutino",
    criadoEm: serverTimestamp(),
  });
}

// Busca todas as turmas do professor
export async function buscarTurmas(uid) {
  const snap = await getDocs(collection(db, "turmas", uid, "lista"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Atualiza uma turma
export async function atualizarTurma(uid, turmaId, dados) {
  await updateDoc(doc(db, "turmas", uid, "lista", turmaId), dados);
}

// Deleta uma turma
export async function deletarTurma(uid, turmaId) {
  await deleteDoc(doc(db, "turmas", uid, "lista", turmaId));
}


// ═══════════════════════════════════════════════════════════
//  REGISTROS DE AULA
// ═══════════════════════════════════════════════════════════

// Cria um novo registro de aula dentro de uma turma
// dados: { data, conteudo, descricao, informacoes, tipo, anexos }
export async function criarRegistroAula(uid, turmaId, dados) {
  const ref = collection(db, "turmas", uid, "lista", turmaId, "registros");
  return await addDoc(ref, {
    data: dados.data || "",
    conteudo: dados.conteudo || "",
    descricao: dados.descricao || "",
    informacoes: dados.informacoes || "",
    tipo: dados.tipo || "teorica", // teorica | pratica | atividade | avaliacao
    anexos: dados.anexos || [],
    criadoEm: serverTimestamp(),
  });
}

// Busca todos os registros de uma turma (ordenados por data)
export async function buscarRegistros(uid, turmaId) {
  const ref = collection(db, "turmas", uid, "lista", turmaId, "registros");
  const snap = await getDocs(query(ref, orderBy("data", "asc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Atualiza um registro de aula
export async function atualizarRegistro(uid, turmaId, registroId, dados) {
  await updateDoc(
    doc(db, "turmas", uid, "lista", turmaId, "registros", registroId),
    dados
  );
}

// Deleta um registro de aula
export async function deletarRegistro(uid, turmaId, registroId) {
  await deleteDoc(
    doc(db, "turmas", uid, "lista", turmaId, "registros", registroId)
  );
}


// ═══════════════════════════════════════════════════════════
//  CRONOGRAMA (fixo semanal)
// ═══════════════════════════════════════════════════════════

// Adiciona uma aula ao cronograma fixo
// dados: { dia, ordem, periodo, disciplina, turma, sala }
export async function criarAulaCronograma(uid, dados) {
  const ref = collection(db, "cronogramas", uid, "aulas");
  return await addDoc(ref, {
    dia: dados.dia || "SEG",         // DOM|SEG|TER|QUA|QUI|SEX|SAB
    ordem: dados.ordem || 1,         // posição da aula no dia
    periodo: dados.periodo || "Matutino",
    disciplina: dados.disciplina || "",
    turma: dados.turma || "",
    sala: dados.sala || "",
    criadoEm: serverTimestamp(),
  });
}

// Busca o cronograma completo do professor
export async function buscarCronograma(uid) {
  const snap = await getDocs(collection(db, "cronogramas", uid, "aulas"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Atualiza uma aula do cronograma
export async function atualizarAulaCronograma(uid, aulaId, dados) {
  await updateDoc(doc(db, "cronogramas", uid, "aulas", aulaId), dados);
}

// Deleta uma aula do cronograma
export async function deletarAulaCronograma(uid, aulaId) {
  await deleteDoc(doc(db, "cronogramas", uid, "aulas", aulaId));
}


// ═══════════════════════════════════════════════════════════
//  ARQUIVOS (metadados — o arquivo em si vai pro Storage)
// ═══════════════════════════════════════════════════════════

// Salva metadados de um arquivo após fazer upload no Storage
// dados: { nome, url, tipo, fixado }
export async function salvarArquivo(uid, dados) {
  const ref = collection(db, "arquivos", uid, "lista");
  return await addDoc(ref, {
    nome: dados.nome || "",
    url: dados.url || "",
    tipo: dados.tipo || "pdf",   // pdf | imagem
    fixado: dados.fixado || false,
    criadoEm: serverTimestamp(),
  });
}

// Busca todos os arquivos do professor
export async function buscarArquivos(uid) {
  const snap = await getDocs(
    query(collection(db, "arquivos", uid, "lista"), orderBy("criadoEm", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Fixa ou desfixa um arquivo
export async function toggleFixarArquivo(uid, arquivoId, fixado) {
  await updateDoc(doc(db, "arquivos", uid, "lista", arquivoId), { fixado });
}

// Deleta metadados de um arquivo
export async function deletarArquivo(uid, arquivoId) {
  await deleteDoc(doc(db, "arquivos", uid, "lista", arquivoId));
}


// ═══════════════════════════════════════════════════════════
//  CALENDÁRIO
// ═══════════════════════════════════════════════════════════

// Cria um evento no calendário
// dados: { titulo, data, tipo, descricao }
export async function criarEvento(uid, dados) {
  const ref = collection(db, "calendario", uid, "eventos");
  return await addDoc(ref, {
    titulo: dados.titulo || "",
    data: dados.data || "",          // formato: "YYYY-MM-DD"
    tipo: dados.tipo || "reuniao",   // reuniao | feriado | passeio | avaliacao
    descricao: dados.descricao || "",
    criadoEm: serverTimestamp(),
  });
}

// Busca todos os eventos do professor
export async function buscarEventos(uid) {
  const snap = await getDocs(
    query(collection(db, "calendario", uid, "eventos"), orderBy("data", "asc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Deleta um evento
export async function deletarEvento(uid, eventoId) {
  await deleteDoc(doc(db, "calendario", uid, "eventos", eventoId));
}