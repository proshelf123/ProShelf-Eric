// src/secoes/Turmas.jsx

import { useState, useEffect, useRef } from 'react'
import {
  buscarTurmas, criarTurma, deletarTurma,
  buscarRegistros, criarRegistroAula, deletarRegistro
} from '../firebase/estrutura'
import './secoes.css'

const COR_DISCIPLINA = {
  'Matemática': { ativo: '#880e4f', bg: '#fce4ec', cor: '#880e4f' },
  'Física':     { ativo: '#0d47a1', bg: '#e3f2fd', cor: '#0d47a1' },
  'Química':    { ativo: '#1b5e20', bg: '#e8f5e9', cor: '#1b5e20' },
}

const COR_TIPO = {
  teorica:   { bg: '#e3f2fd', cor: '#0d47a1', label: 'Teórica' },
  pratica:   { bg: '#e8f5e9', cor: '#1b5e20', label: 'Prática' },
  atividade: { bg: '#fff3e0', cor: '#e65100', label: 'Atividade' },
  avaliacao: { bg: '#fce4ec', cor: '#880e4f', label: 'Avaliação' },
}

const PERIODOS = ['Matutino', 'Vespertino', 'Noturno']

const FORM_TURMA_INICIAL = { nome: '', disciplina: '', periodo: 'Matutino' }
const FORM_REGISTRO_INICIAL = { data: '', conteudo: '', descricao: '', informacoes: '', tipo: 'teorica' }

