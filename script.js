// Aguarda o carregamento completo do HTML (DOM) antes de executar as funções.
// Isso garante que os elementos da página já existam na tela quando o script rodar.

document.addEventListener('DOMContentLoaded', () => {
    initMenuMobile();
    initCabecalhoScroll();
    initVoltarAoTopo();
    initScrollSpy();
    initContadorEstatisticas();
    initTempoLeitura();
    initFerramentasSenha();
    initChecklistDesinformacao();
    initChatFlutuante();
    initQuiz();
});

// --------------------------------------------------------------------------
// Fecha o menu mobile automaticamente ao clicar em um link
// --------------------------------------------------------------------------
function initMenuMobile() {
    const checkbox = document.getElementById('menu-controle');
    if (!checkbox) return;

    document.querySelectorAll('.lista-links a').forEach((link) => {
        link.addEventListener('click', () => {
            checkbox.checked = false;
        });
    });
}

// --------------------------------------------------------------------------
// Sombra no cabeçalho ao rolar a página
// --------------------------------------------------------------------------
function initCabecalhoScroll() {
    const cabecalho = document.getElementById('cabecalho');
    if (!cabecalho) return;

    const aoRolar = () => {
        cabecalho.classList.toggle('com-sombra', window.scrollY > 8);
    };

    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
}

// --------------------------------------------------------------------------
// Botão "voltar ao topo" (aparece após rolar a página)
// --------------------------------------------------------------------------
function initVoltarAoTopo() {
    const btnTopo = document.getElementById('btn-topo');
    if (!btnTopo) return;

    function atualizar() {
        btnTopo.classList.toggle('visivel', window.scrollY > 400);
    }

    atualizar();
    window.addEventListener('scroll', atualizar, { passive: true });

    btnTopo.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}


// --------------------------------------------------------------------------
// Scrollspy: destaca no menu a seção que está visível no momento
// --------------------------------------------------------------------------
function initScrollSpy() {
    const secoes = document.querySelectorAll('main section[id]');
    const links = document.querySelectorAll('.lista-links a');
    if (secoes.length === 0 || links.length === 0) return;

    const mapaLinks = new Map();
    links.forEach((link) => {
        const destino = link.getAttribute('href').replace('#', '');
        mapaLinks.set(destino, link);
    });

    const observador = new IntersectionObserver(
        (entradas) => {
            entradas.forEach((entrada) => {
                const link = mapaLinks.get(entrada.target.id);
                if (!link || !entrada.isIntersecting) return;
                links.forEach((l) => l.classList.remove('link-ativo'));
                link.classList.add('link-ativo');
            });
        },
        { rootMargin: '-40% 0px -50% 0px' }
    );

    secoes.forEach((secao) => observador.observe(secao));
}

// --------------------------------------------------------------------------
// Contador animado para a faixa de estatísticas do hero
// --------------------------------------------------------------------------
function initContadorEstatisticas() {
    const numeros = document.querySelectorAll('[data-contador]');
    if (numeros.length === 0) return;

    const animarNumero = (elemento) => {
        const final = parseInt(elemento.dataset.final, 10) || 0;
        const sufixo = elemento.dataset.sufixo || '';
        const duracao = 1200;
        const inicio = performance.now();

        function passo(agora) {
            const progresso = Math.min((agora - inicio) / duracao, 1);
            const valorAtual = Math.round(progresso * final);
            elemento.textContent = `${valorAtual}${sufixo}`;
            if (progresso < 1) {
                requestAnimationFrame(passo);
            }
        }

        requestAnimationFrame(passo);
    };

    if (!('IntersectionObserver' in window)) {
        numeros.forEach(animarNumero);
        return;
    }

    const observador = new IntersectionObserver(
        (entradas) => {
            entradas.forEach((entrada) => {
                if (entrada.isIntersecting) {
                    animarNumero(entrada.target);
                    observador.unobserve(entrada.target);
                }
            });
        },
        { threshold: 0.4 }
    );

    numeros.forEach((numero) => observador.observe(numero));
}

