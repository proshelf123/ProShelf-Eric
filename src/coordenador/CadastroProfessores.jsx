// src/coordenador/CadastroProfessores.jsx
//
// Tela exclusiva do coordenador para cadastrar professores,
// vinculando o e-mail ao nome exato que aparece no PDF do horário.
//
// Estrutura no Firestore:
//   professores_escola/{email_sanitizado}
//     ├── email: "getulio@escola.com"
//     ├── nomePDF: "GETULIO"       ← nome exato do PDF (MAIÚSCULAS)
//     └── criadoEm: timestamp

import { useState, useEffect } from 'react'
import { collection, getDocs, setDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import './coordenador.css'

// Sanitiza e-mail para usar como ID de documento no Firestore
// (Firestore não aceita "." e "@" em IDs)
function sanitizarEmail(email) {
  return email.toLowerCase().replace(/[@.]/g, '_')
}

export default function CadastroProfessores() {
  const [professores, setProfessores] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ email: '', nomePDF: '' })
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregarProfessores()
  }, [])

  async function carregarProfessores() {
    const snap = await getDocs(collection(db, 'professores_escola'))
    setProfessores(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  async function handleSalvar() {
    if (!form.email || !form.nomePDF) {
      setErro('Preencha o e-mail e o nome no PDF.')
      return
    }
    if (!form.email.includes('@')) {
      setErro('Digite um e-mail válido.')
      return
    }

    setSalvando(true)
    setErro('')

    try {
      const id = sanitizarEmail(form.email)
      await setDoc(doc(db, 'professores_escola', id), {
        email: form.email.toLowerCase(),
        nomePDF: form.nomePDF.toUpperCase().trim(),
        criadoEm: serverTimestamp(),
      })
      setForm({ email: '', nomePDF: '' })
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2500)
      await carregarProfessores()
    } catch (err) {
      setErro('Erro ao salvar: ' + err.message)
    }

    setSalvando(false)
  }

  async function handleDeletar(id) {
    if (!confirm('Remover este professor?')) return
    await deleteDoc(doc(db, 'professores_escola', id))
    setProfessores(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className='upload-container' style={{ maxWidth: 620 }}>
      <div className='upload-header'>
        <span className='upload-badge'>Coordenador</span>
        <h2 className='upload-titulo'>Cadastro de Professores</h2>
        <p className='upload-desc'>
          Vincule o e-mail de login de cada professor ao nome que aparece
          no PDF do horário. O nome deve estar em MAIÚSCULAS, exatamente como no PDF.
        </p>
      </div>

      {/* Formulário */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        <div className='perfil-grupo'>
          <label className='perfil-label'>E-mail do professor</label>
          <input
            className='perfil-input'
            type='email'
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder='professor@escola.com'
          />
        </div>

        <div className='perfil-grupo'>
          <label className='perfil-label'>Nome no PDF (exatamente como aparece)</label>
          <input
            className='perfil-input'
            value={form.nomePDF}
            onChange={e => setForm({ ...form, nomePDF: e.target.value.toUpperCase() })}
            placeholder='Ex: GETULIO, MARIA JOSÉ, ADILSON'
            style={{ textTransform: 'uppercase' }}
          />
          <span style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
            💡 Abra o PDF do horário e copie o nome exatamente como aparece
          </span>
        </div>

        {erro && (
          <div className='upload-erro'>{erro}</div>
        )}

        <button
          className={`upload-btn ${salvo ? 'salvo' : ''}`}
          onClick={handleSalvar}
          disabled={salvando}
          style={{ background: salvo ? '#1D9E75' : undefined }}
        >
          {salvando ? 'Salvando...' : salvo ? '✓ Professor cadastrado!' : 'Cadastrar professor'}
        </button>
      </div>

      {/* Lista de professores cadastrados */}
      <div>
        <div className='sec-titulo' style={{ fontFamily: 'Poppins, sans-serif' }}>
          Professores cadastrados ({professores.length})
        </div>

        {loading ? (
          <p style={{ fontSize: 13, color: '#999', fontFamily: 'Poppins, sans-serif' }}>
            Carregando...
          </p>
        ) : professores.length === 0 ? (
          <p style={{ fontSize: 13, color: '#999', fontFamily: 'Poppins, sans-serif', padding: '16px 0' }}>
            Nenhum professor cadastrado ainda.
          </p>
        ) : (
          professores.map(p => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8,
              background: '#f8f7fc', marginBottom: 6,
              fontFamily: 'Poppins, sans-serif',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>
                  {p.nomePDF}
                </div>
                <div style={{ fontSize: 11, color: '#888' }}>{p.email}</div>
              </div>
              <button
                onClick={() => handleDeletar(p.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 16, opacity: 0.4, transition: 'opacity .15s',
                  padding: '2px 6px',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
                title='Remover'
              >🗑️</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}