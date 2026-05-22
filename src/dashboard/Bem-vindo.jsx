// src/secoes/Bemvindo.jsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Clock, CalendarDays, ChevronRight, Layers } from 'lucide-react'
import './Bem-vindo.css'

// ── Helpers ──────────────────────────────────────────────────────────────────

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
]

function hoje() {
  return new Date()
}

function saudacao(nome) {
  const h = new Date().getHours()
  const primeiro = nome?.split(' ')[0] ?? ''
  if (h < 12) return `Bom dia, ${primeiro}!`
  if (h < 18) return `Boa tarde, ${primeiro}!`
  return `Boa noite, ${primo}!`
}

// Gera os dias do mês atual para o mini-calendário
function diasDoMes(ano, mes) {
  const primeiro = new Date(ano, mes, 1).getDay()
  const total    = new Date(ano, mes + 1, 0).getDate()
  const cells    = []
  for (let i = 0; i < primeiro; i++) cells.push(null)
  for (let d = 1; d <= total; d++) cells.push(d)
  return cells
}

// ── Sub-componente: Mini Calendário ──────────────────────────────────────────

function MiniCalendario({ eventos = [] }) {
  const agora    = hoje()
  const [ano,  setAno]  = useState(agora.getFullYear())
  const [mes,  setMes]  = useState(agora.getMonth())
  const diaHoje = agora.getDate()
  const mesHoje = agora.getMonth()
  const anoHoje = agora.getFullYear()

  const dias = diasDoMes(ano, mes)

  // dias com evento no mês atual
  const diasComEvento = new Set(
    eventos
      .filter(e => {
        const d = new Date(e.data)
        return d.getFullYear() === ano && d.getMonth() === mes
      })
      .map(e => new Date(e.data).getDate())
  )

  const navMes = (dir) => {
    setMes(m => {
      const nm = m + dir
      if (nm < 0)  { setAno(a => a - 1); return 11 }
      if (nm > 11) { setAno(a => a + 1); return 0  }
      return nm
    })
  }

  return (
    <div className='bv-calendario'>
      <div className='bv-cal-header'>
        <span className='bv-cal-titulo'>{MESES[mes]} {ano}</span>
      </div>

      <div className='bv-cal-grid-header'>
        {DIAS_SEMANA.map(d => <span key={d}>{d}</span>)}
      </div>

      <div className='bv-cal-grid'>
        {dias.map((dia, i) => {
          if (!dia) return <span key={`v-${i}`} />
          const isHoje   = dia === diaHoje && mes === mesHoje && ano === anoHoje
          const temEvento = diasComEvento.has(dia)
          return (
            <span
              key={dia}
              className={`bv-cal-dia ${isHoje ? 'hoje' : ''} ${temEvento ? 'tem-evento' : ''}`}
            >
              {dia}
              {temEvento && <span className='bv-cal-dot' />}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Sub-componente: Card de Cronograma ───────────────────────────────────────

const CORES_TURMA = ['#7C3FBD', '#2E7D9C', '#C05621', '#2D6A4F', '#9B2335']

function CardCronograma({ item, index, onClick }) {
  const cor = CORES_TURMA[index % CORES_TURMA.length]
  return (
    <motion.div
      className='bv-card-crono'
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      onClick={onClick}
      style={{ '--acento': cor }}
    >
      <div className='bv-crono-faixa' />
      <div className='bv-crono-body'>
        <p className='bv-crono-turma'>{item.turma ?? 'Turma'}</p>
        <p className='bv-crono-disciplina'>{item.disciplina ?? item.nome ?? '—'}</p>
        <div className='bv-crono-meta'>
          <Clock size={12} />
          <span>{item.horario ?? 'Horário não definido'}</span>
        </div>
      </div>
      <ChevronRight size={15} className='bv-crono-seta' />
    </motion.div>
  )
}

// ── Sub-componente: Próximos Eventos ─────────────────────────────────────────

function ProximosEventos({ eventos = [] }) {
  const agora   = hoje()
  const proximos = eventos
    .filter(e => new Date(e.data) >= agora)
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .slice(0, 4)

  if (!proximos.length) {
    return <p className='bv-vazio'>Nenhum evento próximo.</p>
  }

  return (
    <ul className='bv-eventos-lista'>
      {proximos.map((ev, i) => {
        const d   = new Date(ev.data)
        const dia = String(d.getDate()).padStart(2, '0')
        const mes = MESES[d.getMonth()].slice(0, 3)
        return (
          <motion.li
            key={i}
            className='bv-evento-item'
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div className='bv-evento-data'>
              <span className='bv-evento-dia'>{dia}</span>
              <span className='bv-evento-mes'>{mes}</span>
            </div>
            <div className='bv-evento-info'>
              <p className='bv-evento-titulo'>{ev.titulo ?? ev.nome ?? 'Evento'}</p>
              {ev.descricao && <p className='bv-evento-desc'>{ev.descricao}</p>}
            </div>
          </motion.li>
        )
      })}
    </ul>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

/**
 * @param {object}   professor  – dados do perfil (nome, role, …)
 * @param {string}   uid
 * @param {array}    cronogramas – lista de cronogramas do professor
 * @param {array}    eventos     – lista de eventos do calendário
 * @param {function} onIrCronogramas – callback para navegar até a seção Cronogramas
 * @param {function} onIrCalendario  – callback para navegar até a seção Calendário
 */
export default function Bemvindo({
  professor,
  uid,
  cronogramas = [],
  eventos     = [],
  onIrCronogramas,
  onIrCalendario,
}) {
  const eCoordenador = professor?.role === 'coordenador'
  const nome = professor?.nome ?? ''

  return (
    <div className='bv-wrapper'>

      {/* ── Cabeçalho de boas-vindas ── */}
      <motion.div
        className='bv-header'
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className='bv-header-texto'>
          <h1 className='bv-saudacao'>
            {saudacao(nome)}
          </h1>
          <p className='bv-subtitulo'>
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
        </div>

        {/* Chips de resumo */}
        <div className='bv-chips'>
          <div className='bv-chip'>
            <Layers size={14} />
            <span>{cronogramas.length} cronograma{cronogramas.length !== 1 ? 's' : ''}</span>
          </div>
          <div className='bv-chip'>
            <CalendarDays size={14} />
            <span>
              {eventos.filter(e => new Date(e.data) >= hoje()).length} evento{
                eventos.filter(e => new Date(e.data) >= hoje()).length !== 1 ? 's' : ''
              } próximo{eventos.filter(e => new Date(e.data) >= hoje()).length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Corpo ── */}
      <div className='bv-corpo'>

        {/* Coluna esquerda: cronogramas */}
        <section className='bv-secao'>
          <div className='bv-secao-header'>
            <div className='bv-secao-titulo'>
              <BookOpen size={15} />
              <h2>Meus cronogramas</h2>
            </div>
            <button className='bv-link' onClick={onIrCronogramas}>
              Ver todos <ChevronRight size={13} />
            </button>
          </div>

          {cronogramas.length === 0 ? (
            <p className='bv-vazio'>Nenhum cronograma encontrado.</p>
          ) : (
            <div className='bv-crono-lista'>
              {cronogramas.slice(0, 5).map((c, i) => (
                <CardCronograma
                  key={c.id ?? i}
                  item={c}
                  index={i}
                  onClick={onIrCronogramas}
                />
              ))}
            </div>
          )}
        </section>

        {/* Coluna direita: calendário + próximos eventos */}
        <aside className='bv-aside'>

          {/* Mini calendário */}
          <div className='bv-card-aside'>
            <div className='bv-secao-header'>
              <div className='bv-secao-titulo'>
                <CalendarDays size={15} />
                <h2>Calendário</h2>
              </div>
            </div>
            <MiniCalendario eventos={eventos} />
          </div>

        </aside>
      </div>
    </div>
  )
}