// --------------------------------------------------------------------------
// Tempo estimado de leitura de cada seção de conteúdo
// --------------------------------------------------------------------------
function initTempoLeitura() {
    const VELOCIDADE_PALAVRAS_POR_MINUTO = 200;
    const selos = document.querySelectorAll('[data-tempo-leitura]');

    selos.forEach((selo) => {
        const cartao = selo.closest('.cartao-conteudo');
        if (!cartao) return;

        const texto = cartao.textContent || '';
        const totalPalavras = texto.trim().split(/\s+/).filter(Boolean).length;
        const minutos = Math.max(1, Math.round(totalPalavras / VELOCIDADE_PALAVRAS_POR_MINUTO));

        selo.textContent = `⏱ ${minutos} min de leitura`;
    });
}

// --------------------------------------------------------------------------
// Ferramentas de senha (verificador + gerador) — mesmos endpoints de antes
// --------------------------------------------------------------------------
function initFerramentasSenha() {
    const inputSenha = document.getElementById('senha-teste');
    const btnOlho = document.getElementById('btn-mostrar-senha');
    const btnVerificar = document.getElementById('btn-verificar-senha');
    const btnGerar = document.getElementById('btn-gerar-senha');
    const resultadoForca = document.getElementById('resultado-forca');
    const senhaGerada = document.getElementById('senha-gerada');
    const agulha = document.getElementById('velocimetro-agulha');

    // Ângulos do velocímetro: -85° (sem dados) / -60° (zona vermelha,
    // fraca) / 0° (zona amarela, média) / 60° (zona verde, forte)
    function moverAgulha(textoResultado) {
        if (!agulha) return;
        let angulo = -85;
        if (textoResultado.includes('Fraca')) angulo = -60;
        else if (textoResultado.includes('Média')) angulo = 0;
        else if (textoResultado.includes('Forte')) angulo = 60;
        agulha.style.transform = `rotate(${angulo}deg)`;
    }

    if (btnOlho && inputSenha) {
        btnOlho.addEventListener('click', () => {
            const estaVisivel = inputSenha.type === 'text';
            inputSenha.type = estaVisivel ? 'password' : 'text';
            btnOlho.textContent = estaVisivel ? '👁️' : '🙈';
            btnOlho.setAttribute('aria-label', estaVisivel ? 'Mostrar senha' : 'Ocultar senha');
        });
    }

    if (btnVerificar && inputSenha && resultadoForca) {
        btnVerificar.addEventListener('click', () => {
            const dados = new FormData();
            dados.append('senha_teste', inputSenha.value);

            fetch('/processar-verificacao', { method: 'POST', body: dados })
                .then((resposta) => resposta.json())
                .then((data) => {
                    resultadoForca.textContent = data.resultado_texto;
                    resultadoForca.style.color = data.resultado_cor;
                    moverAgulha(data.resultado_texto);
                })
                .catch(() => {
                    resultadoForca.textContent = 'Não foi possível verificar agora. Tente novamente.';
                    resultadoForca.style.color = 'var(--cor-perigo)';
                });
        });
    }

    if (btnGerar && senhaGerada) {
        btnGerar.addEventListener('click', () => {
            fetch('/processar-geracao', { method: 'POST' })
                .then((resposta) => resposta.json())
                .then((data) => {
                    senhaGerada.value = data.senha_generada;
                })
                .catch(() => {
                    senhaGerada.value = '';
                    senhaGerada.placeholder = 'Erro ao gerar. Tente novamente.';
                });
        });
    }
}

