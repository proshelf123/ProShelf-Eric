import './esqueci-senha.css'
import React, { useState } from 'react';
import LogoMetade from '../assets/Group 28.png'
import LogoIcone from "../assets/Group 32 (2).png"
import { auth } from "../firebase"; 
import { signInWithEmailAndPassword } from "firebase/auth";
import { Link } from 'react-router';

function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;
            console.log(user);
            window.location.href = '/dashboard';
        } catch (error) {
            const errorCode = error.code;
            console.error("Erro ao logar:", errorCode);
            
            if (errorCode === 'auth/invalid-credential') {
                alert("E-mail ou senha incorretos.");
            } else {
                alert("Ocorreu um erro ao tentar entrar. Tente novamente.");
            }
        }
    };

    return (
        <>
            <div className='pagina-login' onKeyDown={(e) => e.key === 'Enter' && handleLogin()}>
                <div className='lado-roxo'>
                    <Link to='/' />
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

                    <div className='campo'>
                        <label>E-mail</label>
                        <input 
                            type="email" 
                            placeholder='Digite seu e-mail' 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>


                    <button className='btn-entrar' onClick={handleLogin}>
                        Recuperar senha
                        <span className="arrow">›</span>
                    </button>

                    <p>Voltar</p>
                </div>
            </div>
        </>
    );
}

export default Login;