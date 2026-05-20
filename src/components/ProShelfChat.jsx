import { useState, useRef, useEffect } from 'react'
import { useProfessorIA } from '../hooks/useProfessoria'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`

const DIAS_SEMANA = {
  DOM: 'Domingo', SEG: 'Segunda', TER: 'Terça',
  QUA: 'Quarta',  QUI: 'Quinta',  SEX: 'Sexta', SAB: 'Sábado'
}

// ─────────────────────────────────────────────────────────
//  Monta o system prompt com dados reais do professor
// ─────────────────────────────────────────────────────────
function montarSystemPrompt(ctx) {
  if (!ctx) return 'Você é o assistente do ProShelf. Responda em português.'

  const primeiroNome = ctx.nome.split(' ')[0]

  const turmasTexto = ctx.turmas.length > 0
    ? ctx.turmas.map(t =>
        `  - ${t.disciplina}: ${t.nome} (${t.periodo || 'sem período'})`
      ).join('\n')
    : '  Nenhuma turma cadastrada ainda.'

  const cronoTexto = ctx.cronograma.length > 0
    ? ['SEG','TER','QUA','QUI','SEX','SAB','DOM']
        .map(dia => {
          const aulas = ctx.cronograma
            .filter(a => a.dia === dia)
            .sort((a, b) => a.ordem - b.ordem)
          if (aulas.length === 0) return null
          const linhas = aulas.map(a =>
            `    ${a.ordem}ª aula: ${a.disciplina} — ${a.turma}${a.sala ? ` (Sala ${a.sala})` : ''} — ${a.periodo}`
          ).join('\n')
          return `  ${DIAS_SEMANA[dia]}:\n${linhas}`
        })
        .filter(Boolean)
        .join('\n')
    : '  Nenhum horário cadastrado ainda.'

  const diaHoje = ['DOM','SEG','TER','QUA','QUI','SEX','SAB'][new Date().getDay()]
  const aulasHoje = ctx.cronograma
    .filter(a => a.dia === diaHoje)
    .sort((a, b) => a.ordem - b.ordem)

  const hojeTexto = aulasHoje.length > 0
    ? aulasHoje.map(a => `${a.ordem}ª aula: ${a.disciplina} — ${a.turma}`).join(', ')
    : 'Sem aulas hoje.'

  return `Você é o assistente inteligente do ProShelf, uma plataforma escolar para professores.

## Quem você está atendendo
- Nome: ${ctx.nome}
- Instituição: ${ctx.instituicao || 'não informada'}
- Modalidade: ${ctx.modalidade}
- Papel: ${ctx.role === 'coordenador' ? 'Coordenador' : 'Professor'}
- Chame sempre pelo primeiro nome: ${primeiroNome}

## Turmas do professor
${turmasTexto}

## Cronograma semanal (${ctx.fonteCronograma === 'coordenador' ? 'enviado pelo coordenador' : 'cadastrado manualmente'})
${cronoTexto}

## Hoje (${DIAS_SEMANA[diaHoje]})
${hojeTexto}

## Sobre o ProShelf — navegação
- Menu superior: Cronogramas | Turmas | Arquivos | Calendário
- Cronogramas: visualiza o horário semanal por dia. Botão "+ Nova aula" para adicionar manualmente
- Turmas: lista turmas por disciplina. Clicando em uma turma, vê os registros de aula
- Arquivos: repositório de materiais. Botão "+" para fazer upload (PDF ou imagem, máx 5MB)
- Calendário: eventos mensais. Botão "+ Novo evento" para adicionar
- Ícone de usuário (canto superior direito): Editar perfil, Configurações, Sair

${ctx.role === 'coordenador' ? `## Funções exclusivas do coordenador
- Upload Horário: enviar PDF do horário geral para a IA extrair automaticamente
- Professores: vincular e-mail dos professores ao nome no PDF
- Usuários: promover professores a coordenadores ou rebaixar` : ''}

## Suas regras
- Responda SEMPRE em português brasileiro
- Seja direto, amigável e breve (máximo 3 frases por resposta)
- Use os dados reais acima para personalizar cada resposta
- Se perguntarem sobre o cronograma, use os dados reais
- Se perguntarem sobre navegação, explique o caminho exato
- Não invente funcionalidades que não existem
- Não responda perguntas fora do contexto do ProShelf ou da vida escolar`
}

// ─────────────────────────────────────────────────────────
//  Chama a API do Gemini
// ─────────────────────────────────────────────────────────
async function chamarGemini(systemPrompt, historico) {
  // Converte o histórico para o formato do Gemini
  const contents = historico.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }))

  const body = {
    // System prompt vai como "system_instruction" no Gemini
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
    },
  }

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || `Erro ${res.status}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Não entendi, pode repetir?'
}

// ─────────────────────────────────────────────────────────
//  Chips de sugestão dinâmicos
// ─────────────────────────────────────────────────────────
function chipsParaContexto(ctx) {
  if (!ctx) return ['Como funciona o ProShelf?']
  const chips = ['Quais são minhas aulas hoje?']
  if (ctx.turmas.length > 0) chips.push('Mostre minhas turmas')
  else chips.push('Como adiciono uma turma?')
  if (ctx.cronograma.length > 0) chips.push('Meu cronograma da semana')
  else chips.push('Como adiciono aulas no cronograma?')
  chips.push('Como faço upload de arquivo?')
  return chips
}