// --------------------------------------------------------------------------
// Checklist "antes de compartilhar" (Combate à Desinformação)
// --------------------------------------------------------------------------
function initChecklistDesinformacao() {
    const checklist = document.getElementById('checklist-compartilhar');
    const mensagem = document.getElementById('checklist-mensagem');
    if (!checklist || !mensagem) return;

    const caixas = checklist.querySelectorAll('input[type="checkbox"]');

    function verificarTudoMarcado() {
        const todasMarcadas = Array.from(caixas).every((caixa) => caixa.checked);
        mensagem.classList.toggle('visivel', todasMarcadas);
    }

    caixas.forEach((caixa) => caixa.addEventListener('change', verificarTudoMarcado));
}

// --------------------------------------------------------------------------
// Quiz interativo "Teste seus Conhecimentos"
// --------------------------------------------------------------------------
function initQuiz() {
    const container = document.getElementById('quiz-app');
    if (!container) return;

    const perguntas = [
        {
            pergunta: 'Segundo o padrão atual do NIST, o que mais aumenta a segurança de uma senha?',
            opcoes: [
                'Trocar a senha a cada 30 dias',
                'Usar senhas longas e fáceis de lembrar (passphrases)',
                'Adicionar símbolos sem aumentar o tamanho',
                'Usar a mesma senha em todas as contas',
            ],
            correta: 1,
            explicacao:
                'O padrão NIST hoje prioriza o tamanho da senha sobre a complexidade forçada — senhas longas e memorizáveis são mais seguras e mais fáceis de manter.',
        },
        {
            pergunta: 'O que é a autenticação em duas etapas (2FA)?',
            opcoes: [
                'Usar duas senhas diferentes ao mesmo tempo',
                'Combinar a senha com um segundo fator, como um app autenticador ou biometria',
                'Trocar de senha duas vezes por ano',
                'Compartilhar a senha com uma pessoa de confiança',
            ],
            correta: 1,
            explicacao:
                'O 2FA combina "algo que você sabe" (senha) com "algo que você tem ou é" (celular, app, biometria) — uma camada extra que protege a conta mesmo se a senha for descoberta.',
        },
        {
            pergunta: 'De acordo com a LGPD, qual é o limite máximo de multa por infração?',
            opcoes: ['R$ 5 mil', 'R$ 500 mil', 'R$ 50 milhões', 'Não há limite'],
            correta: 2,
            explicacao:
                'A multa pode chegar a 2% do faturamento da empresa, limitada a R$ 50 milhões por infração — além de possíveis indenizações ao titular dos dados.',
        },
        {
            pergunta: 'Qual destes é um sinal clássico de fake news?',
            opcoes: [
                'Foi publicada em um domínio .gov.br',
                'Pede para você "compartilhar antes que apaguem"',
                'Tem a data de publicação visível',
                'Foi confirmada por vários veículos sérios',
            ],
            correta: 1,
            explicacao:
                'Linguagem urgente ou apelativa, pedindo compartilhamento imediato, é um clássico sinal de alerta — pare e verifique antes de repassar.',
        },
        {
            pergunta: 'Qual destes é um exemplo de uso inadequado da Inteligência Artificial?',
            opcoes: [
                'Usar IA para revisar a ortografia de um texto',
                'Criar vídeos ou áudios falsos (deepfakes) para enganar pessoas',
                'Usar IA para traduzir um e-mail',
                'Usar IA para organizar uma agenda',
            ],
            correta: 1,
            explicacao: 'Deepfakes usados para enganar, fraudar ou manipular são um dos principais riscos do uso irresponsável da IA.',
        },
        {
            pergunta: 'Você recebe um anúncio: "Você ganhou um iPhone, clique aqui!". O que isso provavelmente é?',
            opcoes: [
                'Uma promoção legítima de uma loja',
                'Um golpe de phishing, tentando roubar dados ou instalar malware',
                'Um erro do navegador',
                'Um aviso oficial do governo',
            ],
            correta: 1,
            explicacao:
                'Ofertas boas demais para ser verdade são a isca clássica do phishing — a regra de ouro é: se parece bom demais, provavelmente é golpe.',
        },
    ];

    let indiceAtual = 0;
    let pontuacao = 0;

    function renderizarPergunta() {
        const dados = perguntas[indiceAtual];
        const grupoNome = `quiz-pergunta-${indiceAtual}`;

        const opcoesHtml = dados.opcoes
            .map(
                (opcao, indice) => `
                <label class="quiz-opcao" data-indice="${indice}">
                    <input type="radio" name="${grupoNome}" value="${indice}">
                    <span>${opcao}</span>
                </label>`
            )
            .join('');

        container.innerHTML = `
            <p class="quiz-progresso">Pergunta ${indiceAtual + 1} de ${perguntas.length}</p>
            <fieldset class="quiz-pergunta-fieldset">
                <legend class="quiz-pergunta">${dados.pergunta}</legend>
                <div class="quiz-opcoes">${opcoesHtml}</div>
            </fieldset>
            <div class="quiz-feedback" id="quiz-feedback" hidden></div>
            <div class="quiz-acoes">
                <button type="button" class="quiz-botao-proxima" id="quiz-botao-proxima" disabled>
                    ${indiceAtual === perguntas.length - 1 ? 'Ver resultado' : 'Próxima'}
                </button>
            </div>
        `;

        const opcoesEl = container.querySelectorAll('.quiz-opcao');
        const feedbackEl = container.querySelector('#quiz-feedback');
        const botaoProxima = container.querySelector('#quiz-botao-proxima');
        let respondida = false;

        opcoesEl.forEach((opcaoEl) => {
            const input = opcaoEl.querySelector('input');
            input.addEventListener('change', () => {
                if (respondida) return;
                respondida = true;

                const indiceEscolhido = Number(opcaoEl.dataset.indice);
                const acertou = indiceEscolhido === dados.correta;
                if (acertou) pontuacao += 1;

                opcoesEl.forEach((el) => {
                    const idx = Number(el.dataset.indice);
                    if (idx === dados.correta) el.classList.add('correta');
                    else if (idx === indiceEscolhido) el.classList.add('incorreta');
                    el.querySelector('input').disabled = true;
                });

                feedbackEl.hidden = false;
                feedbackEl.textContent = acertou ? `✅ Correto! ${dados.explicacao}` : `❌ Quase! ${dados.explicacao}`;

                botaoProxima.disabled = false;
                botaoProxima.focus();
            });
        });

        botaoProxima.addEventListener('click', () => {
            indiceAtual += 1;
            if (indiceAtual < perguntas.length) {
                renderizarPergunta();
            } else {
                renderizarResultado();
            }
        });
    }

    function renderizarResultado() {
        let medalha = '📘';
        let mensagem =
            'Você chegou até o fim — o importante é continuar aprendendo. Que tal revisar as seções acima?';

        if (pontuacao === perguntas.length) {
            medalha = '🏁';
            mensagem = 'Pole position! Você acertou todas — Cidadão(a) Digital nível campeão(ã).';
        } else if (pontuacao >= perguntas.length - 2) {
            medalha = '🥈';
            mensagem = 'Muito bem, você está no pódio! Só faltou um detalhe ou outro.';
        } else if (pontuacao >= perguntas.length / 2) {
            medalha = '🥉';
            mensagem = 'Bom resultado! Vale revisar algumas seções pra fechar com chave de ouro.';
        }

        container.innerHTML = `
            <div class="quiz-resultado">
                <span class="quiz-resultado-medalha" aria-hidden="true">${medalha}</span>
                <span class="quiz-resultado-pontuacao">${pontuacao} / ${perguntas.length}</span>
                <p class="quiz-resultado-mensagem">${mensagem}</p>
                <button type="button" class="botao-acao quiz-botao-refazer" id="quiz-refazer">Refazer o Quiz</button>
            </div>
        `;

        container.querySelector('#quiz-refazer').addEventListener('click', () => {
            indiceAtual = 0;
            pontuacao = 0;
            renderizarPergunta();
        });
    }

    renderizarPergunta();
}

