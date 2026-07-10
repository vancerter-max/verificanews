// ==========================================
// VARIÁVEL DA API (CONECTADA À SUA IA)
// ==========================================
const API_URL = 'https://vancer.pythonanywhere.com';  // URL CORRETA

// ==========================================
// VARIÁVEL PARA ARMAZENAR A ÚLTIMA RESPOSTA
// ==========================================
let ultimaResposta = {
    texto: '',
    classificacao: '',
    confianca: 0,
    textoOriginal: ''
};

// ==========================================
// FUNÇÃO DE ÁUDIO (LEITURA EM VOZ ALTA)
// ==========================================
function falar(texto) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        window.speechSynthesis.speak(utterance);
        
        document.getElementById('audioStatus').textContent = '🔊 Falando...';
        document.getElementById('audioStatus').style.color = '#28a745';
        
        utterance.onend = function() {
            document.getElementById('audioStatus').textContent = '✅ Áudio finalizado';
            document.getElementById('audioStatus').style.color = '#495057';
            setTimeout(() => {
                document.getElementById('audioStatus').textContent = '🔊 Clique para ouvir novamente';
            }, 3000);
        };
        
        utterance.onerror = function() {
            document.getElementById('audioStatus').textContent = '❌ Erro no áudio';
            document.getElementById('audioStatus').style.color = '#dc3545';
        };
    } else {
        alert('❌ Seu navegador não suporta áudio. Use Chrome, Edge ou Safari.');
    }
}

// ==========================================
// CARREGAR ESTATÍSTICAS
// ==========================================
async function carregarEstatisticas() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        if (response.ok) {
            const data = await response.json();
            document.getElementById('statsBanco').textContent = data.banco_dados || '?';
        }
    } catch {
        document.getElementById('statsBanco').textContent = '?';
    }
}

