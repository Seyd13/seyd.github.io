import { supabase } from "./supabase.js";

export async function checkAuthAndShowPopup() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return await showAuthPopup();
    return true;
}

export async function showAuthPopup() {
    return new Promise(resolve => {
        const authPopup = document.createElement('div');
        authPopup.className = 'auth-popup';

        const loginButton = document.createElement('button');
        loginButton.textContent = 'Войти';
        loginButton.className = 'login';

        const registerButton = document.createElement('button');
        registerButton.textContent = 'Зарегистрироваться';
        registerButton.className = 'register';

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Закрыть';
        closeButton.className = 'close';
        closeButton.addEventListener('click', () => {
            authPopup.remove();
            resolve(false);
        });

        authPopup.appendChild(loginButton);
        authPopup.appendChild(registerButton);
        authPopup.appendChild(closeButton);
        document.body.appendChild(authPopup);

        loginButton.addEventListener('click', () => showLoginForm(authPopup, resolve));
        registerButton.addEventListener('click', () => showRegisterForm(authPopup, resolve));
    });
}

function showLoginForm(authPopup, resolve) {
    authPopup.innerHTML = '';

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'Email';

    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Password';

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Войти';
    submitButton.className = 'login';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Закрыть';
    closeButton.className = 'close';
    closeButton.addEventListener('click', () => {
        authPopup.remove();
        resolve(false);
    });

    authPopup.appendChild(emailInput);
    authPopup.appendChild(passwordInput);
    authPopup.appendChild(submitButton);
    authPopup.appendChild(closeButton);

    submitButton.addEventListener('click', async () => {
        const { error } = await supabase.auth.signInWithPassword({ email: emailInput.value, password: passwordInput.value });
        if (error) alert('Ошибка входа: ' + error.message);
        else {
            authPopup.remove();
            resolve(true);
            // Обновляем информацию о пользователе после успешной авторизации
            window.dispatchEvent(new Event('authChange'));
        }
    });
}

function showRegisterForm(authPopup, resolve) {
    authPopup.innerHTML = '';

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'Email';

    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Password';

    const displayNameInput = document.createElement('input');
    displayNameInput.type = 'text';
    displayNameInput.placeholder = 'Display Name';

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Зарегистрироваться';
    submitButton.className = 'register';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Закрыть';
    closeButton.className = 'close';
    closeButton.addEventListener('click', () => {
        authPopup.remove();
        resolve(false);
    });

    authPopup.appendChild(emailInput);
    authPopup.appendChild(passwordInput);
    authPopup.appendChild(displayNameInput);
    authPopup.appendChild(submitButton);
    authPopup.appendChild(closeButton);

    submitButton.addEventListener('click', async () => {
        const { data, error } = await supabase.auth.signUp({ email: emailInput.value, password: passwordInput.value });
        if (error) alert('Ошибка регистрации: ' + error.message);
        else {
            // Сохраняем display_name в таблицу profiles
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{ id: data.user.id, display_name: displayNameInput.value }]);

            if (profileError) alert('Ошибка сохранения имени: ' + profileError.message);
            else {
                const { error: loginError } = await supabase.auth.signInWithPassword({ email: emailInput.value, password: passwordInput.value });
                if (loginError) alert('Ошибка входа после регистрации: ' + loginError.message);
                else {
                    authPopup.remove();
                    resolve(true);
                    // Обновляем информацию о пользователе после успешной регистрации и входа
                    window.dispatchEvent(new Event('authChange'));
                }
            }
        }
    });
}

export async function logout() {
    await supabase.auth.signOut();
    alert('Вы вышли из аккаунта. Пожалуйста, войдите снова.');
    document.getElementById('logoutButton').style.display = 'none';
    document.getElementById('accountInfo').style.display = 'none';
    // Обновляем информацию о пользователе после выхода
    window.dispatchEvent(new Event('authChange'));
}