// --------------------------------------------------------------------------
// Chat flutuante: abrir/fechar/minimizar/redimensionar + envio de mensagens
// --------------------------------------------------------------------------
function initChatFlutuante() {
    const widget = document.getElementById('chat-flutuante');
    const fab = document.getElementById('chat-fab');
    const btnFechar = document.getElementById('chat-fechar');
    const btnMinimizar = document.getElementById('chat-minimizar');
    const alca = document.getElementById('chat-redimensionar');
    const input = document.getElementById('chat-input');
    const botaoEnviar = document.getElementById('chat-enviar');
    const conteudo = document.getElementById('chat-conteudo');

    if (!widget || !fab) return;

    function abrirChat() {
        widget.dataset.estado = 'aberto';
        widget.setAttribute('aria-hidden', 'false');
        fab.classList.add('oculto');
        fab.classList.remove('chamando-atencao');
        fab.setAttribute('aria-expanded', 'true');
        if (input) input.focus();
    }

    function fecharChat() {
        widget.dataset.estado = 'fechado';
        widget.setAttribute('aria-hidden', 'true');
        fab.classList.remove('oculto');
        fab.setAttribute('aria-expanded', 'false');
        fab.focus();
    }

    function alternarMinimizar() {
        const estaMinimizado = widget.dataset.estado === 'minimizado';
        widget.dataset.estado = estaMinimizado ? 'aberto' : 'minimizado';
        btnMinimizar.setAttribute('aria-label', estaMinimizado ? 'Minimizar chat' : 'Restaurar chat');
        btnMinimizar.innerHTML = estaMinimizado ? '&#8211;' : '&#9633;';
    }

    fab.addEventListener('click', abrirChat);
    btnFechar?.addEventListener('click', fecharChat);
    btnMinimizar?.addEventListener('click', alternarMinimizar);

    if (alca) {
        let redimensionando = false;
        let larguraInicial = 0;
        let alturaInicial = 0;
        let xInicial = 0;
        let yInicial = 0;

        const LARGURA_MIN = 300;
        const ALTURA_MIN = 360;

        alca.addEventListener('pointerdown', (evento) => {
            redimensionando = true;
            larguraInicial = widget.offsetWidth;
            alturaInicial = widget.offsetHeight;
            xInicial = evento.clientX;
            yInicial = evento.clientY;
            alca.setPointerCapture(evento.pointerId);
        });

        alca.addEventListener('pointermove', (evento) => {
            if (!redimensionando) return;

            const deltaX = xInicial - evento.clientX;
            const deltaY = yInicial - evento.clientY;

            const larguraMax = Math.min(560, window.innerWidth - 32);
            const alturaMax = Math.min(720, window.innerHeight - 100);

            const novaLargura = Math.max(LARGURA_MIN, Math.min(larguraMax, larguraInicial + deltaX));
            const novaAltura = Math.max(ALTURA_MIN, Math.min(alturaMax, alturaInicial + deltaY));

            widget.style.width = `${novaLargura}px`;
            widget.style.height = `${novaAltura}px`;
        });

        const pararRedimensionamento = () => {
            redimensionando = false;
        };
        alca.addEventListener('pointerup', pararRedimensionamento);
        alca.addEventListener('pointercancel', pararRedimensionamento);
    }

    function criarBalao(texto, classeExtra) {
        const balao = document.createElement('div');
        balao.className = `balao-chat ${classeExtra || ''}`.trim();
        balao.textContent = texto;
        conteudo.appendChild(balao);
        conteudo.scrollTop = conteudo.scrollHeight;
        return balao;
    }

    function criarIndicadorDigitando() {
        const balao = document.createElement('div');
        balao.className = 'balao-chat balao-carregando';
        balao.setAttribute('aria-label', 'Assistente está digitando');
        balao.innerHTML = '<span class="ponto"></span><span class="ponto"></span><span class="ponto"></span>';
        conteudo.appendChild(balao);
        conteudo.scrollTop = conteudo.scrollHeight;
        return balao;
    }

    function enviarMensagem() {
        const mensagemUsuario = input.value.trim();
        if (mensagemUsuario === '') return;

        criarBalao(mensagemUsuario, 'balao-usuario');
        input.value = '';

        const indicador = criarIndicadorDigitando();

        const dadosChat = new FormData();
        dadosChat.append('mensagem', mensagemUsuario);

        fetch('/processar-chat', { method: 'POST', body: dadosChat })
            .then((resposta) => resposta.json())
            .then((data) => {
                indicador.remove();
                criarBalao(data.resposta, 'balao-ia');
            })
            .catch((erro) => {
                console.error('Erro ao falar com o assistente:', erro);
                indicador.remove();
                criarBalao('Não foi possível conectar ao assistente agora. Tente novamente.', 'balao-ia');
            });
    }

    if (botaoEnviar && input) {
        botaoEnviar.addEventListener('click', enviarMensagem);
        input.addEventListener('keydown', (evento) => {
            if (evento.key === 'Enter') enviarMensagem();
        });
    }
}

