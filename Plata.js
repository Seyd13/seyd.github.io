// Заглушка для режима тестирования
const isTesting = true; // Установите в false, когда будете готовы использовать реальные платежи

export async function initiatePayment(userId, category, amount) {
    if (isTesting) {
        console.log(`Тестовый режим: Платеж на сумму ${amount} RUB для категории ${category} пропущен.`);
        return true; // Симулируем успешный платеж
    }

    const SHOP_ID = import.meta.env.VITE_YKASSA_SHOP_ID;
    const SECRET_KEY = import.meta.env.VITE_YKASSA_SECRET_KEY;

    if (!SHOP_ID || !SECRET_KEY) {
        throw new Error('Платежная система не настроена');
    }

    try {
        const response = await fetch('https://api.yookassa.ru/v3/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(`${SHOP_ID}:${SECRET_KEY}`),
                'Idempotency-Key': `${userId}-${Date.now()}`
            },
            body: JSON.stringify({
                amount: { value: amount.toFixed(2), currency: 'RUB' },
                confirmation: { type: 'redirect', return_url: window.location.href },
                description: `Оплата за публикацию в категории ${category}`,
                metadata: { user_id: userId, category }
            })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const payment = await response.json();
        if (!payment?.confirmation?.confirmation_url) throw new Error('Invalid payment response');

        localStorage.setItem('pending_payment_id', payment.id);
        window.location.href = payment.confirmation.confirmation_url;

    } catch (error) {
        console.error('Payment error:', error);
        localStorage.removeItem('pending_payment_id');
        throw new Error('Ошибка инициализации платежа');
    }
}

export async function checkPaymentStatus(paymentId, userId) {
    if (isTesting) {
        console.log(`Тестовый режим: Проверка статуса платежа ${paymentId} пропущена.`);
        return true; // Симулируем успешный платеж
    }

    const SHOP_ID = import.meta.env.VITE_YKASSA_SHOP_ID;
    const SECRET_KEY = import.meta.env.VITE_YKASSA_SECRET_KEY;

    try {
        const response = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
            headers: { 'Authorization': 'Basic ' + btoa(`${SHOP_ID}:${SECRET_KEY}`) }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const payment = await response.json();
        
        if (payment.status === 'succeeded') {
            const { error } = await supabaseJs.from('payments').insert({
                id: payment.id,
                user_id: userId,
                amount: payment.amount.value,
                currency: payment.amount.currency,
                status: payment.status,
                category: payment.metadata.category
            });
            
            if (error) throw error;
            localStorage.removeItem('pending_payment_id');
            return true;
        }
        
        return false;

    } catch (error) {
        console.error('Payment check error:', error);
        localStorage.removeItem('pending_payment_id');
        return false;
    }
}