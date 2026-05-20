import './esqueci-senha.css'
import React, { useState } from 'react';
import LogoMetade from '../assets/Group 28.png'
import LogoIcone from "../assets/Group 32 (2).png"
import { auth } from "../firebase"; 
import { sendPasswordResetEmail } from "firebase/auth";
import { Link, useNavigate } from 'react-router';

function EsqueciSenha() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState({ tipo: '', mensagem: '' });
    const [carregando, setCarregando] = useState(false);
    const navigate = useNavigate();

    const handleRecuperarSenha = async (e) => {
        e?.preventDefault();

        if (!email.trim()) {
            setStatus({ tipo: 'erro', mensagem: 'Por favor, insira seu e-mail.' });
            return;
        }

        setCarregando(true);
        setStatus({ tipo: '', mensagem: '' });

        try {
            await sendPasswordResetEmail(auth, email);
            setStatus({
                tipo: 'sucesso',
                mensagem: 'E-mail de redefinição enviado! Verifique sua caixa de entrada.'
            });
            setEmail('');
        } catch (error) {
            const errorCode = error.code;
            console.error("Erro ao enviar e-mail:", errorCode);

            if (errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-email') {
                setStatus({ tipo: 'erro', mensagem: 'E-mail não encontrado. Verifique e tente novamente.' });
            } else if (errorCode === 'auth/too-many-requests') {
                setStatus({ tipo: 'erro', mensagem: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
            } else {
                setStatus({ tipo: 'erro', mensagem: 'Ocorreu um erro. Tente novamente.' });
            }
        } finally {
            setCarregando(false);
        }
    };

    return (
        <>
            <div className='pagina-login' onKeyDown={(e) => e.key === 'Enter' && handleRecuperarSenha()}>
                <div className='lado-roxo'>
                    <img src={LogoMetade} className='icone-login' alt="Ícone de login" />

                    {[...Array(12)].map((_, i) => (
                        <span
                            key={`p${i}`}
                            className="particula"
                            style={{
                                left: `${8 + i * 7.5}%`,
                                width:  i % 3 === 0 ? '5px' : '3px',
                                height: i % 3 === 0 ? '5px' : '3px',
                                animationDelay:    `${(i * 0.8) % 6}s`,
                                animationDuration: `${6 + (i % 4)}s`,
                            }}
                        />
                    ))}

                    {[20, 45, 70].map((y, i) => (
                        <span
                            key={`b${i}`}
                            className="brilho-linha"
                            style={{
                                top: `${y}%`,
                                animationDelay:    `${i * 3}s`,
                                animationDuration: `${8 + i * 2}s`,
                            }}
                        />
                    ))}
                </div>

                <div className='lado-branco'>
                    <img src={LogoIcone} className='logo-login' alt="Logo" />
                    <h2 id='acessar'>Redefinir senha</h2>
                    <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', maxWidth: '320px', marginTop: '-10px' }}>
                        Insira seu e-mail e enviaremos um link para redefinir sua senha.
                    </p>

                    <div className='campo'>
                        <label>E-mail</label>
                        <input
                            type="email"
                            placeholder='Digite seu e-mail'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={carregando}
                        />
                    </div>

                    {status.mensagem && (
                        <p style={{
                            color: status.tipo === 'sucesso' ? '#4CAF50' : '#e53935',
                            fontSize: '14px',
                            textAlign: 'center',
                            maxWidth: '320px',
                            fontWeight: '500'
                        }}>
                            {status.mensagem}
                        </p>
                    )}

                    <button
                        className='btn-entrar'
                        onClick={handleRecuperarSenha}
                        disabled={carregando}
                        style={{ opacity: carregando ? 0.7 : 1, cursor: carregando ? 'not-allowed' : 'pointer' }}
                    >
                        {carregando ? 'Enviando...' : 'Recuperar senha'}
                        {!carregando && <span className="arrow">›</span>}
                    </button>

                    <p>
                        Voltar para o{' '}
                        <Link to='/login' className='aqui'>Login</Link>
                    </p>
                </div>
            </div>
        </>
    );
}

export default EsqueciSenha;