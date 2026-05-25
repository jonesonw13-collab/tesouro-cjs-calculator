// ============================================================
// SIMULADOR TESOURO DIRETO IPCA+ CJS
// Lei de Postel: Be liberal in what you accept, conservative in what you send
// ============================================================

// CONFIGURAÇÕES
const CONFIG = {
    titleDates: {
        IPCA2037: '15/04/2037',
        IPCA2045: '15/05/2045',
        IPCA2060: '15/08/2060'
    },
    cupomSchedule: {
        // Primeiros cupons pagos em 2026
        'IPCA2060': '15/08/2026',
        'IPCA2037': '15/11/2026',
        'IPCA2045': '15/11/2026'
    },
    apiEndpoints: {
        precos: 'https://www.tesourotransparente.gov.br/api/ConsultarTituloPublico',
        vnageral: 'https://www.tesourotransparente.gov.br/api/ConsultarValorNominalAtualizadoGeral'
    }
};

// DADOS GLOBAIS
let dados = {
    investidores: {},
    investidorAtivo: null
};

// ============================================================
// FUNÇÕES DE UTILIDADE
// ============================================================

function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatarData(data) {
    if (!data) return '';
    if (typeof data === 'string') return data;
    const d = new Date(data);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function parseData(dataStr) {
    if (!dataStr) return null;
    const [dia, mes, ano] = dataStr.split('/');
    return new Date(ano, mes - 1, dia);
}

function adicionarMeses(data, meses) {
    const novaData = new Date(data);
    novaData.setMonth(novaData.getMonth() + meses);
    return novaData;
}

function mascaraData(input) {
    input.addEventListener('keyup', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        if (value.length >= 5) {
            value = value.slice(0, 5) + '/' + value.slice(5, 9);
        }
        e.target.value = value;
    });
}

function formatarMoeda(valor) {
    return 'R$ ' + valor.toFixed(2).replace('.', ',');
}

function mostrarMensagem(texto, tipo) {
    const msg = document.getElementById('globalMessage');
    msg.textContent = texto;
    msg.className = 'message ' + tipo;
    setTimeout(() => msg.className = 'message', 3000);
}

// ============================================================
// FUNÇÕES DE API - TESOURO.GOV.BR
// ============================================================

async function verificarAPITesouro() {
    try {
        const response = await fetch('https://www.tesourotransparente.gov.br/api/ConsultarValorNominalAtualizadoGeral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "d": "" })
        });
        
        if (response.ok) {
            atualizarStatusAPI(true);
            return true;
        }
    } catch (e) {
        console.log('API Tesouro indisponível:', e.message);
    }
    
    atualizarStatusAPI(false);
    return false;
}

function atualizarStatusAPI(online) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    
    if (online) {
        dot.className = 'status-indicator online';
        text.textContent = '✓ API tesouro.gov.br Conectada';
    } else {
        dot.className = 'status-indicator offline';
        text.textContent = '✗ API Offline - Usando dados locais';
    }
}

// ============================================================
// CÁLCULOS FINANCEIROS
// ============================================================

function calcularVNA(precoUnitario, quantidade) {
    // VNA = Valor Nominal Atualizado por unidade
    // Simplificado: VNA = Preço Unitário (em produção seria ajustado por IPCA)
    return precoUnitario;
}

function calcularCupomsSemestrais(dataAporte, titulo, valorTotal, taxa, vna) {
    const cupons = [];
    const dataAp = parseData(dataAporte);
    const primeiroData = parseData(CONFIG.cupomSchedule[titulo]);
    
    if (!dataAp || !primeiroData) return cupons;
    
    let dataCupom = new Date(primeiroData);
    const dataVencimento = parseData(CONFIG.titleDates[titulo]);
    let sequencia = 1;
    
    while (dataCupom <= dataVencimento) {
        if (dataCupom > dataAp) {
            const taxaSemestral = taxa / 2 / 100;
            const cupomBruto = valorTotal * taxaSemestral;
            
            cupons.push({
                numero: sequencia,
                data: formatarData(dataCupom),
                dataObj: new Date(dataCupom),
                cupomBruto: cupomBruto,
                ir: cupomBruto * 0.15,
                cupomLiquido: cupomBruto * 0.85
            });
            
            sequencia++;
        }
        
        dataCupom = adicionarMeses(dataCupom, 6);
    }
    
    return cupons;
}

