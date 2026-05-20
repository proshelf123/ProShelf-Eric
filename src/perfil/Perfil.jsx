// src/perfil/Perfil.jsx

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buscarPerfil, salvarPerfil } from '../firebase/estrutura'
import { auth } from '../firebase'
import './perfil.css'

const MODALIDADES = ['Presencial', 'Híbrido', 'EAD']

export default function Perfil({ uid, onFechar }) {
  const [form, setForm] = useState({
    nome: '',
    nomeUsuario: '',
    rp: '',
    instituicao: '',
    email: '',
    modalidade: 'Presencial',
  })
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!uid) return
    buscarPerfil(uid).then(dados => {
      if (dados) setForm({
        nome:        dados.nome        || '',
        nomeUsuario: dados.nomeUsuario || '',
        rp:          dados.rp          || '',
        instituicao: dados.instituicao || '',
        email:       dados.email       || auth.currentUser?.email || '',
        modalidade:  dados.modalidade  || 'Presencial',
      })
    })
  }, [uid])

  const inicial = form.nome?.charAt(0).toUpperCase() || '?'

  async function handleSalvar() {
    if (!form.nome.trim()) { setErro('Informe seu nome.'); return }
    setSalvando(true)
    setErro('')
    try {
      await salvarPerfil(uid, form)
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2000)
      onFechar()
    } catch {
      setErro('Erro ao salvar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <motion.div
      className='perfil-overlay'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onFechar}
    >
      <motion.div
        className='perfil-modal'
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className='perfil-header'>
          <div className='perfil-avatar'>{inicial}</div>
          <div>
            <h2 className='perfil-titulo'>Editar perfil</h2>
            <p className='perfil-subtitulo'>
              {form.nome ? `Prof. ${form.nome.split(' ')[0]}` : 'Preencha seus dados'}
            </p>
          </div>
          <button className='perfil-fechar' onClick={onFechar} aria-label='Fechar'>✕</button>
        </div>

        {/* Formulário */}
        <div className='perfil-form'>
          <div className='perfil-linha-2'>
            <div className='perfil-grupo'>
              <label className='perfil-label'>Nome completo *</label>
              <input
                className='perfil-input'
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
                placeholder='Ex: Maria da Silva'
              />
            </div>
            <div className='perfil-grupo'>
              <label className='perfil-label'>Nome de usuário</label>
              <input
                className='perfil-input'
                value={form.nomeUsuario}
                onChange={e => setForm({ ...form, nomeUsuario: e.target.value })}
                placeholder='Ex: maria.silva'
              />
            </div>
          </div>

          <div className='perfil-linha-2'>
            <div className='perfil-grupo'>
              <label className='perfil-label'>RP</label>
              <input
                className='perfil-input'
                value={form.rp}
                onChange={e => setForm({ ...form, rp: e.target.value })}
                placeholder='Registro do professor'
              />
            </div>
            <div className='perfil-grupo'>
              <label className='perfil-label'>Modalidade</label>
              <select
                className='perfil-input'
                value={form.modalidade}
                onChange={e => setForm({ ...form, modalidade: e.target.value })}
              >
                {MODALIDADES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className='perfil-grupo'>
            <label className='perfil-label'>Instituição</label>
            <input
              className='perfil-input'
              value={form.instituicao}
              onChange={e => setForm({ ...form, instituicao: e.target.value })}
              placeholder='Nome da escola ou faculdade'
            />
          </div>

          <div className='perfil-grupo'>
            <label className='perfil-label'>E-mail</label>
            <input
              className='perfil-input perfil-input-disabled'
              value={form.email}
              readOnly
              tabIndex={-1}
            />
          </div>

          {erro && <p className='perfil-erro'>{erro}</p>}
        </div>

        {/* Rodapé */}
        <div className='perfil-rodape'>
          <button className='perfil-cancelar' onClick={onFechar}>Cancelar</button>
          <button className='perfil-salvar' onClick={handleSalvar} disabled={salvando}>
            {salvando ? 'Salvando...' : salvo ? '✓ Salvo!' : 'Salvar perfil'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}