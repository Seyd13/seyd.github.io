import { supabase } from "./supabase.js";

// Функция для проверки авторизации и отображения окна входа
export async function checkAuthAndShowPopup() {
    const { data: { user } } = await supabase.auth.getUser(); // Исправлено: используем getUser()
    if (!user) {
        return await showAuthPopup();
    }
    return true;
}

// Функция для отображения окна входа/регистрации
export async function showAuthPopup() {
    return new Promise((resolve) => {
        const authPopup = document.createElement('div');
        authPopup.className = 'auth-popup';

        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.placeholder = 'Email';

        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.placeholder = 'Password';

        const loginButton = document.createElement('button');
        loginButton.textContent = 'Войти';
        loginButton.className = 'login';

        const registerButton = document.createElement('button');
        registerButton.textContent = 'Зарегистрироваться';
        registerButton.className = 'register';

        authPopup.appendChild(emailInput);
        authPopup.appendChild(passwordInput);
        authPopup.appendChild(loginButton);
        authPopup.appendChild(registerButton);

        document.body.appendChild(authPopup);

        loginButton.addEventListener('click', async () => {
            const { error } = await supabase.auth.signInWithPassword({
                email: emailInput.value,
                password: passwordInput.value
            });
            if (error) {
                alert('Ошибка входа: ' + error.message);
            } else {
                authPopup.remove();
                resolve(true);
            }
        });

        registerButton.addEventListener('click', async () => {
            const { data, error } = await supabase.auth.signUp({
                email: emailInput.value,
                password: passwordInput.value
            });
            if (error) {
                alert('Ошибка регистрации: ' + error.message);
            } else {
                // Автоматический вход после регистрации
                const { error: loginError } = await supabase.auth.signInWithPassword({
                    email: emailInput.value,
                    password: passwordInput.value
                });
                if (loginError) {
                    alert('Ошибка входа после регистрации: ' + loginError.message);
                } else {
                    authPopup.remove();
                    resolve(true);
                }
            }
        });
    });
}

// Функция для выхода из аккаунта
export async function logout() {
    await supabase.auth.signOut();
    alert('Вы вышли из аккаунта. Пожалуйста, войдите снова.');
    document.getElementById('logoutButton').style.display = 'none'; // Скрываем кнопку выхода
}