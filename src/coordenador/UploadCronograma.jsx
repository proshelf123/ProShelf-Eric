// src/coordenador/UploadCronograma.jsx
//
// Tela exclusiva do coordenador para fazer upload do PDF de horários.
// Usa a Claude API para ler o PDF e extrair as aulas de cada professor,
// depois salva tudo no Firestore separado por nome de professor.
//
// Como usar no dashboard.jsx (só para coordenadores):
//   import UploadCronograma from '../coordenador/UploadCronograma'
//   {professor?.role === 'coordenador' && <UploadCronograma />}

import { useState } from 'react'
import { collection, setDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import './coordenador.css'

// ─────────────────────────────────────────────────────────
//  Prompt que instrui o Claude a extrair o cronograma do PDF
// ─────────────────────────────────────────────────────────
const PROMPT_EXTRACAO = `Você recebeu um PDF de horário escolar. Extraia todas as aulas e retorne um JSON válido, sem texto adicional, sem markdown, sem \`\`\`json.

O JSON deve ter este formato exato:
{
  "professores": {
    "NOME DO PROFESSOR": [
      {
        "dia": "SEG",
        "ordem": 1,
        "periodo": "Matutino",
        "disciplina": "NOME DA DISCIPLINA",
        "turma": "NOME DA TURMA",
        "sala": ""
      }
    ]
  }
}

Regras importantes:
- O nome do professor deve ser em MAIÚSCULAS, exatamente como aparece no PDF
- "dia" deve ser: DOM, SEG, TER, QUA, QUI, SEX ou SAB
- "ordem" é a posição da aula no dia (1, 2, 3, 4, 5, 6, 7)
- "periodo" deve ser: Matutino, Vespertino ou Noturno
- "disciplina" é a sigla ou nome da matéria (ex: MAT, FIS, QUI, BIO...)
- "turma" é o nome da turma (ex: 1 RH, 2 MARKETING, 1 ELETRÔNICA...)
- "sala" pode ser vazio se não estiver no PDF
- Inclua TODOS os professores e TODAS as aulas encontradas
- Retorne APENAS o JSON, nada mais`

// Dias e horários para calcular a ordem das aulas
const HORARIOS_MANHA = ['7:00', '7:50', '8:40', '9:50', '10:40', '11:30', '12:20']

export default function UploadCronograma() {
  const [arquivo, setArquivo] = useState(null)
  const [processando, setProcessando] = useState(false)
  const [progresso, setProgresso] = useState('')
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)

  function handleArquivo(e) {
    const file = e.target.files[0]
    if (!file || file.type !== 'application/pdf') {
      setErro('Por favor, selecione um arquivo PDF.')
      return
    }
    setArquivo(file)
    setErro(null)
    setResultado(null)
  }

  async function handleProcessar() {
    if (!arquivo) return
    setProcessando(true)
    setErro(null)
    setResultado(null)

    try {
      // 1. Converte o PDF para base64
      setProgresso('Lendo o PDF...')
      const base64 = await pdfParaBase64(arquivo)

      // 2. Envia para a Claude API
      setProgresso('Claude está lendo o horário...')
      const cronograma = await extrairCronogramaComClaude(base64)

      // 3. Salva no Firestore por professor
      setProgresso('Salvando no Firebase...')
      const total = await salvarNoFirestore(cronograma)

      setResultado({
        professores: Object.keys(cronograma.professores).length,
        aulas: total,
      })
      setProgresso('')
    } catch (err) {
      console.error(err)
      setErro('Erro ao processar: ' + err.message)
      setProgresso('')
    }

    setProcessando(false)
  }

  // Converte arquivo PDF para base64
  function pdfParaBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Usa a Claude API para extrair o cronograma do PDF
  async function extrairCronogramaComClaude(base64) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: PROMPT_EXTRACAO,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.message || 'Erro na Claude API')
    }

    const data = await response.json()
    const texto = data.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    // Remove possíveis ```json ``` que o modelo possa ter incluído
    const limpo = texto.replace(/```json|```/g, '').trim()

    try {
      return JSON.parse(limpo)
    } catch {
      throw new Error('Claude retornou um formato inesperado. Tente novamente.')
    }
  }

  // Salva as aulas de cada professor no Firestore
  // Estrutura: cronogramas_escola/{nomeProfessor}/aulas/{aulaId}
  async function salvarNoFirestore(cronograma) {
    let totalAulas = 0

    for (const [nomeProfessor, aulas] of Object.entries(cronograma.professores)) {
      if (!aulas || aulas.length === 0) continue

      // Salva cada aula como documento separado
      for (let i = 0; i < aulas.length; i++) {
        const aula = aulas[i]
        const aulaId = `${aula.dia}_${aula.ordem}_${aula.periodo}`

        await setDoc(
          doc(db, 'cronogramas_escola', nomeProfessor, 'aulas', aulaId),
          {
            dia: aula.dia || '',
            ordem: aula.ordem || 1,
            periodo: aula.periodo || 'Matutino',
            disciplina: aula.disciplina || '',
            turma: aula.turma || '',
            sala: aula.sala || '',
            atualizadoEm: serverTimestamp(),
          }
        )
        totalAulas++
      }
    }

    return totalAulas
  }

  return (
    <div className='upload-container'>
      <div className='upload-header'>
        <span className='upload-badge'>Coordenador</span>
        <h2 className='upload-titulo'>Upload de Horário</h2>
        <p className='upload-desc'>
          Envie o PDF do horário geral e a IA vai extrair automaticamente
          as aulas de cada professor.
        </p>
      </div>

      {/* Área de upload */}
      <label className={`upload-area ${arquivo ? 'tem-arquivo' : ''}`}>
        <input
          type='file'
          accept='application/pdf'
          onChange={handleArquivo}
          disabled={processando}
          hidden
        />
        {arquivo ? (
          <>
            <span className='upload-icone'>📄</span>
            <span className='upload-nome'>{arquivo.name}</span>
            <span className='upload-tamanho'>
              {(arquivo.size / 1024 / 1024).toFixed(1)} MB
            </span>
          </>
        ) : (
          <>
            <span className='upload-icone'>⬆️</span>
            <span className='upload-texto'>Clique para selecionar o PDF</span>
            <span className='upload-subtexto'>Somente arquivos .pdf</span>
          </>
        )}
      </label>

      {/* Botão processar */}
      <button
        className='upload-btn'
        onClick={handleProcessar}
        disabled={!arquivo || processando}
      >
        {processando ? progresso || 'Processando...' : 'Processar horário com IA'}
      </button>

      {/* Barra de progresso */}
      {processando && (
        <div className='upload-progresso'>
          <div className='upload-progresso-bar' />
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div className='upload-erro'>
          ⚠️ {erro}
        </div>
      )}

      {/* Sucesso */}
      {resultado && (
        <div className='upload-sucesso'>
          <span>✅ Horário salvo com sucesso!</span>
          <div className='upload-stats'>
            <div className='upload-stat'>
              <strong>{resultado.professores}</strong>
              <span>professores</span>
            </div>
            <div className='upload-stat'>
              <strong>{resultado.aulas}</strong>
              <span>aulas salvas</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}