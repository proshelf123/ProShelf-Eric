import './inicio.css'
import react from 'react'
import { useEffect } from 'react'
import { motion } from "framer-motion";
import { Link } from 'react-router';
import Logo from '../assets/Group 32 (2).png';
import LogoMobile from '../assets/Group 44.png'
import Porta from '../assets/Union.png'
import Mariana from '../assets/mariana-removebg-preview (1) 1.png'
import Background from '../assets/image 18.png'
import { useNavigate } from 'react-router'


const text = "Quero cadastrar a minha escola";
const text1 = "Já estamos cadastrados";

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04, 
    },
  },
};

const letter = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

function Inicio() {
  const navigate = useNavigate()

    return (
<>
    <header className="cabecalho">
        <div>
    <Link to="/">
      <img 
        src={Logo} id='logo'
        alt="Descrição da imagem para acessibilidade" 
        style={{ cursor: 'pointer' }} // Opcional: melhora a UX
      />
    </Link>


<img src={LogoMobile} id='logo-mobile'/>
        </div>

        <nav>
            <ul id='ul'>
    <motion.li id='menu'
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{ cursor: "pointer" }}
    >
       <Link to="/cadastrar-escola" style={{textDecoration:"none",}}>  <motion.a
            href="#"
            variants={container}
            initial="hidden"
            animate="visible"
            style={{
                textDecoration: "none",
                color: "black",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                userSelect: "none"
            }}>
            {text.split("").map((char, index) => (
                <motion.span key={index} variants={letter}>
                    {char === " " ? "\u00A0" : char}
                </motion.span>
            ))}
        </motion.a> </Link>

        <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1.0, ease: "easeOut" }}>
            <a href='#'><img src={Porta} id='porta-icone' /></a>
        </motion.div>
        <a href='#' style={{ textDecoration: "none", color: "black" }}><img src={Porta} id='porta-icone-mobile' /></a>
    </motion.li>

    <motion.li id='menu1'
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{ cursor: "pointer" }}
    >
        <motion.a
            href="#"
            variants={container}
            initial="hidden"
            animate="visible"
            style={{
                textDecoration: "none",
                color: "black",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                userSelect:"none"
            }}>
            {text1.split("").map((char, index) => (
                <motion.span key={index} variants={letter}>
                    {char === " " ? "\u00A0" : char}
                </motion.span>
            ))}
        </motion.a>

        <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1.0, ease: "easeOut" }}>
            <a href='#'><img src={Porta} id='porta-icone' /></a>
        </motion.div>
        <a href='#' style={{ textDecoration: "none", color: "black" }}><img src={Porta} id='porta-icone-mobile' /></a>
    </motion.li>
</ul>
        </nav>
    </header>

<div className="pagina"> 

  <div style={{
            backgroundImage: `url(${Background})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            height:"100vh",
        }}>
</div>

<div className='container-circulos'>

  <div className='circulo-laranja'>

  </div>

  <div className='circulo-amarelo'>

  </div>

  <div><img src={Mariana} className='mariana'/></div>
</div>

<section className='textos'> 
<div className='texto-direita'>
    <h1 id='tamanho-fonte'> A estante{" "}
      
<span id='inteligente'>
    <span className='com-barra'>inteli
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
          className='barra-animada'/>

    </span><span className='sem-barra'>g</span>
    
  <span className='com-barra'>ente
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.8 }}
          className='barra-animada'/>
    </span>
</span>
      <br />
    </h1>   
</div>
<p id='do-professor'>do professor</p>         

<div className='entrar'> 
    <motion.button
      onClick={() => navigate("/login")}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 1.3 }} className='botao-entrar'> <Link to="/login" style={{textDecoration:"none", color:"white", userSelect:"none"}}>Entrar</Link> </motion.button>
</div> 
  </section>
</div>
</>
  
    )
  } 
export default Inicio 