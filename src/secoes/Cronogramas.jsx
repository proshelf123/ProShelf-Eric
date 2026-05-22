// src/secoes/Cronogramas.jsx
//
// Busca o cronograma do professor logado em 2 passos:
// 1. Lê professores_escola/{emailSanitizado} para descobrir o nomePDF
// 2. Lê cronogramas_escola/{nomePDF}/aulas para pegar as aulas

import { useState, useEffect } from 'react'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import '../dashboard/dashboard.css'
import './secoes.css'

const DIAS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']

const NOMES_DISCIPLINA = {
  MAT: 'Matemática', FIS: 'Física', QUI: 'Química',
  BIO: 'Biologia', PORT: 'Português', ING: 'Inglês',
  HIS: 'História', GEO: 'Geografia', FIL: 'Filosofia',
  SOCI: 'Sociologia', ARTE: 'Arte',
  'ED. FIS': 'Ed. Física', 'ED.FIS': 'Ed. Física',
}

const COR_DISCIPLINA = {
  'Matemática':  { bg: '#fce4ec', cor: '#880e4f' },
  'Física':      { bg: '#e3f2fd', cor: '#0d47a1' },
  'Química':     { bg: '#e8f5e9', cor: '#1b5e20' },
  'Biologia':    { bg: '#f3e5f5', cor: '#4a148c' },
  'Português':   { bg: '#fff3e0', cor: '#e65100' },
  'Inglês':      { bg: '#e0f7fa', cor: '#006064' },
  'História':    { bg: '#fbe9e7', cor: '#bf360c' },
  'Geografia':   { bg: '#e8eaf6', cor: '#1a237e' },
  'Filosofia':   { bg: '#f9fbe7', cor: '#33691e' },
  'Sociologia':  { bg: '#fce4ec', cor: '#880e4f' },
  'Arte':        { bg: '#ede7f6', cor: '#311b92' },
  'Ed. Física':  { bg: '#e1f5fe', cor: '#01579b' },
}

function corDisciplina(disc) {
  if (COR_DISCIPLINA[disc]) return COR_DISCIPLINA[disc]
  const nome = NOMES_DISCIPLINA[disc]
  if (nome && COR_DISCIPLINA[nome]) return COR_DISCIPLINA[nome]
  return { bg: '#f3f0f9', cor: '#6F3B9D' }
}

// Sanitiza o e-mail igual ao CadastroProfessores.jsx
function sanitizarEmail(email) {
  return email.toLowerCase().replace(/[@.]/g, '_')
}

export default function Cronogramas({ uid, professor }) {
  const [diaAtivo, setDiaAtivo] = useState(() => {
    const dias = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']
    return dias[new Date().getDay()]
  })
  const [cronograma, setCronograma] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('') // mensagem de status para o professor

  useEffect(() => {
    if (!professor?.email) return
    carregarCronograma(professor.email)
  }, [professor])

  async function carregarCronograma(email) {
    setLoading(true)
    setStatus('')

    try {
      // Passo 1: busca o nomePDF pelo e-mail
      const emailId = sanitizarEmail(email)
      const vinculoSnap = await getDoc(doc(db, 'professores_escola', emailId))

      if (!vinculoSnap.exists()) {
        setStatus('Seu e-mail ainda não foi vinculado ao horário. Aguarde o coordenador cadastrá-lo.')
        setLoading(false)
        return
      }

      const nomePDF = vinculoSnap.data().nomePDF

      // Passo 2: busca as aulas pelo nomePDF
      const aulasSnap = await getDocs(
        collection(db, 'cronogramas_escola', nomePDF, 'aulas')
      )

      if (aulasSnap.empty) {
        setStatus('Nenhum horário encontrado. Aguarde o coordenador fazer o upload do PDF.')
        setLoading(false)
        return
      }

      setCronograma(aulasSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error('Erro ao buscar cronograma:', err)
      setStatus('Erro ao carregar o cronograma. Tente novamente.')
    }

    setLoading(false)
  }

  const primeiroNome = professor?.nome?.split(' ')[0] || 'Professor'
  const inicial = professor?.nome?.charAt(0).toUpperCase() || 'P'

  const aulasDoDia = cronograma
    .filter(a => a.dia === diaAtivo)
    .sort((a, b) => a.ordem - b.ordem)

  return (
    <>
      {/* Cronograma */}
      <div className='card'>
        <div className='card-titulo'> Cronograma semanal</div>

        {loading ? (
          <p className='secao-vazia'>Carregando seu horário...</p>
        ) : status ? (
          <div className='secao-vazia' style={{ padding: '28px 0' }}>
            <p>{status}</p>
          </div>
        ) : (
          <>
            <div className='dia-seletor'>
              {DIAS.map(dia => (
                <button
                  key={dia}
                  className={`dia-btn ${diaAtivo === dia ? 'ativo' : ''}`}
                  onClick={() => setDiaAtivo(dia)}
                >
                  {dia}
                </button>
              ))}
            </div>

            {aulasDoDia.length === 0 ? (
              <p className='secao-vazia'>Sem aulas neste dia.</p>
            ) : (
              aulasDoDia.map((aula, i) => {
                const { bg, cor } = corDisciplina(aula.disciplina)
                return (
                  <div key={i} className='aula-linha'>
                    <span className='aula-num'>{aula.ordem}ª aula</span>
                    <span className='aula-disc' style={{ background: bg, color: cor }}>
                      {NOMES_DISCIPLINA[aula.disciplina] || aula.disciplina}
                    </span>
                    <span className='aula-turma'>{aula.turma}</span>
                    <span className='aula-sala'>
                      {aula.sala ? `Sala ${aula.sala}` : ''}
                    </span>
                  </div>
                )
              })
            )}
          </>
        )}
      </div>
    </>
  )
}