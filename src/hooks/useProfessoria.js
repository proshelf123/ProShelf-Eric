// src/hooks/useProfessorIA.js
//
// Hook que busca todos os dados relevantes do professor para
// alimentar o system prompt da IA com contexto real.
//
// Retorna: { contexto, loading }
// "contexto" é um objeto pronto para ser serializado no prompt.

import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, getDocs, collection } from 'firebase/firestore'
import { auth, db } from '../firebase'

function sanitizarEmail(email) {
  return email.toLowerCase().replace(/[@.]/g, '_')
}

const DIAS_ORDEM = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']

export function useProfessorIA() {
  const [contexto, setContexto] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return }

      try {
        // 1. Perfil
        const userSnap = await getDoc(doc(db, 'users', user.uid))
        const perfil = userSnap.exists() ? userSnap.data() : {}

        // 2. Turmas
        const turmasSnap = await getDocs(collection(db, 'turmas', user.uid, 'lista'))
        const turmas = turmasSnap.docs.map(d => ({ id: d.id, ...d.data() }))

        // 3. Cronograma — tenta escola primeiro, depois manual
        let cronograma = []
        let fonteCronograma = 'nenhum'

        if (perfil.email) {
          const emailId = sanitizarEmail(perfil.email)
          const vinculoSnap = await getDoc(doc(db, 'professores_escola', emailId))
          if (vinculoSnap.exists()) {
            const nomePDF = vinculoSnap.data().nomePDF
            const escolaSnap = await getDocs(
              collection(db, 'cronogramas_escola', nomePDF, 'aulas')
            )
            if (!escolaSnap.empty) {
              cronograma = escolaSnap.docs.map(d => ({ id: d.id, ...d.data() }))
              fonteCronograma = 'coordenador'
            }
          }
        }

        if (cronograma.length === 0) {
          const manualSnap = await getDocs(collection(db, 'cronogramas', user.uid, 'aulas'))
          cronograma = manualSnap.docs.map(d => ({ id: d.id, ...d.data() }))
          fonteCronograma = cronograma.length > 0 ? 'manual' : 'nenhum'
        }

        setContexto({
          uid: user.uid,
          email: user.email,
          nome: perfil.nome || user.displayName || 'Professor',
          instituicao: perfil.instituicao || '',
          modalidade: perfil.modalidade || 'Presencial',
          role: perfil.role || 'professor',
          turmas,
          cronograma,
          fonteCronograma,
        })
      } catch (err) {
        console.error('Erro ao carregar contexto da IA:', err)
        setContexto(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { contexto, loading }
}