// --------------------------------------------------------------------------
// Pop-ups de anúncios de phishing (simulação educativa)
// --------------------------------------------------------------------------
function initPopupsAnuncio() {
    // Caminhos das imagens — ajuste se necessário
    const IMAGENS = [
        '/img/golpe1.jpeg',
        '/img/golpe2.jpeg',
        '/img/golpe3.jpeg'
    ];

    const INTERVALO_MIN = 5000; // 5 s
    const INTERVALO_MAX = 7000; // 7 s
    const DESTINO_CLICK = '/alerta';

    // Embaralha o array (Fisher-Yates)
    function embaralhar(arr) {
        const copia = [...arr];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    const fila = embaralhar(IMAGENS);
    let indice = 0;
    let popupAberto = false;
    let timeoutId = null;

    function abrirPopup() {
        // Não abre se já há um popup aberto ou se acabaram as imagens
        if (popupAberto || indice >= fila.length) return;

        popupAberto = true;
        const src = fila[indice++];

        // Cria overlay
        const overlay = document.createElement('div');
        overlay.className = 'popup-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');

        // Caixa clicável (leva para anuncio.html)
        const caixa = document.createElement('div');
        caixa.className = 'popup-caixa';
        caixa.setAttribute('tabindex', '0');
        caixa.addEventListener('click', () => {
            window.location.href = DESTINO_CLICK;
        });

        // Imagem
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Anúncio suspeito — simulação de phishing';
        img.className = 'popup-imagem';

        // Botão fechar
        const btnFechar = document.createElement('button');
        btnFechar.className = 'popup-fechar';
        btnFechar.setAttribute('aria-label', 'Fechar anúncio');
        btnFechar.innerHTML = '&#x2715;'; // ✕
        btnFechar.addEventListener('click', (e) => {
            e.stopPropagation(); // Não redirecionar ao fechar
            fecharPopup(overlay);
        });

        caixa.appendChild(img);
        caixa.appendChild(btnFechar);
        overlay.appendChild(caixa);
        document.body.appendChild(overlay);

        // Agenda o próximo popup após este ser fechado
    }

    function fecharPopup(overlay) {
        overlay.remove();
        popupAberto = false;

        // Agenda próximo popup se ainda houver imagens
        if (indice < fila.length) {
            const delay = INTERVALO_MIN + Math.random() * (INTERVALO_MAX - INTERVALO_MIN);
            timeoutId = setTimeout(abrirPopup, delay);
        }
    }

    // Inicia o ciclo após o primeiro intervalo aleatório
    const primeiroDelay = INTERVALO_MIN + Math.random() * (INTERVALO_MAX - INTERVALO_MIN);
    timeoutId = setTimeout(abrirPopup, primeiroDelay);
}

// Registra a função no DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initPopupsAnuncio();
});