// ==========================================
// PRINCIPAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const textoInput = document.getElementById('textoInput');
    const analisarBtn = document.getElementById('analisarBtn');
    const audioBtn = document.getElementById('audioBtn');
    const loading = document.getElementById('loading');
    const resultado = document.getElementById('resultado');
    const novoBtn = document.getElementById('novoBtn');
    const exemploBtns = document.querySelectorAll('.exemplo-btn');
    
    // Elementos de feedback
    const feedbackArea = document.getElementById('feedback-area');
    const feedbackSim = document.getElementById('feedbackSim');
    const feedbackNao = document.getElementById('feedbackNao');
    const feedbackCorrecao = document.getElementById('feedback-correcao');
    const corretoVerdadeiro = document.getElementById('corretoVerdadeiro');
    const corretoFalso = document.getElementById('corretoFalso');
    const feedbackExplicacao = document.getElementById('feedback-explicacao');
    const feedbackExplicacaoInput = document.getElementById('feedbackExplicacaoInput');
    const feedbackEnviar = document.getElementById('feedbackEnviar');
    const feedbackObrigado = document.getElementById('feedback-obrigado');

    // Carrega estatísticas
    carregarEstatisticas();

    // ==========================================
    // ANALISAR NOTÍCIA
    // ==========================================
    async function analisarNoticia(texto) {
        loading.classList.remove('hidden');
        resultado.classList.add('hidden');
        feedbackArea.classList.add('hidden');
        feedbackCorrecao.classList.add('hidden');
        feedbackExplicacao.classList.add('hidden');
        feedbackObrigado.classList.add('hidden');
        analisarBtn.disabled = true;
        audioBtn.disabled = true;
        document.getElementById('audioStatus').textContent = '⏳ Analisando...';

        try {
            console.log('📤 Enviando para:', API_URL);
            const response = await fetch(`${API_URL}/analisar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texto: texto })
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.erro) throw new Error(data.erro);
            
            // Guarda a resposta
            ultimaResposta = {
                texto: data.explicacao || 'Análise concluída.',
                classificacao: data.classificacao || 'Duvidosa',
                confianca: data.confianca || 0,
                textoOriginal: texto
            };
            
            exibirResultado(data);

        } catch (error) {
            console.error('❌ Erro:', error);
            alert('❌ Erro ao analisar: ' + error.message);
            document.getElementById('audioStatus').textContent = '❌ Erro na análise';
        } finally {
            loading.classList.add('hidden');
            analisarBtn.disabled = false;
            audioBtn.disabled = false;
        }
    }

    // ==========================================
    // EXIBIR RESULTADO
    // ==========================================
    function exibirResultado(data) {
        const classificacaoDiv = document.getElementById('classificacao');
        const confiancaDiv = document.getElementById('confianca');
        const urlDiv = document.getElementById('analise_url');
        const explicacaoDiv = document.getElementById('explicacao');
        const dicasDiv = document.getElementById('dicas');

        // Classificação
        const classe = data.classificacao ? data.classificacao.toLowerCase() : 'duvidosa';
        const emoji = data.classificacao === 'Verdadeira' ? '✅' : data.classificacao === 'Falsa' ? '❌' : '⚠️';
        
        classificacaoDiv.textContent = `${emoji} ${data.classificacao || 'Duvidosa'}`;
        classificacaoDiv.className = `classificacao-${classe}`;
        confiancaDiv.textContent = `🎯 Confiança: ${data.confianca || 0}%`;

        // URL
        if (data.url_analisada) {
            urlDiv.textContent = `🔗 URL lida: ${data.url_analisada}`;
            urlDiv.style.display = 'block';
        } else {
            urlDiv.style.display = 'none';
        }

        // Explicação
        explicacaoDiv.textContent = data.explicacao || 'Análise concluída.';

        // Dicas
        if (data.dicas && data.dicas.length > 0) {
            let html = '<ul style="list-style:none;padding:0;">';
            data.dicas.forEach(dica => {
                html += `<li style="padding:3px 0;">${dica}</li>`;
            });
            html += '</ul>';
            dicasDiv.innerHTML = html;
            dicasDiv.style.display = 'block';
        } else {
            dicasDiv.style.display = 'none';
        }

        // Habilita áudio
        audioBtn.disabled = false;
        document.getElementById('audioStatus').textContent = '🔊 Clique para ouvir a resposta';

        // Mostra resultado e feedback
        resultado.classList.remove('hidden');
        
        if (data.classificacao !== 'Erro') {
            feedbackArea.classList.remove('hidden');
            feedbackObrigado.classList.add('hidden');
            feedbackCorrecao.classList.add('hidden');
            feedbackExplicacao.classList.add('hidden');
        }
        
        resultado.scrollIntoView({ behavior: 'smooth' });
        carregarEstatisticas();
    }

    // ==========================================
    // FEEDBACK - COMUNIDADE ENSINA A IA
    // ==========================================

    feedbackSim.addEventListener('click', () => {
        feedbackObrigado.classList.remove('hidden');
        feedbackObrigado.innerHTML = `
            <p>✅ <strong>Ótimo!</strong> A IA acertou!</p>
            <p style="font-size:0.9em;color:#666;">🧠 Seu feedback ajuda a melhorar o sistema!</p>
        `;
        feedbackCorrecao.classList.add('hidden');
        feedbackExplicacao.classList.add('hidden');
    });

    feedbackNao.addEventListener('click', () => {
        feedbackCorrecao.classList.remove('hidden');
        feedbackExplicacao.classList.add('hidden');
        feedbackObrigado.classList.add('hidden');
    });

    corretoVerdadeiro.addEventListener('click', () => {
        feedbackExplicacao.classList.remove('hidden');
        feedbackExplicacaoInput.placeholder = 'Explique por que é Verdadeira (opcional)...';
        feedbackExplicacao.dataset.correcao = 'Verdadeira';
    });

    corretoFalso.addEventListener('click', () => {
        feedbackExplicacao.classList.remove('hidden');
        feedbackExplicacaoInput.placeholder = 'Explique por que é Falsa (opcional)...';
        feedbackExplicacao.dataset.correcao = 'Falsa';
    });

    feedbackEnviar.addEventListener('click', async () => {
        const correcao = feedbackExplicacao.dataset.correcao || 'Duvidosa';
        const explicacao = feedbackExplicacaoInput.value.trim() || `Classificado pela comunidade como ${correcao}`;
        
        feedbackEnviar.disabled = true;
        feedbackEnviar.textContent = '⏳ Enviando...';
        
        try {
            const response = await fetch(`${API_URL}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    texto: ultimaResposta.textoOriginal || textoInput.value,
                    classificacao: correcao,
                    explicacao: explicacao,
                    fonte: 'Comunidade'
                })
            });
            
            if (response.ok) {
                feedbackObrigado.classList.remove('hidden');
                feedbackObrigado.innerHTML = `
                    <p>✅ <strong>Muito obrigado!</strong> A IA aprendeu com seu feedback!</p>
                    <p style="font-size:0.9em;color:#666;">🧠 Quanto mais pessoas ensinarem, mais inteligente ela fica!</p>
                `;
                feedbackCorrecao.classList.add('hidden');
                feedbackExplicacao.classList.add('hidden');
                carregarEstatisticas();
            } else {
                alert('❌ Erro ao enviar feedback. Tente novamente.');
            }
        } catch {
            alert('❌ Erro ao enviar feedback. Tente novamente.');
        }
        
        feedbackEnviar.disabled = false;
        feedbackEnviar.textContent = '📤 Enviar correção';
    });

    // ==========================================
    // BOTÃO DE ÁUDIO
    // ==========================================
    audioBtn.addEventListener('click', () => {
        if (ultimaResposta.texto) {
            const frase = `A notícia analisada é ${ultimaResposta.classificacao} com ${ultimaResposta.confianca}% de confiança. ${ultimaResposta.texto}`;
            falar(frase);
        } else {
            alert('⚠️ Nenhuma análise disponível.');
        }
    });

    // ==========================================
    // BOTÃO ANALISAR
    // ==========================================
    analisarBtn.addEventListener('click', () => {
        const texto = textoInput.value.trim();
        if (!texto) {
            alert('📝 Cole um texto ou URL para analisar');
            return;
        }
        analisarNoticia(texto);
    });

    // ==========================================
    // BOTÃO NOVA ANÁLISE
    // ==========================================
    novoBtn.addEventListener('click', () => {
        textoInput.value = '';
        resultado.classList.add('hidden');
        feedbackArea.classList.add('hidden');
        feedbackCorrecao.classList.add('hidden');
        feedbackExplicacao.classList.add('hidden');
        feedbackObrigado.classList.add('hidden');
        audioBtn.disabled = true;
        document.getElementById('audioStatus').textContent = '🔇 Aguarde a análise';
        ultimaResposta = { texto: '', classificacao: '', confianca: 0, textoOriginal: '' };
        textoInput.focus();
    });

    // ==========================================
    // BOTÕES DE EXEMPLO
    // ==========================================
    exemploBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            textoInput.value = btn.dataset.texto;
            analisarNoticia(btn.dataset.texto);
        });
    });

    // ==========================================
    // TECLA ENTER (Ctrl+Enter)
    // ==========================================
    textoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            analisarBtn.click();
        }
    });
});
