// src/registro/Registro.jsx

import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { Link, useNavigate } from 'react-router'
import './registro.css'

function Registro() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmarSenha: '' })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErro('')
  }

  async function handleRegistrar(e) {
    e?.preventDefault()
    if (!form.nome || !form.email || !form.senha || !form.confirmarSenha) {
      setErro('Preencha todos os campos.'); return
    }
    if (form.senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.'); return
    }
    if (form.senha !== form.confirmarSenha) {
      setErro('As senhas não coincidem.'); return
    }
    setCarregando(true)
    try {
      const credencial = await createUserWithEmailAndPassword(auth, form.email, form.senha)
      await setDoc(doc(db, 'users', credencial.user.uid), {
        nome: form.nome,
        nomeUsuario: '',
        instituicao: '',
        modalidade: 'Presencial',
        email: form.email.toLowerCase(),
        role: 'professor',
        criadoEm: serverTimestamp(),
      })
      navigate('/dashboard')
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') setErro('Este e-mail já está cadastrado.')
      else if (error.code === 'auth/invalid-email') setErro('E-mail inválido.')
      else if (error.code === 'auth/weak-password') setErro('Senha fraca. Use pelo menos 6 caracteres.')
      else setErro('Erro ao criar conta. Tente novamente.')
    }
    setCarregando(false)
  }

  return (
    <div className='pagina-registro' onKeyDown={e => e.key === 'Enter' && handleRegistrar()}>
      <div className='registro-card'>

        <div className='registro-topo'>
          <h1 className='registro-titulo'>Criar conta</h1>
          <p className='registro-subtitulo'>
            Já tem conta?{' '}
            <Link to='/login' className='registro-link'>Entrar</Link>
          </p>
        </div>

        <div className='registro-campos'>
          <div className='registro-grupo'>
            <label className='registro-label'>Nome completo</label>
            <input className='registro-input' type='text' name='nome'
              placeholder='Digite seu nome completo' value={form.nome} onChange={handleChange} />
          </div>
          <div className='registro-grupo'>
            <label className='registro-label'>E-mail</label>
            <input className='registro-input' type='email' name='email'
              placeholder='Digite seu e-mail' value={form.email} onChange={handleChange} />
          </div>
          <div className='registro-grupo'>
            <label className='registro-label'>Senha</label>
            <input className='registro-input' type='password' name='senha'
              placeholder='Mínimo 6 caracteres' value={form.senha} onChange={handleChange} />
          </div>
          <div className='registro-grupo'>
            <label className='registro-label'>Confirmar senha</label>
            <input className='registro-input' type='password' name='confirmarSenha'
              placeholder='Repita a senha' value={form.confirmarSenha} onChange={handleChange} />
          </div>
        </div>

        {erro && <p className='registro-erro'>{erro}</p>}

        <button className='registro-btn' onClick={handleRegistrar} disabled={carregando}>
          {carregando ? 'Criando conta...' : 'Criar conta'}
        </button>

        <p className='registro-info'>
          Ao criar sua conta, você entra como <strong>professor</strong>.
          O coordenador pode alterar seu papel depois.
        </p>
      </div>
    </div>
  )
}

export default Registro