// ─────────────────────────────────────────────────────────
//  Componente principal
// ─────────────────────────────────────────────────────────
export default function ProShelfChat() {
  const { contexto, loading: loadingCtx } = useProfessorIA()

  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState(null)
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const messagesEndRef          = useRef(null)
  const inputRef                = useRef(null)

  // Mensagem de boas-vindas personalizada
  useEffect(() => {
    if (!loadingCtx && contexto && messages === null) {
      const nome = contexto.nome.split(' ')[0]
      const diaHoje = ['DOM','SEG','TER','QUA','QUI','SEX','SAB'][new Date().getDay()]
      const aulasHoje = contexto.cronograma.filter(a => a.dia === diaHoje)

      let boasVindas = `Olá, Prof. ${nome}! 👋 Sou o assistente do ProShelf.`
      if (aulasHoje.length > 0) {
        boasVindas += ` Você tem ${aulasHoje.length} aula${aulasHoje.length > 1 ? 's' : ''} hoje.`
      }
      boasVindas += ' Como posso te ajudar?'

      setMessages([{ role: 'assistant', content: boasVindas }])
    }
  }, [loadingCtx, contexto, messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    if (open && !loadingCtx) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, loadingCtx])

  async function sendMessage(texto) {
    const userText = texto || input.trim()
    if (!userText || loading || !messages) return

    setInput('')
    const newMessages = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setLoading(true)

    try {
      if (!GEMINI_API_KEY) {
        throw new Error('Chave da API não configurada. Adicione VITE_GEMINI_API_KEY no arquivo .env')
      }

      const systemPrompt = montarSystemPrompt(contexto)
      const reply = await chamarGemini(systemPrompt, newMessages)
      setMessages([...newMessages, { role: 'assistant', content: reply }])

    } catch (err) {
      setMessages([...newMessages, {
        role: 'assistant',
        content: `Erro: ${err.message}`,
      }])
    }

    setLoading(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const msgList = messages || []
  const chips = chipsParaContexto(contexto)

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label='Abrir assistente ProShelf'
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 54, height: 54, borderRadius: '50%',
          background: '#6F3B9D', border: 'none',
          cursor: 'pointer', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 18px rgba(111,59,157,0.4)',
          transition: 'background 0.2s', fontSize: 22,
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#5a2f85'}
        onMouseLeave={e => e.currentTarget.style.background = '#6F3B9D'}
      >✨</button>

      {/* Janela do chat */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 86, right: 24,
          width: 340, height: 500,
          background: '#fff', border: '1px solid #e8e8e8',
          borderRadius: 16, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', zIndex: 1000,
          boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
          fontFamily: "'Poppins', sans-serif",
        }}>

          {/* Header */}
          <div style={{ background: '#6F3B9D', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, flexShrink: 0,
            }}>✨</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, color: '#fff', fontSize: 13, fontWeight: 600 }}>
                Assistente ProShelf
              </p>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                {loadingCtx ? 'Carregando seus dados...' : contexto ? `Olá, ${contexto.nome.split(' ')[0]}!` : 'Online'}
              </span>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontSize: 20 }}>
              ✕
            </button>
          </div>

          {/* Mensagens */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

            {loadingCtx && (
              <p style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: 20 }}>
                Buscando seus dados...
              </p>
            )}

            {msgList.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-end', gap: 7,
              }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: '#EDE0F7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, flexShrink: 0,
                  }}>✨</div>
                )}
                <div style={{
                  maxWidth: '76%', padding: '9px 12px', borderRadius: 14,
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 14,
                  borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 14,
                  fontSize: 13, lineHeight: 1.55,
                  background: msg.role === 'user' ? '#6F3B9D' : '#F4F0F9',
                  color: msg.role === 'user' ? '#fff' : '#1a1a1a',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Chips */}
            {msgList.length === 1 && !loadingCtx && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 35, marginTop: 2 }}>
                {chips.map(chip => (
                  <button key={chip} onClick={() => sendMessage(chip)}
                    style={{
                      fontSize: 11, padding: '5px 10px',
                      border: '1px solid #6F3B9D', borderRadius: 20,
                      color: '#6F3B9D', background: 'transparent',
                      cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#6F3B9D'; e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6F3B9D' }}
                  >{chip}</button>
                ))}
              </div>
            )}

            {/* Digitando */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EDE0F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✨</div>
                <div style={{ background: '#F4F0F9', padding: '10px 14px', borderRadius: 14, borderBottomLeftRadius: 4, display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0, 0.2, 0.4].map((delay, j) => (
                    <span key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: '#aaa', display: 'inline-block', animation: `psf-bounce 1.2s ${delay}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #efefef', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              rows={1} value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
              }}
              onKeyDown={handleKey}
              placeholder={loadingCtx ? 'Carregando...' : 'Digite sua pergunta...'}
              disabled={loadingCtx}
              style={{
                flex: 1, resize: 'none', border: '1px solid #ddd', borderRadius: 10,
                padding: '8px 10px', fontSize: 13, fontFamily: "'Poppins', sans-serif",
                outline: 'none', maxHeight: 80, lineHeight: 1.4,
              }}
              onFocus={e => e.target.style.borderColor = '#6F3B9D'}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim() || loadingCtx}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: loading || !input.trim() || loadingCtx ? '#ccc' : '#6F3B9D',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 16, color: 'white',
              }}
            >→</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes psf-bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  )
}