export default function Turmas({ uid }) {
  const [turmas, setTurmas] = useState([])
  const [disciplinas, setDisciplinas] = useState([])
  const [disciplinaAtiva, setDisciplinaAtiva] = useState(null)
  const [turmaAberta, setTurmaAberta] = useState(null)
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)

  // Modais
  const [modalTurma, setModalTurma] = useState(false)
  const [modalRegistro, setModalRegistro] = useState(false)
  const [formTurma, setFormTurma] = useState(FORM_TURMA_INICIAL)
  const [formRegistro, setFormRegistro] = useState(FORM_REGISTRO_INICIAL)
  const [salvando, setSalvando] = useState(false)
  const [erroTurma, setErroTurma] = useState('')
  const [erroRegistro, setErroRegistro] = useState('')

  // Dropdowns customizados
  const [dropdownAberto, setDropdownAberto] = useState(null)

  useEffect(() => {
    if (!uid) return
    carregarTurmas()
  }, [uid])

  async function carregarTurmas() {
    const dados = await buscarTurmas(uid)
    setTurmas(dados)
    const discs = [...new Set(dados.map(t => t.disciplina))].filter(Boolean)
    setDisciplinas(discs)
    if (discs.length > 0) setDisciplinaAtiva(discs[0])
    setLoading(false)
  }

  async function abrirTurma(turma) {
    setTurmaAberta(turma)
    const regs = await buscarRegistros(uid, turma.id)
    setRegistros(regs)
  }

  // ── Salvar nova turma ──
  async function handleSalvarTurma() {
    if (!formTurma.nome.trim())       { setErroTurma('Informe o nome da turma.'); return }
    if (!formTurma.disciplina.trim()) { setErroTurma('Informe a disciplina.'); return }
    setSalvando(true)
    try {
      await criarTurma(uid, formTurma)
      await carregarTurmas()
      setModalTurma(false)
      setFormTurma(FORM_TURMA_INICIAL)
    } catch {
      setErroTurma('Erro ao salvar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  // ── Deletar turma ──
  async function handleDeletarTurma(turmaId, e) {
    e.stopPropagation()
    if (!window.confirm('Tem certeza? Todos os registros desta turma serão removidos.')) return
    await deletarTurma(uid, turmaId)
    await carregarTurmas()
  }

  // ── Salvar novo registro de aula ──
  async function handleSalvarRegistro() {
    if (!formRegistro.data)            { setErroRegistro('Informe a data da aula.'); return }
    if (!formRegistro.conteudo.trim()) { setErroRegistro('Informe o conteúdo da aula.'); return }
    setSalvando(true)
    try {
      await criarRegistroAula(uid, turmaAberta.id, formRegistro)
      const regs = await buscarRegistros(uid, turmaAberta.id)
      setRegistros(regs)
      setModalRegistro(false)
      setFormRegistro(FORM_REGISTRO_INICIAL)
    } catch {
      setErroRegistro('Erro ao salvar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  // ── Deletar registro ──
  async function handleDeletarRegistro(registroId) {
    await deletarRegistro(uid, turmaAberta.id, registroId)
    setRegistros(prev => prev.filter(r => r.id !== registroId))
  }

  // ── Dropdown customizado ──
  function DropdownCustomizado({ label, opcoes, valor, onChange, id }) {
    return (
      <div className='perfil-grupo' style={{ position: 'relative' }}>
        <label className='perfil-label'>{label}</label>
        <button
          className={`dropdown-trigger ${dropdownAberto === id ? 'aberto' : ''}`}
          onClick={() => setDropdownAberto(dropdownAberto === id ? null : id)}
          style={{
            background: 'white',
            border: '1px solid var(--borda)',
            borderRadius: '8px',
            padding: '9px 12px',
            fontSize: '13px',
            fontFamily: "'Poppins', sans-serif",
            color: 'var(--texto)',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all .15s',
            width: '100%',
            zIndex: 10,
          }}
          onMouseEnter={(e) => e.target.style.borderColor = 'var(--roxo)'}
          onMouseLeave={(e) => e.target.style.borderColor = 'var(--borda)'}
        >
          <span>{valor}</span>
          <span className='arrow' style={{ fontSize: '16px', color: 'var(--roxo)' }}>▼</span>
        </button>
        {dropdownAberto === id && (
          <div 
            className='dropdown-menu'
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {opcoes.map((opt) => (
              <button
                key={opt}
                className='dropdown-item'
                onClick={() => {
                  onChange(opt)
                  setDropdownAberto(null)
                }}
                onMouseEnter={(e) => {
                  if (valor !== opt) {
                    e.target.style.backgroundColor = '#F1EDF4'
                  }
                }}
                onMouseLeave={(e) => {
                  if (valor !== opt) {
                    e.target.style.backgroundColor = 'white'
                  }
                }}
                style={{
                  background: valor === opt ? 'var(--roxo)' : 'white',
                  color: valor === opt ? 'white' : 'var(--texto)',
                }}
              >
                {valor === opt && <span style={{ marginRight: '8px' }}>✓</span>}
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const turmasFiltradas = turmas.filter(t => t.disciplina === disciplinaAtiva)
  const cores = COR_DISCIPLINA[disciplinaAtiva] || { ativo: '#6F3B9D', bg: '#EEEDFE', cor: '#6F3B9D' }

  // ════════════════════════════════════════════════
  //  TELA: registros de uma turma específica
  // ════════════════════════════════════════════════
  if (turmaAberta) {
    return (
      <div className='card'>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button className='btn-voltar' onClick={() => setTurmaAberta(null)}>← Voltar</button>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
              {turmaAberta.disciplina}
            </h3>
            <span style={{ fontSize: 12, color: '#666' }}>{turmaAberta.nome} · {turmaAberta.periodo}</span>
          </div>
          <button className='btn-upload' style={{ marginTop: 0 }} onClick={() => { setErroRegistro(''); setModalRegistro(true) }}>
            + Novo registro
          </button>
        </div>

        {/* Legenda de tipos */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {Object.entries(COR_TIPO).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: v.cor }} />
              <span style={{ fontSize: 11, color: '#666' }}>{v.label}</span>
            </div>
          ))}
        </div>

        {registros.length === 0 ? (
          <p className='secao-vazia'>Nenhum registro de aula ainda. Clique em "+ Novo registro" para adicionar.</p>
        ) : (
          registros.map((r) => {
            const tipo = COR_TIPO[r.tipo] || COR_TIPO.teorica
            return (
              <div key={r.id} className='registro-item' style={{ borderLeftColor: tipo.cor }}>
                <div className='registro-header'>
                  <span className='registro-data'>{r.data}</span>
                  <span className='registro-badge' style={{ background: tipo.bg, color: tipo.cor }}>{tipo.label}</span>
                  <button className='arquivo-acao' onClick={() => handleDeletarRegistro(r.id)} title='Remover'>🗑️</button>
                </div>
                <p className='registro-conteudo'>{r.conteudo}</p>
                {r.descricao  && <p className='registro-desc'>{r.descricao}</p>}
                {r.informacoes && <p className='registro-info'>💡 {r.informacoes}</p>}
              </div>
            )
          })
        )}

        {/* Modal novo registro */}
        {modalRegistro && (
          <div className='modal-overlay' onClick={() => setModalRegistro(false)}>
            <div className={`modal ${dropdownAberto ? 'dropdown-aberto' : ''}`} onClick={e => e.stopPropagation()}>
              <h3 className='modal-titulo'>Novo registro de aula</h3>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                {turmaAberta.disciplina} · {turmaAberta.nome}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className='perfil-grupo'>
                  <label className='perfil-label'>Data da aula</label>
                  <input className='perfil-input' type='date' value={formRegistro.data}
                    onChange={e => setFormRegistro({ ...formRegistro, data: e.target.value })} />
                </div>
                <div className='perfil-grupo'>
                  <label className='perfil-label'>Tipo</label>
                  <DropdownCustomizado
                    label=''
                    opcoes={Object.values(COR_TIPO).map(v => v.label)}
                    valor={COR_TIPO[formRegistro.tipo].label}
                    onChange={(opt) => {
                      const tipoKey = Object.entries(COR_TIPO).find(([, v]) => v.label === opt)?.[0]
                      setFormRegistro({ ...formRegistro, tipo: tipoKey })
                    }}
                    id='tipo-registro'
                  />
                </div>
              </div>

              <div className='perfil-grupo'>
                <label className='perfil-label'>Conteúdo da aula</label>
                <input className='perfil-input' value={formRegistro.conteudo}
                  onChange={e => setFormRegistro({ ...formRegistro, conteudo: e.target.value })}
                  placeholder='Ex: Introdução às equações de 2º grau' />
              </div>

              <div className='perfil-grupo'>
                <label className='perfil-label'>Descrição (opcional)</label>
                <textarea className='perfil-input' rows={2} value={formRegistro.descricao}
                  onChange={e => setFormRegistro({ ...formRegistro, descricao: e.target.value })}
                  placeholder='Detalhes sobre o desenvolvimento da aula' />
              </div>

              <div className='perfil-grupo'>
                <label className='perfil-label'>Informações adicionais (opcional)</label>
                <textarea className='perfil-input' rows={2} value={formRegistro.informacoes}
                  onChange={e => setFormRegistro({ ...formRegistro, informacoes: e.target.value })}
                  placeholder='Ex: Alunos sem uniforme, ocorrências, recados' />
              </div>

              {erroRegistro && <p style={{ color: '#c0392b', fontSize: 12, margin: '4px 0' }}>{erroRegistro}</p>}

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className='perfil-salvar' onClick={handleSalvarRegistro} disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar registro'}
                </button>
                <button className='btn-cancelar' onClick={() => setModalRegistro(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ════════════════════════════════════════════════
  //  TELA: lista de turmas
  // ════════════════════════════════════════════════
  return (
    <div className='card'>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className='card-titulo' style={{ marginBottom: 0 }}>👥 Turmas</div>
        <button className='btn-upload' style={{ marginTop: 0 }} onClick={() => { setErroTurma(''); setModalTurma(true) }}>
          + Nova turma
        </button>
      </div>

      {loading ? (
        <p className='secao-vazia'>Carregando...</p>
      ) : turmas.length === 0 ? (
        <p className='secao-vazia'>Nenhuma turma cadastrada. Clique em "+ Nova turma" para começar.</p>
      ) : (
        <>
          {/* Tabs de disciplina */}
          <div className='turma-tabs'>
            {disciplinas.map(d => {
              const c = COR_DISCIPLINA[d] || { ativo: '#6F3B9D' }
              return (
                <button
                  key={d}
                  className='turma-tab'
                  style={disciplinaAtiva === d
                    ? { background: c.ativo, color: '#fff', borderColor: c.ativo }
                    : {}}
                  onClick={() => setDisciplinaAtiva(d)}
                >
                  {d}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {turmasFiltradas.map(t => (
              <div key={t.id} style={{ position: 'relative' }}>
                <button
                  className='turma-item'
                  style={{ background: cores.bg, width: '100%' }}
                  onClick={() => abrirTurma(t)}
                >
                  <div>
                    <span style={{ color: cores.cor, display: 'block', fontWeight: 600 }}>{t.nome}</span>
                    <span style={{ color: cores.cor, fontSize: 11, opacity: 0.7 }}>{t.periodo}</span>
                  </div>
                  <span style={{ color: cores.cor, fontSize: 16 }}>›</span>
                </button>
                <button
                  onClick={(e) => handleDeletarTurma(t.id, e)}
                  style={{
                    position: 'absolute', top: 6, right: 28,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, opacity: 0.5,
                  }}
                  title='Remover turma'
                >🗑️</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal nova turma */}
      {modalTurma && (
        <div className='modal-overlay' onClick={() => setModalTurma(false)}>
          <div className={`modal ${dropdownAberto ? 'dropdown-aberto' : ''}`} onClick={e => e.stopPropagation()}>
            <h3 className='modal-titulo'>Nova turma</h3>

            <div className='perfil-grupo'>
              <label className='perfil-label'>Nome da turma</label>
              <input className='perfil-input' value={formTurma.nome}
                onChange={e => setFormTurma({ ...formTurma, nome: e.target.value })}
                placeholder='Ex: 1º RH, 2º Eletrônica' />
            </div>

            <div className='perfil-grupo'>
              <label className='perfil-label'>Disciplina</label>
              <input className='perfil-input' value={formTurma.disciplina}
                onChange={e => setFormTurma({ ...formTurma, disciplina: e.target.value })}
                placeholder='Ex: Matemática, Física, Química' />
            </div>

            <div className='perfil-grupo'>
              <label className='perfil-label'>Período</label>
              <DropdownCustomizado
                label=''
                opcoes={PERIODOS}
                valor={formTurma.periodo}
                onChange={(periodo) => setFormTurma({ ...formTurma, periodo })}
                id='periodo-turma'
              />
            </div>

            {erroTurma && <p style={{ color: '#c0392b', fontSize: 12, margin: '4px 0' }}>{erroTurma}</p>}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className='perfil-salvar' onClick={handleSalvarTurma} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar turma'}
              </button>
              <button className='btn-cancelar' onClick={() => setModalTurma(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}