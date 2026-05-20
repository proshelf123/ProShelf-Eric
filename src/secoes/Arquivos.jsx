// src/secoes/Arquivos.jsx

import { useState, useEffect } from 'react'
import { buscarArquivos, salvarArquivo, toggleFixarArquivo, deletarArquivo } from '../firebase/estrutura'
import { storage } from '../firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import './secoes.css'

export default function Arquivos({ uid }) {
  const [arquivos, setArquivos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!uid) return
    carregar()
  }, [uid])

  async function carregar() {
    const dados = await buscarArquivos(uid)
    setArquivos(dados)
    setLoading(false)
  }

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)

    try {
      const storageRef = ref(storage, `arquivos/${uid}/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)

      await salvarArquivo(uid, {
        nome: file.name.replace(/\.[^/.]+$/, ''),
        url,
        tipo: file.type.includes('pdf') ? 'pdf' : 'imagem',
        fixado: false,
      })
      await carregar()
    } catch (err) {
      console.error('Erro no upload:', err)
    }
    setUploading(false)
    e.target.value = ''
  }

  async function handleFixar(id, fixadoAtual) {
    await toggleFixarArquivo(uid, id, !fixadoAtual)
    setArquivos(prev => prev.map(a => a.id === id ? { ...a, fixado: !fixadoAtual } : a))
  }

  async function handleDeletar(id) {
    if (!confirm('Deseja remover este arquivo?')) return
    await deletarArquivo(uid, id)
    setArquivos(prev => prev.filter(a => a.id !== id))
  }

  const fixados = arquivos.filter(a => a.fixado)
  const normais = arquivos.filter(a => !a.fixado)

  return (
    <div className='card'>
      <div className='card-titulo'>📁 Arquivos</div>

      {loading ? (
        <p className='secao-vazia'>Carregando...</p>
      ) : (
        <>
          {/* Fixados */}
          {fixados.length > 0 && (
            <>
              <div className='sec-titulo'>Arquivos fixados</div>
              {fixados.map(a => (
                <div key={a.id} className='arquivo-fixado'>
                  <span>📌</span>
                  <a href={a.url} target='_blank' rel='noreferrer' className='arquivo-nome-fixado'>
                    {a.nome}
                  </a>
                  <button className='arquivo-acao' onClick={() => handleFixar(a.id, true)} title='Desafixar'>📌</button>
                  <button className='arquivo-acao' onClick={() => handleDeletar(a.id)} title='Remover'>🗑️</button>
                </div>
              ))}
            </>
          )}

          {/* Meus arquivos */}
          <div className='sec-titulo'>Meus arquivos</div>
          {normais.length === 0 ? (
            <p className='secao-vazia'>Nenhum arquivo ainda.</p>
          ) : (
            normais.map(a => (
              <div key={a.id} className='arquivo-normal'>
                <span>{a.tipo === 'pdf' ? '📄' : '🖼️'}</span>
                <a href={a.url} target='_blank' rel='noreferrer' className='arquivo-nome'>
                  {a.nome}
                </a>
                <button className='arquivo-acao' onClick={() => handleFixar(a.id, false)} title='Fixar'>📌</button>
                <button className='arquivo-acao' onClick={() => handleDeletar(a.id)} title='Remover'>🗑️</button>
              </div>
            ))
          )}

          {/* Upload */}
          <label className='btn-upload'>
            {uploading ? 'Enviando...' : '+ Adicionar arquivo'}
            <input type='file' accept='.pdf,image/*' onChange={handleUpload} disabled={uploading} hidden />
          </label>
        </>
      )}
    </div>
  )
}