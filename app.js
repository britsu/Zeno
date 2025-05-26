// Constantes e Variáveis Globais
const STORAGE_KEY = 'zeno-transactions';
const MONTHLY_GOAL = 500; // Meta mensal de economia em reais

// Elementos do DOM
const views = document.querySelectorAll('.view');
const navBtns = document.querySelectorAll('.nav-btn');
const dashboardView = document.getElementById('dashboard');
const addTransactionView = document.getElementById('add-transaction');
const statementView = document.getElementById('statement');

// Elementos do Dashboard
const totalBalanceEl = document.getElementById('total-balance');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const goalProgressEl = document.getElementById('goal-progress');
const goalTextEl = document.getElementById('goal-text');

// Elementos do Formulário
const transactionForm = document.getElementById('transaction-form');
const amountInput = document.getElementById('amount');
const typeSelect = document.getElementById('type');
const categorySelect = document.getElementById('category');
const dateInput = document.getElementById('date');
const descriptionInput = document.getElementById('description');

// Elementos do Extrato
const transactionsContainer = document.getElementById('transactions-container');
const filterTypeSelect = document.getElementById('filter-type');
const filterCategorySelect = document.getElementById('filter-category');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Configura data padrão para hoje
    dateInput.valueAsDate = new Date();
    
    // Carrega transações do localStorage
    loadTransactions();
    
    // Atualiza dashboard
    updateDashboard();
    
    // Atualiza extrato
    updateStatement();
    
    // Configura listeners
    setupEventListeners();
});

// Função para configurar event listeners
function setupEventListeners() {
    // Navegação entre views
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewId = btn.getAttribute('data-view');
            showView(viewId);
        });
    });
    
    // Formulário de transação
    transactionForm.addEventListener('submit', handleAddTransaction);
    
    // Filtros do extrato
    filterTypeSelect.addEventListener('change', updateStatement);
    filterCategorySelect.addEventListener('change', updateStatement);
}

// Função para alternar entre views
function showView(viewId) {
    views.forEach(view => view.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    navBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.nav-btn[data-view="${viewId}"]`).classList.add('active');
}

// Função para carregar transações do localStorage
function loadTransactions() {
    const transactionsJSON = localStorage.getItem(STORAGE_KEY);
    return transactionsJSON ? JSON.parse(transactionsJSON) : [];
}

// Função para salvar transações no localStorage
function saveTransactions(transactions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// Função para adicionar nova transação
function handleAddTransaction(e) {
    e.preventDefault();
    
    const transaction = {
        id: Date.now().toString(),
        amount: parseFloat(amountInput.value),
        type: typeSelect.value,
        category: categorySelect.value,
        date: dateInput.value,
        description: descriptionInput.value || 'Sem descrição'
    };
    
    // Validação
    if (!transaction.amount || !transaction.type || !transaction.category || !transaction.date) {
        alert('Por favor, preencha todos os campos obrigatórios!');
        return;
    }
    
    // Adiciona transação
    const transactions = loadTransactions();
    transactions.push(transaction);
    saveTransactions(transactions);
    
    // Limpa formulário
    transactionForm.reset();
    dateInput.valueAsDate = new Date();
    
    // Atualiza UI
    updateDashboard();
    updateStatement();
    
    // Mostra dashboard
    showView('dashboard');
    
    // Feedback visual
    alert('Transação adicionada com sucesso!');
}

// Função para atualizar o dashboard
function updateDashboard() {
    const transactions = loadTransactions();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Filtra transações do mês atual
    const monthlyTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
    });
    
    // Calcula totais
    const income = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expense;
    const savings = income > expense ? income - expense : 0;
    const goalPercentage = Math.min((savings / MONTHLY_GOAL) * 100, 100);
    
    // Atualiza UI
    totalBalanceEl.textContent = `R$ ${balance.toFixed(2)}`;
    totalIncomeEl.textContent = `R$ ${income.toFixed(2)}`;
    totalExpenseEl.textContent = `R$ ${expense.toFixed(2)}`;
    goalProgressEl.style.width = `${goalPercentage}%`;
    goalTextEl.textContent = `R$ ${savings.toFixed(2)} de R$ ${MONTHLY_GOAL.toFixed(2)}`;
    
    // Ajusta cor do saldo
    totalBalanceEl.style.color = balance >= 0 ? 'var(--income)' : 'var(--expense)';
}

// Função para atualizar o extrato
function updateStatement() {
    const transactions = loadTransactions();
    const filterType = filterTypeSelect.value;
    const filterCategory = filterCategorySelect.value;
    
    // Filtra transações
    let filteredTransactions = [...transactions];
    
    if (filterType !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === filterType);
    }
    
    if (filterCategory !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.category === filterCategory);
    }
    
    // Ordena por data (mais recente primeiro)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Atualiza UI
    renderTransactions(filteredTransactions);
}

// Função para renderizar transações no extrato
function renderTransactions(transactions) {
    if (transactions.length === 0) {
        transactionsContainer.innerHTML = '<p class="empty-message">Nenhuma transação encontrada com os filtros atuais.</p>';
        return;
    }
    
    transactionsContainer.innerHTML = '';
    
    transactions.forEach(transaction => {
        const transactionEl = document.createElement('div');
        transactionEl.className = `transaction ${transaction.type}`;
        
        transactionEl.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-description">${transaction.description}</div>
                <div class="transaction-category">${formatCategory(transaction.category)}</div>
            </div>
            <div class="transaction-date">${formatDate(transaction.date)}</div>
            <div class="transaction-amount">R$ ${transaction.amount.toFixed(2)}</div>
            <button class="delete-btn" data-id="${transaction.id}">×</button>
        `;
        
        transactionsContainer.appendChild(transactionEl);
    });
    
    // Adiciona listeners para botões de deletar
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            deleteTransaction(id);
        });
    });
}

// Função para deletar transação
function deleteTransaction(id) {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    
    const transactions = loadTransactions();
    const updatedTransactions = transactions.filter(t => t.id !== id);
    saveTransactions(updatedTransactions);
    
    updateDashboard();
    updateStatement();
}

// Funções auxiliares
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function formatCategory(category) {
    const categories = {
        'salario': 'Salário',
        'freelance': 'Freelance',
        'investimentos': 'Investimentos',
        'alimentacao': 'Alimentação',
        'transporte': 'Transporte',
        'lazer': 'Lazer',
        'moradia': 'Moradia',
        'outros': 'Outros'
    };
    return categories[category] || category;
}