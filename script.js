// ==========================================
// VARIÁVEL DA API (CONECTADA À SUA IA)
// ==========================================
const API_URL = 'https://vancer.pythonanywhere.com';

// ==========================================
// VARIÁVEL PARA ARMAZENAR A ÚLTIMA RESPOSTA
// ==========================================
let ultimaResposta = {
    texto: '',
    classificacao: '',
    confianca: 0
};

// ==========================================
// FUNÇÃO DE ÁUDIO (LEITURA EM VOZ ALTA)
// ==========================================
function falar(texto) {
    // Verifica se o navegador suporta Speech Synthesis
    if ('speechSynthesis' in window) {
        // Para qualquer fala anterior
        window.speechSynthesis.cancel();
        
        // Cria a fala
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'pt-BR';           // Português do Brasil
        utterance.rate = 0.9;               // Velocidade (0.9 = mais lento, 1 = normal)
        utterance.pitch = 1.0;              // Tom de voz
        utterance.volume = 1.0;             // Volume máximo
        
        // Fala!
        window.speechSynthesis.speak(utterance);
        
        document.getElementById('audioStatus').textContent = '🔊 Falando...';
        document.getElementById('audioStatus').style.color = '#28a745';
        
        // Quando terminar de falar, volta ao normal
        utterance.onend = function() {
            document.getElementById('audioStatus').textContent = '✅ Áudio finalizado';
            document.getElementById('audioStatus').style.color = '#495057';
            setTimeout(() => {
                document.getElementById('audioStatus').textContent = '🔊 Clique para ouvir novamente';
                document.getElementById('audioStatus').style.color = '#495057';
            }, 3000);
        };
        
        // Se der erro
        utterance.onerror = function() {
            document.getElementById('audioStatus').textContent = '❌ Erro no áudio';
            document.getElementById('audioStatus').style.color = '#dc3545';
        };
        
    } else {
        alert('❌ Seu navegador não suporta a função de áudio. Use Chrome, Edge ou Safari.');
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

    // ==========================================
    // ANALISAR NOTÍCIA (COM IA DE VERDADE!)
    // ==========================================
    async function analisarNoticia(texto) {
        loading.classList.remove('hidden');
        resultado.classList.add('hidden');
        analisarBtn.disabled = true;
        audioBtn.disabled = true;
        document.getElementById('audioStatus').textContent = '⏳ Analisando...';

        try {
            // ==========================================
            // CHAMA A IA NO PYTHONANYWHERE
            // ==========================================
            const response = await fetch(`${API_URL}/analisar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ texto: texto })
            });

            if (!response.ok) {
                throw new Error('Erro na análise');
            }

            const data = await response.json();
            
            // Verifica se a IA retornou erro
            if (data.erro) {
                throw new Error(data.erro);
            }
            
            // Guarda a resposta para o áudio
            ultimaResposta = {
                texto: data.explicacao || 'Análise concluída.',
                classificacao: data.classificacao || 'Duvidosa',
                confianca: data.confianca || 0
            };
            
            exibirResultado(data);

        } catch (error) {
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
        const explicacaoDiv = document.getElementById('explicacao');
        const dicasDiv = document.getElementById('dicas');

        const classe = data.classificacao ? data.classificacao.toLowerCase() : 'duvidosa';
        const emoji = data.classificacao === 'Verdadeira' ? '✅' : data.classificacao === 'Falsa' ? '❌' : '⚠️';
        
        classificacaoDiv.textContent = `${emoji} ${data.classificacao || 'Duvidosa'}`;
        classificacaoDiv.className = `classificacao-${classe}`;
        confiancaDiv.textContent = `🎯 Confiança: ${data.confianca || 0}%`;
        explicacaoDiv.textContent = data.explicacao || 'Análise concluída.';

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

        // Mostra se leu uma URL
        if (data.url_lida) {
            const urlDiv = document.getElementById('analise_url');
            if (urlDiv) {
                urlDiv.textContent = `🔗 URL lida: ${data.url_lida}`;
                urlDiv.style.display = 'block';
            }
        }

        // Habilita o botão de áudio e atualiza status
        audioBtn.disabled = false;
        document.getElementById('audioStatus').textContent = '🔊 Clique para ouvir a resposta';
        document.getElementById('audioStatus').style.color = '#28a745';

        resultado.classList.remove('hidden');
        resultado.scrollIntoView({ behavior: 'smooth' });
    }

    // ==========================================
    // BOTÃO DE ÁUDIO - LÊ A RESPOSTA
    // ==========================================
    audioBtn.addEventListener('click', () => {
        if (ultimaResposta.texto) {
            // Monta a frase completa com a classificação
            const frase = `A notícia analisada é ${ultimaResposta.classificacao} com ${ultimaResposta.confianca} por cento de confiança. ${ultimaResposta.texto}`;
            falar(frase);
        } else {
            alert('⚠️ Nenhuma análise disponível. Analise uma notícia primeiro.');
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
        audioBtn.disabled = true;
        document.getElementById('audioStatus').textContent = '🔇 Aguarde a análise';
        document.getElementById('audioStatus').style.color = '#495057';
        ultimaResposta = { texto: '', classificacao: '', confianca: 0 };
        
        // Esconde a URL lida
        const urlDiv = document.getElementById('analise_url');
        if (urlDiv) {
            urlDiv.style.display = 'none';
        }
        
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
    // TECLA ENTER (Ctrl + Enter) PARA ANALISAR
    // ==========================================
    textoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            analisarBtn.click();
        }
    });
});
