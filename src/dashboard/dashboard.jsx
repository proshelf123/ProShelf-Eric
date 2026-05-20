// src/dashboard/dashboard.jsx

import './dashboard.css'
import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import { buscarPerfil } from '../firebase/estrutura'
import Logo from '../assets/Group 32 (2).png'
import { CircleUserRound, UserRound, Settings, LogOut, Upload, Users } from 'lucide-react'
import Bemvindo from './Bem-vindo'
import Cronogramas from '../secoes/Cronogramas'
import Turmas from '../secoes/Turmas'
import Arquivos from '../secoes/Arquivos'
import Calendario from '../secoes/Calendario'
import Perfil from '../perfil/Perfil'

// ── Importações exclusivas do coordenador ──
import UploadCronograma from '../coordenador/UploadCronograma'
import CadastroProfessores from '../coordenador/CadastroProfessores'

// Seções visíveis para todos os professores
// 'Início' é a tela de boas-vindas — não aparece no nav como botão extra,
// mas é a seção padrão ao abrir o dashboard.
const SECOES_PROFESSOR = ['Início', 'Cronogramas', 'Turmas', 'Arquivos', 'Calendário']

// Seções extras visíveis só para o coordenador
const SECOES_COORDENADOR = ['Upload Horário', 'Professores']

function Dashboard() {
  const navigate = useNavigate()
  const [uid, setUid]               = useState(null)
  const [professor, setProfessor]   = useState(null)
  const [secaoAtiva, setSecaoAtiva] = useState('Início')   // ← começa na tela de boas-vindas
  const [cronogramas, setCronogramas] = useState([])        // passe os dados reais aqui
  const [eventos, setEventos]       = useState([])          // passe os dados reais aqui
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const [perfilAberto, setPerfilAberto]     = useState(false)
  const dropdownRef = useRef(null)

  const eCoordenador = professor?.role === 'coordenador'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { navigate('/login'); return }
      setUid(user.uid)
      const dados = await buscarPerfil(user.uid)
      setProfessor(dados)

      // ── Carregar cronogramas e eventos do professor ──
      // Substitua pelas suas funções reais de busca no Firestore, por ex.:
      // const listaC = await buscarCronogramasProfessor(user.uid)
      // setCronogramas(listaC)
      // const listaE = await buscarEventosCalendario(user.uid)
      // setEventos(listaE)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    function handleClickFora(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  async function handleSair() {
    await signOut(auth)
    navigate('/login')
  }

  function renderSecao() {
    switch (secaoAtiva) {
      case 'Início':
        return (
          <Bemvindo
            professor={professor}
            uid={uid}
            cronogramas={cronogramas}
            eventos={eventos}
            onIrCronogramas={() => setSecaoAtiva('Cronogramas')}
            onIrCalendario={() => setSecaoAtiva('Calendário')}
          />
        )
      case 'Cronogramas':    return <Cronogramas uid={uid} professor={professor} />
      case 'Turmas':         return <Turmas uid={uid} />
      case 'Arquivos':       return <Arquivos uid={uid} />
      case 'Calendário':     return <Calendario uid={uid} />
      // ── Seções exclusivas do coordenador ──
      case 'Upload Horário': return <UploadCronograma />
      case 'Professores':    return <CadastroProfessores />
      default:               return null
    }
  }

  // Seções exibidas na nav (sem 'Início', que é implícito pelo logo/clique)
  const secoesNav = SECOES_PROFESSOR.filter(s => s !== 'Início')

  return (
    <div className='dash-wrapper'>

      {/* ── Header ── */}
      <header className='cabecalho-dashboard'>

        {/* Logo clicável leva de volta para Início */}
        <div
          className='cabecalho-logo'
          style={{ cursor: 'pointer' }}
          onClick={() => setSecaoAtiva('Início')}
          title='Ir para Início'
        >
          <img src={Logo} id='logo' alt='ProShelf' />
        </div>

        <nav>
          <ul className='lista-nav'>
            {/* Seções normais — visíveis para todos */}
            {secoesNav.map(s => (
              <li key={s}>
                <button
                  className={`nav-link ${secaoAtiva === s ? 'ativo' : ''}`}
                  onClick={() => setSecaoAtiva(s)}
                >
                  {s}
                </button>
              </li>
            ))}

            {/* Seções do coordenador — aparecem só se for coordenador */}
            {eCoordenador && (
              <>
                <li className='nav-divisor' />
                {SECOES_COORDENADOR.map(s => (
                  <li key={s}>
                    <button
                      className={`nav-link nav-link-coord ${secaoAtiva === s ? 'ativo' : ''}`}
                      onClick={() => setSecaoAtiva(s)}
                    >
                      {s === 'Upload Horário' && <Upload size={13} />}
                      {s === 'Professores'    && <Users size={13} />}
                      {s}
                    </button>
                  </li>
                ))}
              </>
            )}
          </ul>
        </nav>

        {/* Ícone de usuário + dropdown */}
        <div className='perfil-wrapper' ref={dropdownRef}>
          <button
            className='perfil-btn'
            onClick={() => setDropdownAberto(v => !v)}
            aria-label='Menu do usuário'
          >
            <CircleUserRound size={46} color='#6F3B9D' />
          </button>

          <AnimatePresence>
            {dropdownAberto && (
              <motion.div
                className='dropdown'
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {professor?.nome && (
                  <div className='dropdown-nome'>
                    {eCoordenador ? ' ' : ''} Prof. {professor.nome.split(' ')[0]}
                  </div>
                )}
                <button
                  className='dropdown-item'
                  onClick={() => { setPerfilAberto(true); setDropdownAberto(false) }}
                >
                  <UserRound size={15} /> Editar perfil
                </button>
                <button className='dropdown-item'>
                  <Settings size={15} /> Configurações
                </button>
                <div className='dropdown-divisor' />
                <button className='dropdown-item sair' onClick={handleSair}>
                  <LogOut size={15} /> Sair da conta
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ── Conteúdo da seção ── */}
      <main className='dash-conteudo'>
        <AnimatePresence mode='wait'>
          <motion.div
            key={secaoAtiva}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >
            {uid && renderSecao()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Modal de perfil ── */}
      <AnimatePresence>
        {perfilAberto && uid && (
          <Perfil
            uid={uid}
            onFechar={async () => {
              setPerfilAberto(false)
              const dados = await buscarPerfil(uid)
              setProfessor(dados)
            }}
          />
        )}
      </AnimatePresence>

    </div>
  )
}

export default Dashboard