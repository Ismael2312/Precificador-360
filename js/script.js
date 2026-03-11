// MIT License

// Copyright (c) 2026 Ismael

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

const inputs = document.querySelectorAll('.no-print input, .no-print select');
    const toggleBtn = document.getElementById('theme-toggle');
    
    // Dark Mode LocalStorage
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });

    function atualizarVisual() {
        const tipo = document.getElementById('tipo_produto').value;
        document.getElementById('bloco_3d').classList.add('hidden');
        document.getElementById('bloco_fabricacao').classList.add('hidden');
        document.getElementById('bloco_revenda').classList.add('hidden');
        document.getElementById(`bloco_${tipo}`).classList.remove('hidden');

        const pagaImposto = document.getElementById('paga_imposto').value;
        document.getElementById('div_imposto').className = pagaImposto === 'sim' ? '' : 'hidden';
    }

    function calcularTudo() {
        const getVal = id => parseFloat(document.getElementById(id).value) || 0;
        
        const pagaImposto = document.getElementById('paga_imposto').value === 'sim';
        const aliquotaImposto = pagaImposto ? getVal('imposto') : 0;
        const tipoProduto = document.getElementById('tipo_produto').value;
        let custoBase = 0;

        if (tipoProduto === '3d') {
            const material = (getVal('preco_rolo') / getVal('peso_rolo')) * getVal('consumo_peca');
            const energia = (getVal('potencia') / 1000) * getVal('tempo') * getVal('kwh');
            custoBase = (material + energia) * (1 + (getVal('falha_3d') / 100));
        } else if (tipoProduto === 'fabricacao') {
            custoBase = getVal('custo_materiais_fab') + (getVal('tempo_fab') * getVal('hora_fab')) + getVal('insumos_fab');
        } else {
            custoBase = getVal('custo_compra') + getVal('frete_chegada') + getVal('taxa_alfandega');
        }
        
        const custoLogistico = getVal('custo_embalagem') + ((getVal('tempo_operador') / 60) * getVal('valor_hora'));
        const cpvFinal = custoBase + custoLogistico;

        const fator = 1 - (getVal('comissao')/100) - (aliquotaImposto/100) - (getVal('ads')/100) - (getVal('margem')/100);
        
        if (fator <= 0) {
            document.getElementById('msg_erro').style.display = 'block';
            document.getElementById('resultado_final').style.display = 'none';
        } else {
            document.getElementById('msg_erro').style.display = 'none';
            document.getElementById('resultado_final').style.display = 'block';

            const precoVenda = (cpvFinal + getVal('taxa_fixa') + getVal('frete')) / fator;
            const lucro = precoVenda * (getVal('margem')/100);
            const verbaAds = precoVenda * (getVal('ads')/100);
            const qtd = getVal('qtd_mensal');
            
            const formatar = num => `R$ ${num.toFixed(2).replace('.', ',')}`;
            
            document.getElementById('out_preco').innerText = formatar(precoVenda);
            document.getElementById('out_lucro').innerText = formatar(lucro);
            document.getElementById('out_custo_base').innerText = formatar(cpvFinal);
            document.getElementById('out_taxas_mk').innerText = formatar((precoVenda * getVal('comissao')/100) + getVal('taxa_fixa'));
            document.getElementById('out_verba_ads').innerText = formatar(verbaAds);
            
            document.getElementById('out_qtd_span').innerText = qtd;
            document.getElementById('proj_faturamento').innerText = formatar(precoVenda * qtd);
            document.getElementById('proj_lucro').innerText = formatar(lucro * qtd);

            const btn = document.getElementById('btn_salvar');
            btn.dataset.preco = precoVenda.toFixed(2);
            btn.dataset.lucroUnit = lucro.toFixed(2);
            btn.dataset.qtd = qtd;
            btn.dataset.lucroMensal = (lucro * qtd).toFixed(2);
        }
    }

    inputs.forEach(i => i.addEventListener('input', () => { atualizarVisual(); calcularTudo(); }));
    document.getElementById('plataforma').addEventListener('change', (e) => {
        const p = e.target.value;
        if(p === 'ml_classico'){ document.getElementById('comissao').value = 14; document.getElementById('taxa_fixa').value = 6; }
        else if(p === 'ml_premium'){ document.getElementById('comissao').value = 19; document.getElementById('taxa_fixa').value = 6; }
        else if(p === 'shopee'){ document.getElementById('comissao').value = 20; document.getElementById('taxa_fixa').value = 4; }
        calcularTudo();
    });

    // SISTEMA DE LISTA E DASHBOARD TOTAL
    let produtosSalvos = JSON.parse(localStorage.getItem('meusProdutosV8')) || [];

    function renderizarTabela() {
        const tbody = document.getElementById('corpo_tabela');
        tbody.innerHTML = '';
        
        let somaLucroTotalMensal = 0;

        if(produtosSalvos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding: 20px;">Nenhum produto cadastrado. Preencha os dados e clique em Salvar!</td></tr>';
        } else {
            produtosSalvos.forEach((prod, index) => {
                somaLucroTotalMensal += parseFloat(prod.lucroMensal);
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${prod.nome}</strong></td>
                    <td>${prod.plataforma}</td>
                    <td style="color:var(--accent); font-weight:bold;">R$ ${prod.preco.replace('.', ',')}</td>
                    <td>R$ ${prod.lucroUnit.replace('.', ',')}</td>
                    <td>${prod.qtd}</td>
                    <td style="color:var(--success); font-weight:bold;">R$ ${prod.lucroMensal.replace('.', ',')}</td>
                    <td class="no-print" style="text-align: center;"><button onclick="deletarProduto(${index})" style="background:#ef4444; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.9em;">Excluir</button></td>
                `;
                tbody.appendChild(tr);
            });
        }

        document.getElementById('dash_lucro_total').innerText = `R$ ${somaLucroTotalMensal.toFixed(2).replace('.', ',')}`;
    }

    document.getElementById('btn_salvar').addEventListener('click', () => {
        const nomeInput = document.getElementById('nome_produto').value.trim();
        if(!nomeInput) {
            alert('Por favor, digite um Nome para o Produto no topo da página!');
            document.getElementById('nome_produto').focus();
            return;
        }

        const btn = document.getElementById('btn_salvar');
        const selectPlat = document.getElementById('plataforma');
        
        // Abrevia nome da plataforma para caber melhor na tabela mobile
        let nomePlat = selectPlat.options[selectPlat.selectedIndex].text;
        if(nomePlat.includes('Mercado Livre')) nomePlat = nomePlat.replace('Mercado Livre', 'ML');

        const novoProduto = {
            nome: nomeInput,
            plataforma: nomePlat,
            preco: btn.dataset.preco,
            lucroUnit: btn.dataset.lucroUnit,
            qtd: btn.dataset.qtd,
            lucroMensal: btn.dataset.lucroMensal
        };

        produtosSalvos.push(novoProduto);
        localStorage.setItem('meusProdutosV8', JSON.stringify(produtosSalvos));
        renderizarTabela();
        document.getElementById('nome_produto').value = ''; 
    });

    window.deletarProduto = function(index) {
        if(confirm('Excluir este item do Dashboard?')) {
            produtosSalvos.splice(index, 1);
            localStorage.setItem('meusProdutosV8', JSON.stringify(produtosSalvos));
            renderizarTabela();
        }
    }

    // EXPORTAÇÃO EXCEL
    window.exportarExcel = function() {
        if(produtosSalvos.length === 0) { alert('Sua lista está vazia!'); return; }
        
        let csv = "Nome do Anuncio;Plataforma;Preco Venda (R$);Lucro Unit. (R$);Qtd Mensal;Lucro Total Projetado (R$)\n";
        produtosSalvos.forEach(p => {
            csv += `${p.nome};${p.plataforma};${p.preco.replace('.',',')};${p.lucroUnit.replace('.',',')};${p.qtd};${p.lucroMensal.replace('.',',')}\n`;
        });

        const blob = new Blob(["\ufeff", csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "Relatorio_Dash_Negocio.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Inicialização
    atualizarVisual();
    calcularTudo();
    renderizarTabela();