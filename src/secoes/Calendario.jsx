// src/secoes/Calendario.jsx

import { useState, useEffect } from 'react'
import { buscarEventos, criarEvento, deletarEvento } from '../firebase/estrutura'
import './secoes.css'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA = ['D','S','T','Q','Q','S','S']

const COR_TIPO = {
  reuniao:   { bg: '#EEEDFE', cor: '#6F3B9D', label: 'Reunião' },
  feriado:   { bg: '#e8f5e9', cor: '#1b5e20', label: 'Feriado' },
  passeio:   { bg: '#fce4ec', cor: '#880e4f', label: 'Passeio' },
  avaliacao: { bg: '#fff3e0', cor: '#e65100', label: 'Avaliação' },
}

const FORM_INICIAL = { titulo: '', data: '', tipo: 'reuniao', descricao: '' }

export default function Calendario({ uid }) {
  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth())
  const [ano, setAno] = useState(hoje.getFullYear())
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(FORM_INICIAL)
  const [erro, setErro] = useState('')
  const [diaSelecionado, setDiaSelecionado] = useState(null)

  useEffect(() => {
    if (!uid) return
    buscarEventos(uid).then(dados => { setEventos(dados); setLoading(false) })
  }, [uid])

  function diasDoMes(m, a)      { return new Date(a, m + 1, 0).getDate() }
  function primeiroDiaSemana(m, a) { return new Date(a, m, 1).getDay() }

  function temEvento(dia) {
    const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return eventos.some(e => e.data === dataStr)
  }

  function eventosDoMes() {
    const prefixo = `${ano}-${String(mes + 1).padStart(2, '0')}`
    return eventos
      .filter(e => e.data?.startsWith(prefixo))
      .sort((a, b) => a.data.localeCompare(b.data))
  }

  function eventosDoDia(dia) {
    if (!dia) return []
    const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return eventos.filter(e => e.data === dataStr)
  }

  function formatarData(dataStr) {
    if (!dataStr) return ''
    const [, m, d] = dataStr.split('-')
    return `${d}/${m}`
  }

  function abrirModal(dia = null) {
    setErro('')
    if (dia) {
      const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
      setForm({ ...FORM_INICIAL, data: dataStr })
    } else {
      setForm(FORM_INICIAL)
    }
    setModalAberto(true)
  }

  async function handleSalvar() {
    if (!form.titulo.trim()) { setErro('Informe o título do evento.'); return }
    if (!form.data)          { setErro('Informe a data.'); return }
    setSalvando(true)
    try {
      await criarEvento(uid, form)
      const dados = await buscarEventos(uid)
      setEventos(dados)
      setModalAberto(false)
      setForm(FORM_INICIAL)
    } catch {
      setErro('Erro ao salvar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  async function handleDeletar(id) {
    if (!window.confirm('Remover este evento?')) return
    await deletarEvento(uid, id)
    setEventos(prev => prev.filter(e => e.id !== id))
  }

  const total = diasDoMes(mes, ano)
  const primeiro = primeiroDiaSemana(mes, ano)
  const celulas = Array(primeiro).fill(null).concat(Array.from({ length: total }, (_, i) => i + 1))

  const eventosDiaSel = eventosDoDia(diaSelecionado)

  return (
    <div className='grid-2'>
      {/* Calendário visual */}
      <div className='card'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <button className='cal-nav' onClick={() => { if (mes === 0) { setMes(11); setAno(a => a-1) } else setMes(m => m-1) }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{MESES[mes]} {ano}</span>
          <button className='cal-nav' onClick={() => { if (mes === 11) { setMes(0); setAno(a => a+1) } else setMes(m => m+1) }}>›</button>
        </div>

        <div className='cal-grid'>
          {DIAS_SEMANA.map((d, i) => (
            <div key={i} className='cal-dia-label'>{d}</div>
          ))}
          {celulas.map((dia, i) => {
            const isHoje = dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear()
            const comEvento = dia && temEvento(dia)
            const isSelecionado = dia === diaSelecionado
            return (
              <div
                key={i}
                className={`cal-dia ${isHoje ? 'hoje' : ''} ${comEvento ? 'tem-evento' : ''} ${isSelecionado ? 'selecionado' : ''}`}
                onClick={() => dia && setDiaSelecionado(dia === diaSelecionado ? null : dia)}
                style={{ cursor: dia ? 'pointer' : 'default' }}
              >
                {dia || ''}
              </div>
            )
          })}
        </div>

        {/* Eventos do dia selecionado */}
        {diaSelecionado && (
          <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>
                {String(diaSelecionado).padStart(2,'0')}/{String(mes+1).padStart(2,'0')}
              </span>
              <button
                className='btn-upload'
                style={{ marginTop: 0, fontSize: 11, padding: '4px 10px' }}
                onClick={() => abrirModal(diaSelecionado)}
              >+ Evento</button>
            </div>
            {eventosDiaSel.length === 0 ? (
              <p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>Nenhum evento neste dia.</p>
            ) : (
              eventosDiaSel.map(ev => {
                const tipo = COR_TIPO[ev.tipo] || COR_TIPO.reuniao
                return (
                  <div key={ev.id} className='cal-evento' style={{ borderLeftColor: tipo.cor }}>
                    <div className='cal-evento-nome'>{ev.titulo}</div>
                    <span className='cal-evento-badge' style={{ background: tipo.bg, color: tipo.cor }}>{tipo.label}</span>
                    <button className='arquivo-acao' onClick={() => handleDeletar(ev.id)} title='Remover'>🗑️</button>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Eventos do mês */}
      <div className='card'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className='card-titulo' style={{ marginBottom: 0 }}> Eventos — {MESES[mes]}</div>
          <button className='btn-upload' style={{ marginTop: 0 }} onClick={() => abrirModal()}>
            + Novo evento
          </button>
        </div>

        {loading ? (
          <p className='secao-vazia'>Carregando...</p>
        ) : eventosDoMes().length === 0 ? (
          <p className='secao-vazia'>Nenhum evento neste mês.</p>
        ) : (
          eventosDoMes().map(ev => {
            const tipo = COR_TIPO[ev.tipo] || COR_TIPO.reuniao
            return (
              <div
                key={ev.id}
                className='cal-evento'
                style={{ borderLeftColor: tipo.cor, cursor: 'pointer' }}
                onClick={() => {
                  const dia = parseInt(ev.data.split('-')[2])
                  setDiaSelecionado(dia)
                }}
              >
                <div className='cal-evento-data'>{formatarData(ev.data)}</div>
                <div className='cal-evento-nome'>{ev.titulo}</div>
                <span className='cal-evento-badge' style={{ background: tipo.bg, color: tipo.cor }}>{tipo.label}</span>
                <button className='arquivo-acao' onClick={(e) => { e.stopPropagation(); handleDeletar(ev.id) }} title='Remover'>🗑️</button>
              </div>
            )
          })
        )}
      </div>

      {/* Modal novo evento */}
      {modalAberto && (
        <div className='modal-overlay' onClick={() => setModalAberto(false)}>
          <div className='modal' onClick={e => e.stopPropagation()}>
            <h3 className='modal-titulo'>Novo evento</h3>

            <div className='perfil-grupo'>
              <label className='perfil-label'>Título</label>
              <input className='perfil-input' value={form.titulo}
                onChange={e => setForm({...form, titulo: e.target.value})}
                placeholder='Nome do evento' autoFocus />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className='perfil-grupo'>
                <label className='perfil-label'>Data</label>
                <input className='perfil-input' type='date' value={form.data}
                  onChange={e => setForm({...form, data: e.target.value})} />
              </div>
              <div className='perfil-grupo'>
                <label className='perfil-label'>Tipo</label>
                <select className='perfil-input' value={form.tipo}
                  onChange={e => setForm({...form, tipo: e.target.value})}>
                  {Object.entries(COR_TIPO).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className='perfil-grupo'>
              <label className='perfil-label'>Descrição (opcional)</label>
              <textarea className='perfil-input' rows={2} value={form.descricao}
                onChange={e => setForm({...form, descricao: e.target.value})}
                placeholder='Detalhes do evento' />
            </div>

            {erro && <p style={{ color: '#c0392b', fontSize: 12, margin: '4px 0' }}>{erro}</p>}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className='perfil-salvar' onClick={handleSalvar} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar evento'}
              </button>
              <button className='btn-cancelar' onClick={() => setModalAberto(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}