const API_URL = 'http://localhost:3000/api';

function getToken() {
    return localStorage.getItem('authToken');
}

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

export async function fetchBudgets() {
    const response = await fetch(`${API_URL}/budgets`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch budgets');
    return response.json();
}

export async function createBudget(budget) {
    const response = await fetch(`${API_URL}/budgets`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(budget)
    });
    if (!response.ok) throw new Error('Failed to create budget');
    return response.json();
}

export async function deleteBudget(id) {
    const response = await fetch(`${API_URL}/budgets/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete budget');
    return response.json();
}

export async function fetchExpenses() {
    const response = await fetch(`${API_URL}/expenses`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch expenses');
    return response.json();
}

export async function createExpense(expense) {
    const response = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(expense)
    });
    if (!response.ok) throw new Error('Failed to create expense');
    return response.json();
}

export async function deleteExpense(id) {
    const response = await fetch(`${API_URL}/expenses/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete expense');
    return response.json();
}

export async function fetchIncome(type = null) {
    const url = type ? `${API_URL}/income?type=${type}` : `${API_URL}/income`;
    const response = await fetch(url, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch income');
    return response.json();
}

export async function createIncome(income) {
    const response = await fetch(`${API_URL}/income`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(income)
    });
    if (!response.ok) throw new Error('Failed to create income');
    return response.json();
}

export async function deleteIncome(id) {
    const response = await fetch(`${API_URL}/income/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete income');
    return response.json();
}