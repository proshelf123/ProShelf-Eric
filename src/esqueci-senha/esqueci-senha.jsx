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
                    <p style={{ color: '#888', fontSize: '17px', textAlign: 'center', marginTop: '-1px', marginBottom: '20px' }}>
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

{status.tipo === 'sucesso' && (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <svg width="80" height="80" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
            <style>{`
                .circle-bg { fill: none; stroke: #6F3B9D; stroke-width: 3; opacity: 0.15; margin-bottom: 30px;}
                .circle-progress {
                    fill: none; stroke: #6F3B9D; stroke-width: 3; stroke-linecap: round;
                    stroke-dasharray: 251; stroke-dashoffset: 251;
                    transform: rotate(-90deg); transform-origin: 50px 50px;
                    animation: drawCircle 0.6s cubic-bezier(0.4,0,0.2,1) 0.1s forwards;
                }
                .checkmark {
                    fill: none; stroke: #6F3B9D; stroke-width: 4;
                    stroke-linecap: round; stroke-linejoin: round;
                    stroke-dasharray: 60; stroke-dashoffset: 60;
                    animation: drawCheck 0.4s cubic-bezier(0.4,0,0.2,1) 0.75s forwards;
                }
                .pulse-ring {
                    fill: none; stroke: #6F3B9D; stroke-width: 2; opacity: 0;
                    transform-origin: 50px 50px;
                    animation: pulseOut 1s ease-out 1.1s forwards;
                }
                @keyframes drawCircle { to { stroke-dashoffset: 0; } }
                @keyframes drawCheck  { to { stroke-dashoffset: 0; } }
                @keyframes pulseOut   { 0% { opacity: 0.5; r: 42px; } 100% { opacity: 0; r: 62px; } }
            `}</style>
            <circle className="circle-bg"       cx="50" cy="50" r="40"/>
            <circle className="pulse-ring"      cx="50" cy="50" r="42"/>
            <circle className="circle-progress" cx="50" cy="50" r="40"/>
            <polyline className="checkmark" points="30,52 44,66 70,36"/>
        </svg>
        <p style={{ color: '#4CAF50', fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>
            {status.mensagem}
        </p>
    </div>
)}

{status.tipo === 'erro' && (
    <p style={{ color: '#e53935', fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>
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