function calcularPatrimonio(aporte) {
    const totalCupons = aporte.cupons.reduce((sum, c) => sum + c.cupomLiquido, 0);
    return {
        principal: aporte.valorTotal,
        cuponsAcumulados: totalCupons,
        patrimonio: aporte.valorTotal + totalCupons
    };
}

// ============================================================
// GERENCIAMENTO DE INVESTIDORES
// ============================================================

function abrirModalNovoInvestidor() {
    document.getElementById('nomeInvestidor').value = '';
    document.getElementById('cpfInvestidor').value = '';
    document.getElementById('emailInvestidor').value = '';
    document.getElementById('telefoneInvestidor').value = '';
    document.getElementById('bancoInvestidor').value = '';
    document.getElementById('profissaoInvestidor').value = '';
    document.getElementById('notasInvestidor').value = '';
    
    document.getElementById('formInvestidor').dataset.editandoId = '';
    document.getElementById('modalTitle').textContent = 'Novo Investidor';
    document.getElementById('modalInvestidor').classList.add('show');
}

function abrirModalEditarInvestidor(id) {
    const inv = dados.investidores[id];
    if (!inv) return;
    
    document.getElementById('nomeInvestidor').value = inv.nome;
    document.getElementById('cpfInvestidor').value = inv.cpf;
    document.getElementById('emailInvestidor').value = inv.email;
    document.getElementById('telefoneInvestidor').value = inv.telefone || '';
    document.getElementById('bancoInvestidor').value = inv.banco || '';
    document.getElementById('profissaoInvestidor').value = inv.profissao || '';
    document.getElementById('notasInvestidor').value = inv.notas || '';
    
    document.getElementById('formInvestidor').dataset.editandoId = id;
    document.getElementById('modalTitle').textContent = 'Editar Investidor';
    document.getElementById('modalInvestidor').classList.add('show');
}

function fecharModal() {
    document.getElementById('modalInvestidor').classList.remove('show');
}

function salvarInvestidor(e) {
    e.preventDefault();
    
    const editandoId = document.getElementById('formInvestidor').dataset.editandoId;
    const id = editandoId || gerarId();
    
    dados.investidores[id] = {
        id: id,
        nome: document.getElementById('nomeInvestidor').value,
        cpf: document.getElementById('cpfInvestidor').value,
        email: document.getElementById('emailInvestidor').value,
        telefone: document.getElementById('telefoneInvestidor').value,
        banco: document.getElementById('bancoInvestidor').value,
        profissao: document.getElementById('profissaoInvestidor').value,
        notas: document.getElementById('notasInvestidor').value,
        aportes: dados.investidores[id]?.aportes || {}
    };
    
    dados.investidorAtivo = id;
    fecharModal();
    salvarNoLocalStorage();
    renderizar();
    mostrarMensagem(editandoId ? '✓ Investidor atualizado!' : '✓ Investidor criado!', 'success');
}

function removerInvestidor(id) {
    if (confirm('Tem certeza que deseja remover este investidor?')) {
        delete dados.investidores[id];
        if (dados.investidorAtivo === id) {
            dados.investidorAtivo = Object.keys(dados.investidores)[0] || null;
        }
        salvarNoLocalStorage();
        renderizar();
        mostrarMensagem('✓ Investidor removido!', 'success');
    }
}

// ============================================================
// GERENCIAMENTO DE APORTES
// ============================================================

function abrirModalAporte(id) {
    document.getElementById('tituloAporte').value = '';
    document.getElementById('dataAporte').value = '';
    document.getElementById('precoUnitario').value = '';
    document.getElementById('quantidade').value = '';
    document.getElementById('taxaAporte').value = '';
    document.getElementById('vnaInfo').value = '';
    document.getElementById('irInfo').value = '15';
    
    document.getElementById('formAporte').dataset.investidorId = id;
    document.getElementById('formAporte').dataset.aporteId = '';
    document.getElementById('modalAporteTitle').textContent = 'Novo Aporte';
    document.getElementById('modalAporte').classList.add('show');
    
    mascaraData(document.getElementById('dataAporte'));
}

