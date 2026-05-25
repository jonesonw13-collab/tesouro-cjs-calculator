# Simulador IPCA+ CJS - Tesouro Direto

## 🎯 Funcionalidades

### 👥 Gerenciamento de Investidores
- Criar, editar e remover investidores
- Dados: Nome, CPF/CNPJ, E-mail, Telefone, Banco, Profissão
- Abas separadas para cada investidor
- Armazenamento em localStorage

### 💰 Registros de Aportes
- **Títulos suportados**: IPCA+ 2037, IPCA+ 2045, IPCA+ 2060
- **Data do aporte**: Formato completo dd/mm/aaaa com máscara automática
- **Preço unitário**: Valor do título no dia da compra
- **Quantidade**: Número de unidades adquiridas
- **Taxa**: IPCA+ acrescida de taxa fixa (% a.a.)
- **VNA**: Valor Nominal Atualizado calculado automaticamente
- **IR**: Taxa de imposto de renda retido na fonte (15% padrão, editável)
- **Editar/deletar**: Botões individuais por aporte

### 📊 Cálculo de Cupons Semestrais

#### Calendário de Cupons:
- **15/08/2026**: Primeiro cupom IPCA+ 2060
- **15/11/2026**: Primeiros cupons IPCA+ 2037 e IPCA+ 2045
- **Sequência**: A cada 6 meses automaticamente até vencimento

#### Cálculos por Cupom:
- **Cupom Bruto** = Valor Aportado × (Taxa / 2)
- **IR Retido** = Cupom Bruto × 15%
- **Cupom Líquido** = Cupom Bruto - IR

### 📈 Projeção e Análise
- Tabela de cupons por título com datas completas
- Resumo geral do patrimônio do investidor
- Métricas: Total aportado, cupons acumulados, patrimônio total
- Cálculo automático de rentabilidade

### 🔗 Integração com API
- Status de conexão em tempo real com tesouro.gov.br
- Verificação a cada 30 segundos
- Funcionamento offline com dados locais

## 📜 Lei de Postel

O simulador segue o princípio da Lei de Postel:
- **Liberal ao aceitar**: Aceita diversos formatos de entrada
- **Conservador ao enviar**: Valida e formata todos os dados corretamente
- **Máscara automática**: Datas preenchidas automaticamente
- **Cálculos robustos**: Todos os valores com 2 casas decimais

## 💾 Armazenamento

Todos os dados são salvos automaticamente em localStorage do navegador:
```javascript
{
  investidores: {
    "id_unico": {
      nome, cpf, email, telefone, banco, profissao, notas,
      aportes: {
        "id_aporte": {
          titulo, dataAporte, precoUnitario, quantidade, valorTotal,
          taxa, vna, ir, cupons: []
        }
      }
    }
  },
  investidorAtivo: "id_unico"
}
```

## 🚀 Como Usar

1. **Criar Investidor**: Clique em "➕ Novo"
2. **Preencher dados**: Nome, CPF/CNPJ, E-mail, etc
3. **Salvar**: Clique em "💾 Salvar"
4. **Adicionar Aporte**: Clique em "➕ Adicionar Aporte"
5. **Preencher dados do aporte**:
   - Selecione o título
   - Data do aporte (dd/mm/aaaa)
   - Preço unitário
   - Quantidade
   - Taxa
   - VNA
6. **Visualizar cupons**: Tabela automática com todos os cupons semestrais

## 📋 Títulos Suportados

| Título | Vencimento | 1º Cupom | Periodicidade |
|--------|-----------|---------|---------------|
| IPCA+ 2037 | 15/04/2037 | 15/11/2026 | Semestral |
| IPCA+ 2045 | 15/05/2045 | 15/11/2026 | Semestral |
| IPCA+ 2060 | 15/08/2060 | 15/08/2026 | Semestral |

## 🔧 Fórmulas

### VNA (Valor Nominal Atualizado)
```
VNA = Preço Unitário × Fator de Atualização IPCA
(Simplificado: VNA ≈ Preço Unitário)
```

### Cupom Semestral
```
Taxa Semestral = Taxa a.a. / 2
Cupom Bruto = Valor Aportado × Taxa Semestral
IR = Cupom Bruto × 15%
Cupom Líquido = Cupom Bruto - IR
```

### Patrimônio
```
Patrimônio = Principal Aportado + Cupons Acumulados
Rentabilidade % = (Cupons Acumulados / Principal) × 100
```

## 📱 Responsividade

- Design adaptável para mobile
- Abas de investidores com scroll horizontal
- Tabelas responsivas com overflow
- Modals otimizados para telas pequenas

## 🎨 Design

- Tema futurista: Preto + Vermelho
- Gradientes modernos
- Efeitos de glow nas seções ativas
- Animações suaves
- Cores: 
  - #ff0000 (Vermelho principal)
  - #000000 (Preto background)
  - #00ff00 (Valores positivos)
  - #ff6666 (Valores negativos)

## ⚠️ Observações Importantes

- Dados armazenados localmente (não sincroniza entre dispositivos)
- IPCA futuro é estimado
- Valores em Reais (R$)
- Taxa de IR de 15% é a máxima para CJS (regressiva por tempo)
- Consulte tesouro.gov.br para dados oficiais

## 📞 Suporte

Para dúvidas sobre Tesouro Direto:
- Site: https://www.tesouro.gov.br
- API: https://www.tesourotransparente.gov.br/api

---

**Desenvolvido com ❤️ | 2025**