function abrirModalEditarAporte(investidorId, aporteId) {
    const aporte = dados.investidores[investidorId].aportes[aporteId];
    if (!aporte) return;
    
    document.getElementById('tituloAporte').value = aporte.titulo;
    document.getElementById('dataAporte').value = aporte.dataAporte;
    document.getElementById('precoUnitario').value = aporte.precoUnitario.toFixed(2);
    document.getElementById('quantidade').value = aporte.quantidade;
    document.getElementById('taxaAporte').value = aporte.taxa.toFixed(2);
    document.getElementById('vnaInfo').value = aporte.vna.toFixed(2);
    document.getElementById('irInfo').value = aporte.ir.toFixed(2);
    
    document.getElementById('formAporte').dataset.investidorId = investidorId;
    document.getElementById('formAporte').dataset.aporteId = aporteId;
    document.getElementById('modalAporteTitle').textContent = 'Editar Aporte';
    document.getElementById('modalAporte').classList.add('show');
}

function fecharModalAporte() {
    document.getElementById('modalAporte').classList.remove('show');
}

function atualizarInfoTitulo() {
    const titulo = document.getElementById('tituloAporte').value;
    const dataAtualizada = CONFIG.titleDates[titulo];
    if (dataAtualizada) {
        // Pode mostrar info do título se necessário
    }
}

function salvarAporte(e) {
    e.preventDefault();
    
    const investidorId = document.getElementById('formAporte').dataset.investidorId;
    const aporteId = document.getElementById('formAporte').dataset.aporteId;
    const novoAporteId = aporteId || gerarId();
    
    const precoUnitario = parseFloat(document.getElementById('precoUnitario').value);
    const quantidade = parseInt(document.getElementById('quantidade').value);
    const valorTotal = precoUnitario * quantidade;
    const taxa = parseFloat(document.getElementById('taxaAporte').value);
    const vna = parseFloat(document.getElementById('vnaInfo').value);
    const titulo = document.getElementById('tituloAporte').value;
    const dataAporte = document.getElementById('dataAporte').value;
    const ir = parseFloat(document.getElementById('irInfo').value) || 15;
    
    const cupons = calcularCupomsSemestrais(dataAporte, titulo, valorTotal, taxa, vna);
    
    dados.investidores[investidorId].aportes[novoAporteId] = {
        id: novoAporteId,
        titulo: titulo,
        dataAporte: dataAporte,
        precoUnitario: precoUnitario,
        quantidade: quantidade,
        valorTotal: valorTotal,
        taxa: taxa,
        vna: vna,
        ir: ir,
        cupons: cupons,
        dataCriacao: new Date().toISOString()
    };
    
    fecharModalAporte();
    salvarNoLocalStorage();
    renderizar();
    mostrarMensagem(aporteId ? '✓ Aporte atualizado!' : '✓ Aporte registrado!', 'success');
}

function removerAporte(investidorId, aporteId) {
    if (confirm('Remover este aporte?')) {
        delete dados.investidores[investidorId].aportes[aporteId];
        salvarNoLocalStorage();
        renderizar();
        mostrarMensagem('✓ Aporte removido!', 'success');
    }
}

// ============================================================
// RENDERIZAÇÃO
// ============================================================

function renderizar() {
    renderizarAbas();
    renderizarCards();
}

function renderizarAbas() {
    const container = document.getElementById('investorsTabsContainer');
    const botaoAdicionar = '<button class="btn-add-investor" onclick="abrirModalNovoInvestidor()">➕ Novo</button>';
    
    if (Object.keys(dados.investidores).length === 0) {
        container.innerHTML = botaoAdicionar;
        return;
    }
    
    let abas = '';
    Object.values(dados.investidores).forEach(inv => {
        const ativo = dados.investidorAtivo === inv.id ? 'active' : '';
        abas += `<button class="investor-tab ${ativo}" onclick="selecionarInvestidor('${inv.id}')" title="${inv.nome}">
            <span>${inv.nome.split(' ')[0]}</span>
        </button>`;
    });
    
    container.innerHTML = abas + botaoAdicionar;
}

function renderizarCards() {
    const container = document.getElementById('investorsContainer');
    
    if (!dados.investidorAtivo) {
        container.innerHTML = '<div class="no-data">Nenhum investidor criado. Clique em "Novo" para adicionar.</div>';
        return;
    }
    
    const inv = dados.investidores[dados.investidorAtivo];
    if (!inv) return;
    
    let html = renderizarCardInvestidor(inv);
    container.innerHTML = html;
}

function renderizarCardInvestidor(inv) {
    let aportesPorTitulo = {};
    Object.values(inv.aportes).forEach(aporte => {
        if (!aportesPorTitulo[aporte.titulo]) {
            aportesPorTitulo[aporte.titulo] = [];
        }
        aportesPorTitulo[aporte.titulo].push(aporte);
    });
    
    let totalAportado = 0;
    let totalCupons = 0;
    let totalPatrimonio = 0;
    
    Object.values(inv.aportes).forEach(aporte => {
        totalAportado += aporte.valorTotal;
        const cuponsLiquidos = aporte.cupons.reduce((sum, c) => sum + c.cupomLiquido, 0);
        totalCupons += cuponsLiquidos;
        totalPatrimonio += aporte.valorTotal + cuponsLiquidos;
    });
    
    let abas = '';
    let cards = '';
    
    ['IPCA2037', 'IPCA2045', 'IPCA2060'].forEach(titulo => {
        const ativo = Object.keys(aportesPorTitulo).length === 0 ? 'active' : (Object.keys(aportesPorTitulo)[0] === titulo ? 'active' : '');
        abas += `<button class="security-tab ${ativo}" onclick="selecionarTitulo('${inv.id}', '${titulo}')">${titulo}</button>`;
    });
    
    Object.entries(aportesPorTitulo).forEach(([titulo, aportes]) => {
        const ativo = Object.keys(aportesPorTitulo)[0] === titulo ? 'active' : '';
        
        let tabelaAportes = '';
        let tabelaCupons = '';
        let totalAportadoTitulo = 0;
        let totalCupomsTitulo = 0;
        
        aportes.forEach(aporte => {
            totalAportadoTitulo += aporte.valorTotal;
            const cuponsLiquidos = aporte.cupons.reduce((sum, c) => sum + c.cupomLiquido, 0);
            totalCupomsTitulo += cuponsLiquidos;
            
            tabelaAportes += `<tr>
                <td>${aporte.dataAporte}</td>
                <td>R$ ${aporte.precoUnitario.toFixed(2)}</td>
                <td>${aporte.quantidade}</td>
                <td>R$ ${aporte.valorTotal.toFixed(2)}</td>
                <td>${aporte.taxa.toFixed(2)}%</td>
                <td>R$ ${aporte.vna.toFixed(2)}</td>
                <td>
                    <button class="btn-edit btn-small" onclick="abrirModalEditarAporte('${inv.id}', '${aporte.id}')">✎</button>
                    <button class="btn-delete btn-small" onclick="removerAporte('${inv.id}', '${aporte.id}')">🗑</button>
                </td>
            </tr>`;
            
            aporte.cupons.forEach(cupom => {
                tabelaCupons += `<tr>
                    <td>${cupom.data}</td>
                    <td>R$ ${cupom.cupomBruto.toFixed(2)}</td>
                    <td>R$ ${cupom.ir.toFixed(2)}</td>
                    <td class="td-positive">R$ ${cupom.cupomLiquido.toFixed(2)}</td>
                </tr>`;
            });
        });
        
        const metricas = `
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-label">Aportado</div>
                    <div class="metric-value">R$ ${totalAportadoTitulo.toFixed(2)}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Cupons Líq.</div>
                    <div class="metric-value">R$ ${totalCupomsTitulo.toFixed(2)}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Patrimônio</div>
                    <div class="metric-value">R$ ${(totalAportadoTitulo + totalCupomsTitulo).toFixed(2)}</div>
                </div>
            </div>
        `;
        
        cards += `<div class="section" style="border-left: 4px solid #ff0000; padding-left: 15px;">
            <div class="section-title">${titulo} | Vencimento: ${CONFIG.titleDates[titulo]}</div>
            
            ${metricas}
            
            <div class="section-title" style="font-size: 14px; margin-top: 20px; border-left: 2px solid #ff3333;">APORTES</div>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Preço Unit.</th>
                            <th>Qtd</th>
                            <th>Valor Total</th>
                            <th>Taxa</th>
                            <th>VNA</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>${tabelaAportes}</tbody>
                </table>
            </div>
            
            <div class="section-title" style="font-size: 14px; margin-top: 20px; border-left: 2px solid #ff3333;">CUPONS SEMESTRAIS</div>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Data Cupom</th>
                            <th>Cupom Bruto</th>
                            <th>IR 15%</th>
                            <th>Cupom Líquido</th>
                        </tr>
                    </thead>
                    <tbody>${tabelaCupons || '<tr><td colspan="4" style="text-align:center; color:#888;">Sem cupons a receber</td></tr>'}</tbody>
                </table>
            </div>
        </div>`;
    });
    
    if (Object.keys(aportesPorTitulo).length === 0) {
        cards = '<div class="no-data">Nenhum aporte registrado para este investidor.</div>';
    }
    
    return `
        <div class="investor-card active">
            <div class="card-header">
                <div class="investor-info">
                    <div class="investor-name">${inv.nome}</div>
                    <div class="investor-contact">
                        ${inv.cpf ? `<div>CPF/CNPJ: ${inv.cpf}</div>` : ''}
                        ${inv.email ? `<div>E-mail: ${inv.email}</div>` : ''}
                        ${inv.telefone ? `<div>Tel: ${inv.telefone}</div>` : ''}
                        ${inv.profissao ? `<div>Profissão: ${inv.profissao}</div>` : ''}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-edit" onclick="abrirModalEditarInvestidor('${inv.id}')">✎ Editar</button>
                    <button class="btn-delete" onclick="removerInvestidor('${inv.id}')">🗑 Remover</button>
                </div>
            </div>
            
            <div class="section" style="margin-bottom: 0;">
                <div class="section-title">RESUMO GERAL</div>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-label">Total Aportado</div>
                        <div class="metric-value">R$ ${totalAportado.toFixed(2)}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Cupons Acum.</div>
                        <div class="metric-value">R$ ${totalCupons.toFixed(2)}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Patrimônio</div>
                        <div class="metric-value">R$ ${totalPatrimonio.toFixed(2)}</div>
                    </div>
                </div>
                
                <button class="btn-primary" onclick="abrirModalAporte('${inv.id}')" style="width: 100%; margin-top: 15px;">➕ Adicionar Aporte</button>
            </div>
        </div>
        
        <div style="margin-top: 30px;">
            <div class="securities-tabs" id="abas-titulos">${abas}</div>
            ${cards}
        </div>
    `;
}

function selecionarInvestidor(id) {
    dados.investidorAtivo = id;
    salvarNoLocalStorage();
    renderizar();
}

function selecionarTitulo(investidorId, titulo) {
    // Implementação para filtrar por título
    renderizar();
}

// ============================================================
// LOCAL STORAGE
// ============================================================

function salvarNoLocalStorage() {
    localStorage.setItem('simuladorCJS', JSON.stringify(dados));
}

function carregarDoLocalStorage() {
    const stored = localStorage.getItem('simuladorCJS');
    if (stored) {
        try {
            dados = JSON.parse(stored);
        } catch (e) {
            console.error('Erro ao carregar dados:', e);
            dados = { investidores: {}, investidorAtivo: null };
        }
    }
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    carregarDoLocalStorage();
    verificarAPITesouro();
    setInterval(() => verificarAPITesouro(), 30000);
    
    mascaraData(document.getElementById('dataAporte'));
    renderizar();
});